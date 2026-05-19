/**
 * Parser de eventos SSE para el cliente. Epic 02 §3.
 *
 * El endpoint /api/tutor/chat emite líneas con formato:
 *   data: {"token":"..."}\n\n
 *   data: {"done":true}\n\n
 *   data: {"error":"..."}\n\n
 *
 * Este parser:
 *   - Acumula chunks parciales (un evento puede cruzar fronteras de chunk).
 *   - Emite eventos completos cuando ve `\n\n`.
 *   - Tolera bytes basura (líneas que no empiezan con `data:` se ignoran;
 *     JSON malformado se ignora silenciosamente).
 *
 * Diseñado como clase con estado (`buffer`) en vez de generator porque
 * Zustand prefiere imperative dentro de actions. Tests aíslan la clase
 * sin tocar fetch/store.
 */

export type SseEvent =
  | { type: 'token'; value: string }
  | { type: 'done' }
  | { type: 'error'; value: string };

export class SseEventParser {
  private buffer = '';

  feed(chunk: string): SseEvent[] {
    this.buffer += chunk;
    const events: SseEvent[] = [];

    let sepIdx: number;
    while ((sepIdx = this.buffer.indexOf('\n\n')) !== -1) {
      const block = this.buffer.slice(0, sepIdx);
      this.buffer = this.buffer.slice(sepIdx + 2);
      const evt = parseBlock(block);
      if (evt) events.push(evt);
    }
    return events;
  }

  /** Devuelve true si quedó payload sin terminar (chunk parcial). */
  hasPending(): boolean {
    return this.buffer.length > 0;
  }
}

function parseBlock(block: string): SseEvent | null {
  // Spec SSE: cada evento puede tener múltiples líneas (event:, data:, id:);
  // solo nos interesa `data:`. Soportamos solo una línea data por evento.
  const dataLine = block.split('\n').find((l) => l.startsWith('data:'));
  if (!dataLine) return null;
  const json = dataLine.slice('data:'.length).trim();
  if (!json) return null;

  let payload: { token?: unknown; done?: unknown; error?: unknown };
  try {
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  if (typeof payload.token === 'string') {
    return { type: 'token', value: payload.token };
  }
  if (payload.done === true) {
    return { type: 'done' };
  }
  if (typeof payload.error === 'string') {
    return { type: 'error', value: payload.error };
  }
  return null;
}
