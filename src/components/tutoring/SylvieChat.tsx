'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useTutorStore, setStreaming } from '@/lib/tutor/sylvie-state';
import { SylvieAvatar } from './SylvieAvatar';

/**
 * SylvieChat — UI de conversación con la tutora. Reemplaza ChatTutor.
 *
 * Diferencias clave vs ChatTutor:
 *  - Estado vive en Zustand (compartido con SylvieWidget) en vez de useState local.
 *  - Lee contexto curricular + señales de sesión del store para enriquecer el
 *    payload a `/api/tutor` (currentExercise, consecutiveErrors, etc.).
 *  - Renderiza mensajes proactivos (`role: 'sylvie-proactive'`) con styling
 *    distinto del chat normal.
 *  - Historia persistida via store (localStorage, últimas 20).
 *  - Action buttons inline: pedir pista, ejemplo, explicar de otra forma.
 *
 * `mode='expanded'` (popover del widget) vs `mode='focus'` (pantalla completa)
 * solo cambia el styling — la lógica es la misma.
 */
export function SylvieChat({ mode = 'expanded' }: { mode?: 'expanded' | 'focus' }) {
  const locale = useLocale();
  const t = useTranslations('student.sylvie');

  const messages = useTutorStore((s) => s.messages);
  const isStreaming = useTutorStore((s) => s.isStreaming);
  const lesson = useTutorStore((s) => s.lessonContext);
  const pendingProactive = useTutorStore((s) => s.pendingProactive);
  const addMessage = useTutorStore((s) => s.addMessage);
  const appendAssistantToken = useTutorStore((s) => s.appendAssistantToken);
  const finishStreaming = useTutorStore((s) => s.finishStreaming);
  const recordInteraction = useTutorStore((s) => s.recordInteraction);
  const consumeProactive = useTutorStore((s) => s.consumeProactive);
  const setSylvieState = useTutorStore((s) => s.setSylvieState);
  const hydrateFromStorage = useTutorStore((s) => s.hydrateFromStorage);
  const clearHistory = useTutorStore((s) => s.clearHistory);

  const [input, setInput] = useState('');
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1) Hidratamos el historial de localStorage en mount.
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // 2) Si hay una intervención proactiva pendiente, la materializamos como
  //    mensaje de Sylvie en el chat. La cookie/UI ya marcó "leído".
  useEffect(() => {
    if (!pendingProactive) return;
    const trigger = consumeProactive();
    if (!trigger) return;
    try {
      const content = t(`proactive.${trigger.messageKey}`, trigger.messageParams ?? {});
      addMessage({ role: 'sylvie-proactive', content, ruleId: trigger.ruleId });
    } catch {
      // Si la key no existe (no debería), no rompemos.
    }
  }, [pendingProactive, consumeProactive, addMessage, t]);

  // 3) Auto-scroll al fondo cuando llegan mensajes.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function send(text: string) {
    if (!text.trim() || isStreaming) return;

    recordInteraction();
    addMessage({ role: 'user', content: text });

    // Snapshot ANTES de agregar el assistant placeholder, así no incluimos el
    // string vacío en el payload al backend.
    const snapshotBefore = useTutorStore.getState();
    const messagesForRequest = snapshotBefore.messages
      .filter((m) => m.role !== 'sylvie-proactive')
      .map((m) => ({
        role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
        content: m.content
      }));
    const session = snapshotBefore.getSessionSnapshot();

    const assistantId = addMessage({ role: 'assistant', content: '' });
    setStreaming(true);
    setSylvieState('explaining');
    setInput('');

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        signal: ctrl.signal,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          locale: locale === 'en' ? 'en' : 'es',
          messages: messagesForRequest,
          studentFirstName: snapshotBefore.studentFirstName ?? undefined,
          gradeLevel: lesson?.gradeLevel,
          lessonTitle: lesson
            ? locale === 'en'
              ? lesson.titleEn
              : lesson.titleEs
            : undefined,
          subject: lesson?.subject,
          currentExercise: session.currentExercise || undefined,
          totalExercises: session.totalExercises || undefined,
          consecutiveErrors: session.consecutiveErrors || undefined,
          msSinceLastAttempt: session.msSinceLastExercise
        })
      });

      // Si el servidor devolvio un error explicito (JSON con `errorMessage`),
      // lo mostramos textual al estudiante en vez del fallback generico.
      if (!res.ok) {
        let detail = '';
        try {
          const payload = (await res.json()) as { errorMessage?: string; error?: string };
          detail = payload.errorMessage ?? payload.error ?? '';
        } catch {
          /* no JSON */
        }
        appendAssistantToken(assistantId, detail || t('error.generic'));
        return;
      }
      if (!res.body) {
        appendAssistantToken(assistantId, t('error.generic'));
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let received = 0;
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        if (token) {
          received += token.length;
          appendAssistantToken(assistantId, token);
        }
      }
      // Stream cerrado sin un solo token: algo se rompio en upstream y se
      // perdio silenciosamente. Mostramos el fallback en vez de dejar el
      // bubble vacio (causa raiz del bug "Sylvie no responde nada").
      if (received === 0) {
        appendAssistantToken(assistantId, t('error.generic'));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error(err);
        appendAssistantToken(assistantId, t('error.generic'));
      }
    } finally {
      finishStreaming();
      abortRef.current = null;
    }
  }

  const placeholder = lesson
    ? t('placeholder.lesson', {
        topic: locale === 'en' ? lesson.titleEn : lesson.titleEs
      })
    : t('placeholder.default');

  const isFocus = mode === 'focus';
  const scrollHeight = isFocus ? 'max-h-[60vh]' : 'max-h-[44vh] sm:max-h-[50vh]';

  return (
    <div className={`flex flex-col gap-3 ${isFocus ? 'h-full' : ''}`}>
      <div
        ref={scrollRef}
        aria-live="polite"
        className={`flex-1 space-y-3 overflow-y-auto pr-1 ${scrollHeight}`}
      >
        {messages.length === 0 ? (
          <EmptyState lessonTitle={lesson ? (locale === 'en' ? lesson.titleEn : lesson.titleEs) : null} />
        ) : (
          messages.map((m) => <MessageBubble key={m.id} message={m} thinkingLabel={t('thinking')} />)
        )}
      </div>

      <ActionRow
        disabled={isStreaming}
        onAction={(prompt) => send(prompt)}
        labels={{
          hint: t('action.hint'),
          example: t('action.example'),
          explainAgain: t('action.explainAgain')
        }}
        prompts={{
          hint: t('actionPrompt.hint'),
          example: t('actionPrompt.example'),
          explainAgain: t('actionPrompt.explainAgain')
        }}
      />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="flex gap-2"
      >
        <label className="sr-only" htmlFor="sylvie-input">
          {placeholder}
        </label>
        <input
          id="sylvie-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={placeholder}
          disabled={isStreaming}
          className="flex-1 rounded-xl bg-white ring-1 ring-midsea-ocean/20 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isStreaming || !input.trim()}
          className="rounded-xl bg-midsea-deep px-4 py-2 text-sm font-semibold text-white shadow-wave disabled:opacity-50 hover:bg-midsea-lagoon"
        >
          {t('send')}
        </button>
      </form>

      {messages.length > 0 ? (
        <button
          type="button"
          onClick={() => clearHistory()}
          className="self-end text-[11px] text-midsea-ink/50 hover:text-midsea-coral hover:underline"
        >
          {t('clearHistory')}
        </button>
      ) : null}
    </div>
  );
}

