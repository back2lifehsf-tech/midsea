'use client';
/**
 * Quiz final de la leccion — Epic 04 Tarea 5.
 *
 * Renderiza las preguntas (MC + fill + short_answer; sin step_by_step,
 * per scripts/prompts/lesson-generator-v1.md regla 6).
 *
 * Scoring server-side via POST /api/lessons/[slug]/quiz. La response
 * incluye `coinAwarded` que se muestra inline si mastery >=80%.
 *
 * Una sola submission por intento. Tras el resultado, "Reintentar"
 * limpia el state y permite probar de nuevo (cada intento incrementa
 * Lesson Progress.attempts y eventualmente trigerea la penalty del
 * gamification engine).
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { InlineMath } from 'react-katex';
import { Button } from '@/components/ui/Button';

// Mejora 3: pantalla intro antes del quiz. El intento solo se registra
// (POST a la API) en step 'active' → la intro no dispara ningún fetch.
type QuizStep = 'intro' | 'active' | 'result';

type QuizQuestion =
  | {
      id: string;
      type: 'multiple_choice';
      promptEs: string;
      promptEn: string;
      optionsEs: string[];
      optionsEn: string[];
    }
  | {
      id: string;
      type: 'fill_in_blank';
      promptEs: string;
      promptEn: string;
    }
  | {
      id: string;
      type: 'short_answer';
      promptEs: string;
      promptEn: string;
    };

interface QuizResult {
  correct: number;
  total: number;
  masteryPct: number;
  coinAwarded: number;
  newMasteryAchieved: boolean;
  perQuestion: Array<{ questionId: string; correct: boolean }>;
}

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

export function Quiz({
  lessonSlug,
  questions,
  isEs,
  rewardCoin,
  onComplete
}: {
  lessonSlug: string;
  questions: QuizQuestion[];
  isEs: boolean;
  rewardCoin: number;
  // Mejora 4: notifica al LessonPlayerShell el resultado para actualizar el
  // stepper. Opcional — no rompe usos existentes sin esta prop.
  onComplete?: (result: { masteryPct: number }) => void;
}) {
  const t = useTranslations('student.lesson.quiz');
  const router = useRouter();
  const [step, setStep] = useState<QuizStep>('intro');
  const [answers, setAnswers] = useState<Record<string, number | string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allAnswered = questions.every((q) => {
    const a = answers[q.id];
    if (q.type === 'multiple_choice') return typeof a === 'number';
    return typeof a === 'string' && a.trim().length > 0;
  });

  const submit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/lessons/${lessonSlug}/quiz`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'generic');
      }
      const payload = (await res.json()) as QuizResult;
      setResult(payload);
      onComplete?.({ masteryPct: payload.masteryPct });
      // Refresh para que el header (totalCoin) y dashboard reciban
      // los datos actualizados de Coin/mastery.
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers({});
    setError(null);
  };

  if (step === 'intro') {
    return (
      <QuizIntroScreen
        questionCount={questions.length}
        rewardCoin={rewardCoin}
        onStart={() => setStep('active')}
      />
    );
  }

  return (
    <section className="my-8 rounded-2xl bg-white p-6 shadow-wave ring-1 ring-midsea-ocean/15">
      <header className="mb-4">
        <h2 className="font-display text-xl font-bold text-midsea-ink">
          {t('title')}
        </h2>
        <p className="mt-1 text-sm text-midsea-muted">
          {t('subtitle', { total: questions.length })}
        </p>
      </header>

      <ol className="space-y-5">
        {questions.map((q, i) => {
          const prompt = isEs ? q.promptEs : q.promptEn;
          const feedback = result?.perQuestion.find((p) => p.questionId === q.id);
          return (
            <li key={q.id} className="rounded-xl bg-midsea-foam/30 p-4">
              <p className="font-medium text-midsea-ink">
                <span className="mr-2 text-midsea-ink">{i + 1}.</span>
                <RichText value={prompt} />
              </p>
              <div className="mt-3">
                {q.type === 'multiple_choice' ? (
                  <MCInput
                    question={q}
                    isEs={isEs}
                    locked={result !== null}
                    pickedIndex={
                      typeof answers[q.id] === 'number'
                        ? (answers[q.id] as number)
                        : null
                    }
                    onPick={(idx) => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                  />
                ) : (
                  <TextInput
                    locked={result !== null}
                    value={typeof answers[q.id] === 'string' ? (answers[q.id] as string) : ''}
                    onChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
                    long={q.type === 'short_answer'}
                    placeholder={
                      q.type === 'fill_in_blank' ? t('fillPlaceholder') : t('shortPlaceholder')
                    }
                    ariaLabel={prompt}
                  />
                )}
              </div>
              {feedback ? (
                <p
                  role="status"
                  className={[
                    'mt-2 text-sm font-medium',
                    feedback.correct ? 'text-emerald-700' : 'text-rose-700'
                  ].join(' ')}
                >
                  {feedback.correct ? `✓ ${t('correct')}` : `✗ ${t('incorrect')}`}
                </p>
              ) : null}
            </li>
          );
        })}
      </ol>

      {result ? (
        <ResultBanner result={result} onRetry={retry} />
      ) : (
        <div className="mt-5 flex items-center justify-end gap-3">
          {error ? (
            <p role="alert" className="text-sm text-rose-700">
              {t(error === 'generic' ? 'error' : error)}
            </p>
          ) : null}
          <button
            type="button"
            onClick={submit}
            disabled={!allAnswered || submitting}
            className="rounded-xl bg-midsea-lagoon px-5 py-2.5 text-sm font-medium text-white hover:bg-midsea-ocean disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('submit')}
          </button>
        </div>
      )}
    </section>
  );
}

function ClipboardIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-10 w-10 text-midsea-lagoon"
    >
      <rect x="8" y="3" width="8" height="4" rx="1" />
      <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
      <path d="M9 12h6M9 16h4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-3.5 w-3.5">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

/** Mejora 3: pantalla previa al quiz. Estática — no llama a ninguna API. */
function QuizIntroScreen({
  questionCount,
  rewardCoin,
  onStart
}: {
  questionCount: number;
  rewardCoin: number;
  onStart: () => void;
}) {
  const t = useTranslations('student.lesson.quiz.intro');
  const estimatedMinutes = Math.max(2, Math.ceil(questionCount * 1.5));
  return (
    <section className="my-8 rounded-2xl border border-midsea-border bg-midsea-foam shadow-card">
      <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
        <ClipboardIcon />
        <h2 className="font-serif text-xl font-normal text-midsea-ink">{t('title')}</h2>
        <div className="flex items-center gap-4 text-sm text-midsea-muted">
          <span>{t('questionCount', { count: questionCount })}</span>
          <span aria-hidden>·</span>
          <span>{t('estimatedTime', { minutes: estimatedMinutes })}</span>
        </div>
        {rewardCoin > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-coin-light px-3 py-1 text-sm font-medium text-coin-dark">
            {t('coinBadge', { coin: rewardCoin })}
          </span>
        ) : null}
        <p className="w-full max-w-sm rounded-2xl border border-midsea-border bg-midsea-surface px-5 py-4 text-left font-serif text-sm italic leading-relaxed text-midsea-muted">
          {t('angelaMessage')}
        </p>
        <Button variant="primary" onClick={onStart}>
          {t('startButton')}
          <ArrowRightIcon />
        </Button>
      </div>
    </section>
  );
}

