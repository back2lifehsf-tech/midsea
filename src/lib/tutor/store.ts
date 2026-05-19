'use client';
import { create } from 'zustand';
import { SseEventParser } from './sse-parser';
import type { TutorMessageDto } from './types';

/**
 * Store del chat de Sylvie. Epic 02 §4.
 *
 * Responsabilidades:
 *   - Estado UI de mensajes (user + assistant en stream).
 *   - Estado del avatar derivado del ciclo de la conversación.
 *   - Acción `sendMessage` que postea a /api/tutor/chat y consume SSE.
 *
 * Por qué Zustand y no useState en el componente: queremos que la UI
 * del avatar (mounted en el header del /stuck) y la UI del input (en
 * el footer) compartan el mismo ciclo `thinking → speaking → idle`
 * sin prop-drilling y sin re-render por cada token. Zustand sólo
 * suscribe a los slices que cada componente lee.
 */

export type AvatarState = 'idle' | 'thinking' | 'speaking' | 'celebrating';

export interface SylvieUiMessage {
  /** id local; los mensajes históricos usan el cuid de Prisma. */
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** true mientras streaming; false al recibir `done`. */
  pending?: boolean;
}

interface TutorStoreState {
  messages: SylvieUiMessage[];
  avatarState: AvatarState;
  isStreaming: boolean;
  errorText: string | null;

  hydrate(initial: TutorMessageDto[]): void;
  reset(): void;
  sendMessage(text: string): Promise<void>;
}

export const useTutorStore = create<TutorStoreState>((set, get) => ({
  messages: [],
  avatarState: 'idle',
  isStreaming: false,
  errorText: null,

  hydrate(initial) {
    set({
      messages: initial
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content
        })),
      avatarState: 'idle',
      isStreaming: false,
      errorText: null
    });
  },

  reset() {
    set({
      messages: [],
      avatarState: 'idle',
      isStreaming: false,
      errorText: null
    });
  },

  async sendMessage(text) {
    if (get().isStreaming) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const now = Date.now();
    const userId = `u-${now}`;
    const assistantId = `a-${now}`;

    set((state) => ({
      messages: [
        ...state.messages,
        { id: userId, role: 'user', content: trimmed },
        { id: assistantId, role: 'assistant', content: '', pending: true }
      ],
      avatarState: 'thinking',
      isStreaming: true,
      errorText: null
    }));

    try {
      const res = await fetch('/api/tutor/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: trimmed })
      });

      if (!res.ok || !res.body) {
        // JSON error (400/401/500). El stream nunca empezó.
        let code = `http_${res.status}`;
        try {
          const j = (await res.json()) as { error?: string };
          if (typeof j.error === 'string') code = j.error;
        } catch {
          /* keep code */
        }
        finalizeWithError(set, assistantId, code);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      const parser = new SseEventParser();
      let firstToken = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const events = parser.feed(chunk);

        for (const ev of events) {
          if (ev.type === 'token') {
            if (firstToken) {
              firstToken = false;
              set({ avatarState: 'speaking' });
            }
            const t = ev.value;
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantId ? { ...m, content: m.content + t } : m
              )
            }));
          } else if (ev.type === 'error') {
            finalizeWithError(set, assistantId, ev.value);
            return;
          } else if (ev.type === 'done') {
            set((state) => ({
              messages: state.messages.map((m) =>
                m.id === assistantId ? { ...m, pending: false } : m
              ),
              avatarState: 'idle',
              isStreaming: false
            }));
            return;
          }
        }
      }

      // Stream cerrado sin done — lo tratamos como done implícito.
      set((state) => ({
        messages: state.messages.map((m) =>
          m.id === assistantId ? { ...m, pending: false } : m
        ),
        avatarState: 'idle',
        isStreaming: false
      }));
    } catch (e) {
      finalizeWithError(set, assistantId, (e as Error).message ?? 'network');
    }
  }
}));

function finalizeWithError(
  set: (
    partial:
      | Partial<TutorStoreState>
      | ((state: TutorStoreState) => Partial<TutorStoreState>)
  ) => void,
  assistantId: string,
  message: string
) {
  set((state) => ({
    messages: state.messages.map((m) =>
      m.id === assistantId ? { ...m, pending: false } : m
    ),
    avatarState: 'idle',
    isStreaming: false,
    errorText: message
  }));
}