function EmptyState({ lessonTitle }: { lessonTitle: string | null }) {
  return (
    <div className="grid place-items-center py-6 text-center">
      <SylvieAvatar state="active" size="md" />
      <p className="mt-3 text-sm text-midsea-ink/70">
        {lessonTitle
          ? `Sylvie está lista para ayudarte con «${lessonTitle}».`
          : 'Sylvie está aquí cuando la necesites.'}
      </p>
    </div>
  );
}

function MessageBubble({
  message,
  thinkingLabel
}: {
  message: { id: string; role: 'user' | 'assistant' | 'sylvie-proactive'; content: string };
  thinkingLabel: string;
}) {
  if (message.role === 'user') {
    return (
      <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-midsea-deep px-4 py-2 text-sm text-white">
        {message.content}
      </div>
    );
  }
  if (message.role === 'sylvie-proactive') {
    return (
      <div className="mr-auto flex max-w-[85%] items-start gap-2 rounded-2xl rounded-bl-sm bg-midsea-coral/10 px-4 py-2 text-sm text-midsea-deep ring-1 ring-midsea-coral/30">
        <span aria-hidden className="mt-0.5 inline-block h-2 w-2 shrink-0 rounded-full bg-midsea-coral" />
        <span>{message.content}</span>
      </div>
    );
  }
  // assistant
  return (
    <div className="mr-auto max-w-[85%] rounded-2xl rounded-bl-sm bg-midsea-foam px-4 py-2 text-sm text-midsea-deep">
      {message.content || (
        <span className="inline-flex items-center gap-1 text-midsea-lagoon">
          <span className="h-2 w-2 rounded-full bg-midsea-lagoon animate-ripple" />
          {thinkingLabel}
        </span>
      )}
    </div>
  );
}

function ActionRow({
  disabled,
  onAction,
  labels,
  prompts
}: {
  disabled: boolean;
  onAction: (prompt: string) => void;
  labels: { hint: string; example: string; explainAgain: string };
  prompts: { hint: string; example: string; explainAgain: string };
}) {
  const actions = [
    { label: labels.hint, prompt: prompts.hint },
    { label: labels.example, prompt: prompts.example },
    { label: labels.explainAgain, prompt: prompts.explainAgain }
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          disabled={disabled}
          onClick={() => onAction(a.prompt)}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam disabled:opacity-50"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