function MCInput({
  question,
  isEs,
  locked,
  pickedIndex,
  onPick
}: {
  question: Extract<QuizQuestion, { type: 'multiple_choice' }>;
  isEs: boolean;
  locked: boolean;
  pickedIndex: number | null;
  onPick: (idx: number) => void;
}) {
  const options = isEs ? question.optionsEs : question.optionsEn;
  return (
    <ul className="space-y-2">
      {options.map((opt, i) => {
        const isPicked = pickedIndex === i;
        return (
          <li key={i}>
            <button
              type="button"
              disabled={locked}
              onClick={() => onPick(i)}
              aria-pressed={isPicked}
              className={[
                'flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition',
                isPicked
                  ? 'border-midsea-lagoon bg-midsea-lagoon-light text-midsea-lagoon'
                  : 'border-midsea-ocean/15 bg-white text-midsea-ink hover:border-midsea-ocean/40',
                locked ? 'cursor-default opacity-80' : 'cursor-pointer'
              ].join(' ')}
            >
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${
                  isPicked ? 'bg-midsea-lagoon text-white' : 'bg-midsea-ocean/10 text-midsea-deep'
                }`}
              >
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
  );
}

function TextInput({
  value,
  onChange,
  locked,
  long,
  placeholder,
  ariaLabel
}: {
  value: string;
  onChange: (v: string) => void;
  locked: boolean;
  long: boolean;
  placeholder: string;
  ariaLabel: string;
}) {
  const baseCls =
    'w-full rounded-xl border border-midsea-ocean/20 bg-white px-3 py-2 text-sm focus:border-midsea-ocean focus:outline-none focus:ring-2 focus:ring-midsea-ocean/40 disabled:opacity-70';
  return long ? (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={locked}
      rows={3}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={baseCls}
    />
  ) : (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={locked}
      placeholder={placeholder}
      aria-label={ariaLabel}
      className={baseCls}
    />
  );
}

function ResultBanner({
  result,
  onRetry
}: {
  result: QuizResult;
  onRetry: () => void;
}) {
  const t = useTranslations('student.lesson.quiz');
  const mastered = result.masteryPct >= 80;
  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'mt-6 rounded-2xl p-5',
        mastered
          ? 'bg-emerald-50 ring-1 ring-emerald-300/60'
          : 'bg-amber-50 ring-1 ring-amber-300/60'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={mastered ? 'font-display text-lg font-bold text-emerald-800' : 'font-display text-lg font-bold text-amber-800'}>
            {mastered ? t('mastered') : t('keepPracticing')}
          </p>
          <p className="mt-1 text-sm text-midsea-ink">
            {t('score', {
              correct: result.correct,
              total: result.total,
              pct: result.masteryPct
            })}
          </p>
          {result.coinAwarded > 0 ? (
            <p className="mt-2 text-sm font-semibold text-emerald-700">
              {result.newMasteryAchieved
                ? t('coinAwarded', { n: result.coinAwarded })
                : t('coinAlreadyEarned')}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 rounded-xl bg-white px-4 py-2 text-sm font-medium text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
