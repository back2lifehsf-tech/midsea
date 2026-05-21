'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AngelaAvatar } from '@/components/tutoring/AngelaAvatar';
import { useTutorStore, type AngelaUiMessage } from '@/lib/tutor/store';
import type { AngelaState } from '@/lib/tutor/angela-state';
import type { TutorMessageDto } from '@/lib/tutor/types';
import { parseChainOfThought } from '@/lib/tutor/cot-parser';

/**
 * Mapea el estado del store v2 de /stuck (`idle|thinking|speaking|celebrating`)
 * al union del AngelaAvatar canónico (v1) usado en el header del student
 * space. Unifica el look visual: la cara kawaii amarilla aparece en
 * ambos surfaces (Epic 02.5 + bug-fix).
 */
function mapStoreStateToAvatar(
  s: 'idle' | 'thinking' | 'speaking' | 'celebrating'
): AngelaState {
  if (s === 'thinking') return 'explaining';
  if (s === 'speaking') return 'active';
  return s;
}

interface StuckChatProps {
  initialMessages: TutorMessageDto[];
  studentName: string;
}

/**
 * Host del chat de Angela en /stuck. Epic 02 §4 + §5.
 *
 * Mobile-first: pantalla completa con header sticky + lista scroll +
 * input fijo abajo. En desktop hereda el max-w del layout padre.
 *
 * a11y: lista `aria-live="polite"` para que screen readers anuncien
 * tokens entrantes sin interrumpir lo que ya se está leyendo.
 */
export function StuckChat({ initialMessages, studentName }: StuckChatProps) {
  const t = useTranslations('student.angela');
  const tErr = useTranslations('auth.errors');

  const messages = useTutorStore((s) => s.messages);
  const avatarState = useTutorStore((s) => s.avatarState);
  const isStreaming = useTutorStore((s) => s.isStreaming);
  const errorText = useTutorStore((s) => s.errorText);
  const sendMessage = useTutorStore((s) => s.sendMessage);
  const hydrate = useTutorStore((s) => s.hydrate);
  const reset = useTutorStore((s) => s.reset);

  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    hydrate(initialMessages);
    return reset;
  }, [initialMessages, hydrate, reset]);

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || isStreaming) return;
    setDraft('');
    void sendMessage(text);
    inputRef.current?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] bg-white">
      <header className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 sticky top-0 bg-white z-10">
        <AngelaAvatar
          state={mapStoreStateToAvatar(avatarState)}
          size="sm"
          ariaLabel={t(avatarState === 'thinking' ? 'thinking' : 'focusTitle')}
        />
        <div className="min-w-0 flex-1">
          <h1 className="font-bold text-slate-900 truncate">
            {t('focusTitle')}
          </h1>
          <p className="text-xs text-slate-500 line-clamp-2">{t('disclaimer')}</p>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
        aria-live="polite"
        aria-busy={isStreaming}
      >
        {messages.length === 0 && (
          <div className="mt-12 flex flex-col items-center px-4 text-center text-slate-400">
            <AngelaAvatar
              state="idle"
              size="lg"
              ariaLabel={t('focusTitle')}
            />
            <p className="mt-4">{t('placeholder.default')}</p>
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} message={m} studentName={studentName} />
        ))}
        {errorText && (
          <p
            role="alert"
            className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-3 py-2 rounded-lg"
          >
            {tErr('generic')}
          </p>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="border-t border-slate-200 p-3 flex gap-2 items-end sticky bottom-0 bg-white"
      >
        <label htmlFor="angela-input" className="sr-only">
          {t('focusTitle')}
        </label>
        <textarea
          ref={inputRef}
          id="angela-input"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={isStreaming}
          placeholder={t('placeholder.default')}
          rows={1}
          maxLength={2000}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-xl resize-none text-base focus:outline-none focus:ring-2 focus:ring-teal-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isStreaming || !draft.trim()}
          className="px-4 py-2 bg-teal-600 text-white font-medium rounded-xl disabled:opacity-50 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 transition-colors"
        >
          {isStreaming ? t('thinking') : t('send')}
        </button>
      </form>
    </div>
  );
}

function Bubble({
  message,
  studentName
}: {
  message: AngelaUiMessage;
  studentName: string;
}) {
  const isUser = message.role === 'user';
  const showDots = message.role === 'assistant' && message.pending && !message.content;

  // Epic 02.5 §5: si la respuesta de Angela contiene `### Paso N` / `### Step N`
  // headers, renderizamos los pasos como tarjetas apiladas — visual sectioning
  // sin animación de transición (deferida a Pendiente Epic 04).
  const parsed =
    !isUser && message.content && !showDots
      ? parseChainOfThought(message.content)
      : null;
  const hasSteps = parsed?.hasSteps ?? false;

  if (hasSteps && parsed) {
    return (
      <div className="flex justify-start" data-role={message.role}>
        <div
          className="max-w-[85%] space-y-2 text-base text-slate-900"
          aria-label="Angela"
        >
          {parsed.preamble ? (
            <div className="whitespace-pre-wrap break-words rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-2">
              {parsed.preamble}
            </div>
          ) : null}
          {parsed.steps.map((step, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white px-4 py-3"
              data-step={i + 1}
            >
              <p className="mb-1 text-xs font-bold uppercase tracking-wide text-midsea-lagoon">
                {step.label}
              </p>
              <p className="whitespace-pre-wrap break-words text-slate-900">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={isUser ? 'flex justify-end' : 'flex justify-start'}
      data-role={message.role}
    >
      <div
        className={`max-w-[85%] px-4 py-2 rounded-2xl whitespace-pre-wrap break-words text-base ${
          isUser
            ? 'bg-sky-600 text-white rounded-br-sm'
            : 'bg-slate-100 text-slate-900 rounded-bl-sm'
        }`}
        aria-label={isUser ? studentName : 'Angela'}
      >
        {showDots ? (
          <span className="inline-flex gap-1">
            <Dot delay="0" />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
        ) : (
          message.content
        )}
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: string }) {
  return (
    <span
      className="w-2 h-2 rounded-full bg-slate-500 inline-block animate-bounce"
      style={{ animationDelay: delay }}
      aria-hidden
    />
  );
}
