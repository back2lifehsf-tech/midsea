'use client';

import { useRef, useState } from 'react';
import type { Locale } from '@/i18n';

interface Msg {
  role: 'user' | 'assistant';
  content: string;
}

interface Labels {
  placeholder: string;
  send: string;
  thinking: string;
  starters: string[];
}

export function ChatTutor({
  locale,
  labels,
  topic,
  studentFirstName,
  gradeLevel
}: {
  locale: Locale;
  labels: Labels;
  topic?: string;
  studentFirstName?: string;
  gradeLevel?: number;
}) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  async function send(text: string) {
    if (!text.trim() || streaming) return;
    const next: Msg[] = [...messages, { role: 'user', content: text }];
    setMessages([...next, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ locale, messages: next, topic, studentFirstName, gradeLevel })
      });

      if (!res.ok || !res.body) {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: 'assistant',
            content: locale === 'es' ? 'Hubo un problema. Intentalo de nuevo.' : 'Something went wrong. Try again.'
          };
          return copy;
        });
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error(err);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[1fr_auto]">
      <div className="midsea-card min-h-[420px] flex flex-col gap-3">
        <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
          {messages.length === 0 && (
            <div className="grid gap-2 sm:grid-cols-3">
              {labels.starters.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => send(s)}
                  className="rounded-xl bg-midsea-foam px-3 py-2 text-left text-sm text-midsea-deep hover:bg-white hover:shadow-wave transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={
                m.role === 'user'
                  ? 'ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-midsea-deep px-4 py-2 text-white'
                  : 'mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-midsea-foam px-4 py-2 text-midsea-deep'
              }
            >
              {m.content || (
                <span className="inline-flex items-center gap-1 text-midsea-ocean">
                  <span className="h-2 w-2 rounded-full bg-midsea-lagoon animate-ripple" />
                  {labels.thinking}
                </span>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex gap-2"
        >
          <label className="sr-only" htmlFor="tutor-input">
            {labels.placeholder}
          </label>
          <input
            id="tutor-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={labels.placeholder}
            disabled={streaming}
            className="flex-1 rounded-xl bg-white ring-1 ring-midsea-ocean/20 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="rounded-xl bg-midsea-deep px-4 py-2 text-sm font-semibold text-white shadow-wave disabled:opacity-50 hover:bg-midsea-ocean"
          >
            {labels.send}
          </button>
        </form>
      </div>
    </div>
  );
}
