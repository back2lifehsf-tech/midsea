'use client';
/**
 * Activities intercaladas en la leccion. Epic 04 Tarea 5.
 *
 * 4 tipos soportados v1 (ADR-006, esquema en src/lib/schemas/lesson-ingest.ts):
 *   - multiple_choice — 4 opciones, 1 correcta.
 *   - fill_in_blank — texto libre, comparado contra acceptedAnswers.
 *   - short_answer — texto libre, scoring por keyword overlap (>=1
 *     keyword match cuenta como correcta).
 *   - step_by_step — N pasos pre-shuffled, estudiante reordena con
 *     botones up/down (NO drag-and-drop en v1 per guardrail).
 *
 * Scoring local (no API call) — son ejercicios de practica intercalados,
 * el quiz final es lo que dispara Coin (componente separado).
 */
import { useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { InlineMath } from 'react-katex';
import { normalize, keywordMatches } from '@/lib/learning/scoring';

export type ActivityData =
  | {
      type: 'multiple_choice';
      promptEs: string;
      promptEn: string;
      optionsEs: string[];
      optionsEn: string[];
      correctIndex: number;
      explanationEs?: string;
      explanationEn?: string;
    }
  | {
      type: 'fill_in_blank';
      promptEs: string;
      promptEn: string;
      acceptedAnswersEs: string[];
      acceptedAnswersEn: string[];
      explanationEs?: string;
      explanationEn?: string;
    }
  | {
      type: 'short_answer';
      promptEs: string;
      promptEn: string;
      rubricKeywordsEs: string[];
      rubricKeywordsEn: string[];
      sampleAnswerEs?: string;
      sampleAnswerEn?: string;
    }
  | {
      type: 'step_by_step';
      promptEs: string;
      promptEn: string;
      stepsEs: string[];
      stepsEn: string[];
      explanationEs?: string;
      explanationEn?: string;
    };

interface ActivityProps {
  activity: ActivityData;
  isEs: boolean;
  index: number;
}

/** Renderiza un texto que puede contener KaTeX inline (`$...$`). */
function RichText({ value }: { value: string }) {
  const parts = value.split(/(\$[^$\n]+\$)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p.startsWith('$') && p.endsWith('$') && p.length > 1) {
          return <InlineMath key={i} math={p.slice(1, -1)} />;
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

function Shell({
  index,
  prompt,
  children
}: {
  index: number;
  prompt: string;
  children: React.ReactNode;
}) {
  const t = useTranslations('student.lesson.activity');
  return (
    <section className="my-6 rounded-2xl bg-midsea-foam/40 p-5 ring-1 ring-midsea-ocean/15">
      <p className="text-xs font-semibold uppercase tracking-wide text-midsea-ocean">
        {t('label', { n: index + 1 })}
      </p>
      <p className="mt-2 font-medium text-midsea-deep">
        <RichText value={prompt} />
      </p>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FeedbackBox({ ok, message }: { ok: boolean; message: string }) {
  return (
    <p
      role="status"
      className={[
        'mt-3 rounded-xl px-3 py-2 text-sm',
        ok ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
      ].join(' ')}
    >
      {message}
    </p>
  );
}

function MultipleChoice({ activity, isEs, index }: ActivityProps) {
  const t = useTranslations('student.lesson.activity');
  const [picked, setPicked] = useState<number | null>(null);
  if (activity.type !== 'multiple_choice') return null;
  const options = isEs ? activity.optionsEs : activity.optionsEn;
  const prompt = isEs ? activity.promptEs : activity.promptEn;
  const explanation = isEs ? activity.explanationEs : activity.explanationEn;
  const isCorrect = picked === activity.correctIndex;
  return (
    <Shell index={index} prompt={prompt}>
      <ul className="space-y-2">
        {options.map((opt, i) => {
          const isPicked = picked === i;
          const isThisCorrect = i === activity.correctIndex;
          const showAsCorrect = picked !== null && isThisCorrect;
          const showAsWrong = isPicked && !isThisCorrect;
          return (
            <li key={i}>
              <button
                type="button"
                disabled={picked !== null}
                onClick={() => setPicked(i)}
                className={[
                  'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition',
                  showAsCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-900'
                    : showAsWrong
                      ? 'border-rose-400 bg-rose-50 text-rose-900'
                      : 'border-midsea-ocean/15 bg-white text-midsea-ink hover:border-midsea-ocean/40',
                  picked !== null ? 'cursor-default' : 'cursor-pointer'
                ].join(' ')}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-midsea-ocean/10 text-xs font-semibold text-midsea-deep">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>
                  <RichText value={opt} />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {picked !== null ? (
        <FeedbackBox
          ok={isCorrect}
          message={
            isCorrect
              ? (explanation ?? t('correct'))
              : `${t('incorrect')}${explanation ? ` — ${explanation}` : ''}`
          }
        />
      ) : null}
    </Shell>
  );
}

function FillInBlank({ activity, isEs, index }: ActivityProps) {
  const t = useTranslations('student.lesson.activity');
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  if (activity.type !== 'fill_in_blank') return null;
  const accepted = isEs ? activity.acceptedAnswersEs : activity.acceptedAnswersEn;
  const prompt = isEs ? activity.promptEs : activity.promptEn;
  const explanation = isEs ? activity.explanationEs : activity.explanationEn;
  const isCorrect =
    submitted && accepted.some((a) => normalize(a) === normalize(value));
  return (
    <Shell index={index} prompt={prompt}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="flex flex-wrap items-center gap-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (submitted) setSubmitted(false);
          }}
          aria-label={prompt}
          className="flex-1 min-w-[180px] rounded-xl border border-midsea-ocean/20 bg-white px-3 py-2 text-sm focus:border-midsea-ocean focus:outline-none focus:ring-2 focus:ring-midsea-ocean/40"
          placeholder={t('inputPlaceholder')}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl bg-midsea-lagoon px-4 py-2 text-sm font-medium text-white hover:bg-midsea-ocean disabled:opacity-50"
        >
          {t('check')}
        </button>
      </form>
      {submitted ? (
        <FeedbackBox
          ok={isCorrect}
          message={
            isCorrect
              ? (explanation ?? t('correct'))
              : `${t('incorrect')} — ${t('acceptedAnswers')}: ${accepted.join(', ')}`
          }
        />
      ) : null}
    </Shell>
  );
}

function ShortAnswer({ activity, isEs, index }: ActivityProps) {
  const t = useTranslations('student.lesson.activity');
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const keywords = useMemo(
    () =>
      activity.type === 'short_answer'
        ? isEs
          ? activity.rubricKeywordsEs
          : activity.rubricKeywordsEn
        : [],
    [activity, isEs]
  );
  const hits = useMemo(() => {
    if (!submitted) return 0;
    // Mismo stemming heuristico que el API quiz (scoring.ts) — acepta
    // variantes morfologicas: `fracción` matchea keyword `fracciones`,
    // etc. Ver scoring.ts § keywordMatches para detalles.
    return keywords.filter((k) => keywordMatches(value, k)).length;
  }, [submitted, value, keywords]);
  if (activity.type !== 'short_answer') return null;
  const prompt = isEs ? activity.promptEs : activity.promptEn;
  const sample = isEs ? activity.sampleAnswerEs : activity.sampleAnswerEn;
  const ok = hits >= 1;
  return (
    <Shell index={index} prompt={prompt}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
        className="space-y-2"
      >
        <textarea
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (submitted) setSubmitted(false);
          }}
          aria-label={prompt}
          rows={3}
          className="w-full rounded-xl border border-midsea-ocean/20 bg-white px-3 py-2 text-sm focus:border-midsea-ocean focus:outline-none focus:ring-2 focus:ring-midsea-ocean/40"
          placeholder={t('inputPlaceholderShort')}
        />
        <button
          type="submit"
          disabled={!value.trim()}
          className="rounded-xl bg-midsea-lagoon px-4 py-2 text-sm font-medium text-white hover:bg-midsea-ocean disabled:opacity-50"
        >
          {t('check')}
        </button>
      </form>
      {submitted ? (
        <>
          <FeedbackBox
            ok={ok}
            message={
              ok
                ? t('shortOk', { hits, total: keywords.length })
                : t('shortMissed', { keywords: keywords.join(', ') })
            }
          />
          {sample ? (
            <details className="mt-2 text-sm text-midsea-ink/70">
              <summary className="cursor-pointer">{t('sampleAnswer')}</summary>
              <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 ring-1 ring-midsea-ocean/10">
                {sample}
              </p>
            </details>
          ) : null}
        </>
      ) : null}
    </Shell>
  );
}

function StepByStep({ activity, isEs, index }: ActivityProps) {
  const t = useTranslations('student.lesson.activity');
  const canonical = useMemo(
    () =>
      activity.type === 'step_by_step'
        ? isEs
          ? activity.stepsEs
          : activity.stepsEn
        : [],
    [activity, isEs]
  );
  // Shuffle deterministico: invertimos los pasos para que NUNCA empiecen
  // en orden correcto. Eso evita el caso degenerado de step_by_step de
  // 2 pasos donde un shuffle aleatorio podria coincidir con el orden
  // canonico. Si solo hay 2 pasos, invertir es la unica permutacion
  // distinta posible.
  const shuffled = useMemo(() => canonical.slice().reverse(), [canonical]);
  const indexedShuffled = useMemo(
    () =>
      shuffled.map((text) => ({
        text,
        canonicalIdx: canonical.indexOf(text)
      })),
    [canonical, shuffled]
  );
  const [order, setOrder] = useState(indexedShuffled);
  const [submitted, setSubmitted] = useState(false);
  if (activity.type !== 'step_by_step') return null;
  const prompt = isEs ? activity.promptEs : activity.promptEn;
  const explanation = isEs ? activity.explanationEs : activity.explanationEn;
  const isCorrect =
    submitted && order.every((s, i) => s.canonicalIdx === i);
  const move = (from: number, to: number) => {
    if (submitted) return;
    if (to < 0 || to >= order.length) return;
    const next = order.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setOrder(next);
  };
  return (
    <Shell index={index} prompt={prompt}>
      <p className="mb-2 text-xs text-midsea-ink/60">{t('stepHint')}</p>
      <ol className="space-y-2">
        {order.map((step, i) => (
          <li
            key={`${step.canonicalIdx}-${i}`}
            className="flex items-center gap-2 rounded-xl border border-midsea-ocean/15 bg-white px-3 py-2 text-sm"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-midsea-ocean/10 text-xs font-semibold text-midsea-deep">
              {i + 1}
            </span>
            <span className="flex-1">
              <RichText value={step.text} />
            </span>
            <div className="flex shrink-0 flex-col">
              <button
                type="button"
                aria-label={t('moveUp')}
                disabled={i === 0 || submitted}
                onClick={() => move(i, i - 1)}
                className="px-1 text-midsea-ocean disabled:opacity-30"
              >
                ▲
              </button>
              <button
                type="button"
                aria-label={t('moveDown')}
                disabled={i === order.length - 1 || submitted}
                onClick={() => move(i, i + 1)}
                className="px-1 text-midsea-ocean disabled:opacity-30"
              >
                ▼
              </button>
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => setSubmitted(true)}
        disabled={submitted}
        className="mt-3 rounded-xl bg-midsea-lagoon px-4 py-2 text-sm font-medium text-white hover:bg-midsea-ocean disabled:opacity-50"
      >
        {t('check')}
      </button>
      {submitted ? (
        <FeedbackBox
          ok={isCorrect}
          message={
            isCorrect
              ? (explanation ?? t('correct'))
              : `${t('incorrectOrder')}${explanation ? ` — ${explanation}` : ''}`
          }
        />
      ) : null}
    </Shell>
  );
}

export function Activity({ activity, isEs, index }: ActivityProps) {
  switch (activity.type) {
    case 'multiple_choice':
      return <MultipleChoice activity={activity} isEs={isEs} index={index} />;
    case 'fill_in_blank':
      return <FillInBlank activity={activity} isEs={isEs} index={index} />;
    case 'short_answer':
      return <ShortAnswer activity={activity} isEs={isEs} index={index} />;
    case 'step_by_step':
      return <StepByStep activity={activity} isEs={isEs} index={index} />;
  }
}

export function ActivityList({
  activities,
  isEs
}: {
  activities: ActivityData[];
  isEs: boolean;
}) {
  return (
    <div>
      {activities.map((a, i) => (
        <Activity key={i} activity={a} isEs={isEs} index={i} />
      ))}
    </div>
  );
}
