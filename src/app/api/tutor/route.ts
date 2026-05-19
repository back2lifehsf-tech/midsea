import { NextRequest } from 'next/server';
import { getOpenAI, TUTOR_MODEL } from '@/lib/openai';
import { buildAngelaSystemPrompt } from '@/lib/tutor/prompts/angela-system';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface TutorRequest {
  locale: 'es' | 'en';
  messages: IncomingMessage[];
  studentFirstName?: string;
  gradeLevel?: number;
  // Contexto curricular (puede llegar como lessonTitle o legacy `topic`).
  lessonTitle?: string;
  topic?: string;
  subject?: string;
  // Senales de sesion (opcional — Angela las usa para personalizar).
  currentExercise?: number;
  totalExercises?: number;
  consecutiveErrors?: number;
  msSinceLastAttempt?: number;
}

// Devuelve un objeto de error para mostrar al estudiante. El cliente lee este
// payload y muestra `errorMessage` si esta presente. Diferenciamos `code` para
// que la UI pueda dar copy distinto a quota / rate-limit / network.
function errorResponse(status: number, code: string, errorMessage: string) {
  return new Response(JSON.stringify({ error: code, errorMessage }), {
    status,
    headers: { 'content-type': 'application/json' }
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return errorResponse(
      500,
      'missing_api_key',
      'OPENAI_API_KEY no esta configurada en el servidor.'
    );
  }

  let body: TutorRequest;
  try {
    body = (await req.json()) as TutorRequest;
  } catch {
    return errorResponse(400, 'invalid_json', 'Body invalido.');
  }

  const locale = body.locale === 'en' ? 'en' : 'es';
  const userMessages = Array.isArray(body.messages) ? body.messages.slice(-12) : [];

  const system = buildAngelaSystemPrompt({
    locale,
    studentFirstName: body.studentFirstName,
    gradeLevel: body.gradeLevel,
    lessonTitle: body.lessonTitle ?? body.topic,
    subject: body.subject,
    currentExercise: body.currentExercise,
    totalExercises: body.totalExercises,
    consecutiveErrors: body.consecutiveErrors,
    msSinceLastAttempt: body.msSinceLastAttempt
  });

  const client = getOpenAI();

  // IMPORTANTE: la llamada a OpenAI puede fallar SINCRONO con quota/rate-limit
  // antes de que se abra ningun stream. Si lo manejamos en el ReadableStream
  // start() ya es tarde — el cliente recibe 200 con body vacio y silencia el
  // error. Por eso intentamos crear la completion antes de retornar el Response.
  let completion: Awaited<ReturnType<typeof client.chat.completions.create>>;
  try {
    completion = await client.chat.completions.create({
      model: TUTOR_MODEL,
      temperature: 0.6,
      stream: true,
      messages: [
        { role: 'system', content: system },
        ...userMessages.map((m) => ({ role: m.role, content: m.content }))
      ]
    });
  } catch (err: unknown) {
    return mapOpenAIError(err);
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of completion) {
          const delta = chunk.choices?.[0]?.delta?.content;
          if (delta) controller.enqueue(encoder.encode(delta));
        }
        controller.close();
      } catch (err) {
        // Error mid-stream: emitimos un marcador para que el cliente sepa que
        // algo se rompio en medio. Sin esto, el cliente termina sin contenido
        // y luce como "Angela no respondio".
        const errText =
          locale === 'en'
            ? '\n\n[Stream interrupted — try again.]'
            : '\n\n[Se cortó la respuesta — intenta de nuevo.]';
        try {
          controller.enqueue(encoder.encode(errText));
        } catch {
          /* controller cerrado */
        }
        controller.close();
        // Tambien loggeamos en server para diagnostico.
        console.error('[/api/tutor] stream error:', err);
      }
    }
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff'
    }
  });
}

// Mapea errores comunes de la SDK de OpenAI a respuestas claras para el cliente.
function mapOpenAIError(err: unknown): Response {
  // Loguear en server siempre — facilita debugging desde Vercel logs.
  console.error('[/api/tutor] OpenAI error:', err);

  const e = err as { status?: number; code?: string; type?: string; message?: string };
  const status = typeof e?.status === 'number' ? e.status : 500;
  const code = e?.code ?? e?.type ?? 'openai_error';

  if (code === 'insufficient_quota' || status === 429) {
    return errorResponse(
      status === 429 ? 429 : 402,
      'insufficient_quota',
      'La cuenta de OpenAI no tiene saldo. Avísale a un adulto que recargue créditos.'
    );
  }
  if (code === 'invalid_api_key' || status === 401) {
    return errorResponse(
      401,
      'invalid_api_key',
      'La clave de OpenAI no es válida. Revisa la configuración del servidor.'
    );
  }
  if (status === 503 || status === 502 || status === 504) {
    return errorResponse(
      status,
      'upstream_unavailable',
      'OpenAI no está disponible en este momento. Intenta de nuevo en un minuto.'
    );
  }
  return errorResponse(
    status,
    code,
    e?.message ?? 'Algo salió mal hablando con Angela.'
  );
}
