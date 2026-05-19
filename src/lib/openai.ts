import 'server-only';
import OpenAI from 'openai';

let cached: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (cached) return cached;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set on the server.');
  }
  cached = new OpenAI({ apiKey });
  return cached;
}

export const TUTOR_MODEL = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

// El system prompt de Angela vive ahora en src/lib/tutor/prompts/angela-system.ts.
// Re-export para que consumidores existentes no rompan.
export { buildAngelaSystemPrompt } from './tutor/prompts/angela-system';
