import 'server-only';
import { getOpenAI, TUTOR_MODEL } from '@/lib/openai';
import { buildAngelaSystemPrompt, type AudienceTier } from './prompts';
import type { StudentSummary, TokenUsage } from './types';

/**
 * Generador de respuesta de Angela con streaming. Epic 02 §3.
 *
 * Diseño:
 *   - Devuelve `AsyncIterable<string>` (text deltas). El route handler
 *     hace el wrap a SSE.
 *   - `stream_options.include_usage` pide a OpenAI que emita un chunk
 *     final con tokens consumidos. El `onComplete` callback recibe esos
 *     valores para que el caller los persista en `TutorMessage.metadata`
 *     o `TutorUsageDaily.tokensUsed`.
 *   - Errores de OpenAI burbujean. El caller (route handler) los traduce
 *     en un mensaje amable de Angela (Epic 02 §3#8) — NO los devolvemos
 *     mezclados con tokens del stream porque rompe la semántica del SSE.
 *
 * No hacemos retry interno. Si la API falla, el estudiante reintenta el
 * turno (el mensaje user ya quedó persistido por el caller; sólo se
 * pierde el draft del assistant). Trade-off intencional en v1.
 */

export interface GenerateStreamParams {
  locale: 'es' | 'en';
  student: StudentSummary;
  /**
   * Lista cronológica (más viejo → más nuevo) de turnos previos +
   * el mensaje del usuario actual al FINAL. El caller es responsable
   * de incluir ese último mensaje; ResponseGenerator no lo añade por sí
   * mismo para evitar duplicación si el caller ya lo persistió.
   */
  conversation: Array<{ role: 'user' | 'assistant'; content: string }>;
  /** Recibe el reporte de tokens cuando OpenAI cierra el stream. */
  onComplete?: (usage: TokenUsage) => void;
  /** CORE = K-6 (Epic 02), HS = pilot HS (Epic 02.5+). Default: HS. */
  audienceTier?: AudienceTier;
  /**
   * Override del modelo OpenAI (e.g., `gpt-4o` para problemas STEM
   * detectados por heurística en `model-selector.ts`). Default: el
   * `TUTOR_MODEL` (gpt-4o-mini) del cliente singleton.
   */
  model?: string;
}

export async function generateStream(
  params: GenerateStreamParams
): Promise<AsyncIterable<string>> {
  const {
    locale,
    student,
    conversation,
    onComplete,
    audienceTier = 'HS',
    model
  } = params;

  const systemPrompt = buildAngelaSystemPrompt(locale, student, audienceTier);
  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...conversation.map((m) => ({ role: m.role, content: m.content }))
  ];

  const stream = await getOpenAI().chat.completions.create({
    model: model ?? TUTOR_MODEL,
    messages,
    stream: true,
    stream_options: { include_usage: true }
  });

  return wrapStream(stream, onComplete);
}

async function* wrapStream(
  stream: AsyncIterable<unknown>,
  onComplete?: (usage: TokenUsage) => void
): AsyncIterable<string> {
  for await (const chunk of stream) {
    const c = chunk as {
      choices?: Array<{ delta?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };
    const delta = c.choices?.[0]?.delta?.content;
    if (delta) yield delta;
    if (c.usage && onComplete) {
      onComplete({
        promptTokens: c.usage.prompt_tokens ?? 0,
        completionTokens: c.usage.completion_tokens ?? 0,
        totalTokens: c.usage.total_tokens ?? 0,
        model: TUTOR_MODEL
      });
    }
  }
}

/** Export interno para tests (acceso directo al wrapper sin pasar por la API). */
export const __test = { wrapStream };
