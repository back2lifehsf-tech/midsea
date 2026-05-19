import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { getTranslations } from 'next-intl/server';
import { authOptions } from '@/app/api/auth/options';
import { loadStudentTutorContext } from '@/lib/tutor/StudentContextEngine';
import {
  getOrCreateTodaysSession,
  appendUserMessage,
  appendAssistantMessage
} from '@/lib/tutor/SessionContextEngine';
import { generateStream } from '@/lib/tutor/ResponseGenerator';
import {
  consumeOneOrThrow,
  recordTokens,
  RateLimitedError
} from '@/lib/tutor/rate-limit';
import type { TokenUsage } from '@/lib/tutor/types';

/**
 * POST /api/tutor/chat — SSE streaming endpoint para Angela.
 * Epic 02 §3.
 *
 * Body: `{ message: string }`
 *
 * Auth: requiere JWT con `studentId`. PARENT no entra aquí — el chat es
 * personal del estudiante. Devolvemos 401 sin redirect porque este es
 * un endpoint API, no un Server Component.
 *
 * Flujo:
 *   1. Validar mensaje (non-empty, len <= 2000).
 *   2. consumeOneOrThrow → si supera cap, devolvemos SSE con mensaje
 *      amable en su idioma (NO 429). Quincena UX para niños.
 *   3. loadStudentTutorContext → identity + últimos 20 turnos.
 *   4. getOrCreateTodaysSession + appendUserMessage (turno persiste antes
 *      de llamar OpenAI; si la API falla, el mensaje del user queda).
 *   5. generateStream → for-await yields tokens → SSE deltas
 *      `data: {"token":"..."}`.
 *   6. Al cerrar el stream, appendAssistantMessage con metadata de tokens
 *      + recordTokens en TutorUsageDaily + SSE `data: {"done":true}`.
 *   7. Si OpenAI falla mid-stream, SSE `data: {"error":"..."}` y close.
 *
 * Notas SSE:
 *   - `Cache-Control: no-cache, no-transform` y `X-Accel-Buffering: no`
 *     son críticos en Vercel: sin ellos, el edge buffer puede acumular
 *     hasta 256KB antes de flushear y el usuario vería todo de golpe.
 *   - No usamos `EventSource` en el cliente (es GET-only). El cliente
 *     hace `fetch(... POST ...)` + `response.body.getReader()` + manual
 *     parse de líneas `data: {...}\\n\\n`.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MSG_MAX_LEN = 2000;

function jsonError(status: number, code: string): Response {
  return new Response(JSON.stringify({ error: code }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

function sseHeaders(): HeadersInit {
  return {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  };
}

function sseStaticMessage(text: string): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(
        enc.encode(`data: ${JSON.stringify({ token: text })}\n\n`)
      );
      controller.enqueue(enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
      controller.close();
    }
  });
  return new Response(stream, { headers: sseHeaders() });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const studentId = session?.user?.studentId;
  if (!studentId) {
    return jsonError(401, 'unauthorized');
  }

  let body: { message?: unknown };
  try {
    body = (await req.json()) as { message?: unknown };
  } catch {
    return jsonError(400, 'invalid_json');
  }

  const raw = body.message;
  const message = typeof raw === 'string' ? raw.trim() : '';
  if (!message) return jsonError(400, 'message_required');
  if (message.length > MSG_MAX_LEN) return jsonError(400, 'message_too_long');

  // Cargo contexto ANTES de consumir cuota: para conocer el locale del
  // estudiante y poder responder el mensaje de rate-limit en su idioma.
  let ctx;
  try {
    ctx = await loadStudentTutorContext(studentId);
  } catch (e) {
    console.error('[tutor] failed to load student context:', e);
    return jsonError(500, 'context_failed');
  }
  const locale = ctx.student.locale;

  // Pre-cargo strings de fallback en el idioma del estudiante. next-intl
  // resuelve contra el bundle del locale (messages/{es,en}.json) y nos
  // permite mantener cero strings hardcodeados en el servidor.
  const tErr = await getTranslations({
    locale,
    namespace: 'student.angela.error'
  });

  try {
    await consumeOneOrThrow(studentId);
  } catch (e) {
    if (e instanceof RateLimitedError) {
      return sseStaticMessage(tErr('rateLimit'));
    }
    console.error('[tutor] rate-limit error:', e);
    return jsonError(500, 'rate_limit_failed');
  }

  // Persisto el turno del user + abro sesión del día.
  const tutorSession = await getOrCreateTodaysSession(studentId, locale);
  await appendUserMessage(tutorSession.id, message);

  // Construyo la conversación que va al LLM: histórico cronológico + el
  // mensaje actual al final.
  const conversation: Array<{ role: 'user' | 'assistant'; content: string }> = [
    ...ctx.recentMessages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
    { role: 'user', content: message }
  ];

  let usage: TokenUsage | undefined;
  let tokenStream: AsyncIterable<string>;
  try {
    tokenStream = await generateStream({
      locale,
      student: ctx.student,
      conversation,
      onComplete: (u) => {
        usage = u;
      }
    });
  } catch (e) {
    console.error('[tutor] openai create failed:', e);
    return sseStaticMessage(tErr('openai'));
  }

  const enc = new TextEncoder();
  const sseStream = new ReadableStream({
    async start(controller) {
      let fullText = '';
      try {
        for await (const tok of tokenStream) {
          fullText += tok;
          controller.enqueue(
            enc.encode(`data: ${JSON.stringify({ token: tok })}\n\n`)
          );
        }

        // Persisto assistant + tokens. Si fullText quedó vacío (raro,
        // típico de timeout), igual persisto un string vacío para
        // mantener la pareja user/assistant en historia.
        await appendAssistantMessage(
          tutorSession.id,
          fullText,
          usage
            ? {
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens,
                model: usage.model
              }
            : undefined
        );
        if (usage) {
          await recordTokens(studentId, usage.totalTokens);
          console.log('[tutor]', {
            studentId,
            sessionId: tutorSession.id,
            totalTokens: usage.totalTokens,
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            model: usage.model
          });
        }

        controller.enqueue(
          enc.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        );
      } catch (e) {
        console.error('[tutor] stream error:', e);
        controller.enqueue(
          enc.encode(
            `data: ${JSON.stringify({ error: tErr('openai') })}\n\n`
          )
        );
      } finally {
        controller.close();
      }
    }
  });

  return new Response(sseStream, { headers: sseHeaders() });
}
