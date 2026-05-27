'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

// Íconos inline (sin lucide-react — mismo patrón que el resto del codebase)
function IconClock({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconChevronRight({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

interface QuestionOption {
  id: string;
  textEs: string;
  textEn: string;
}

interface Question {
  id: string;
  orderIndex: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  stemEs: string;
  stemEn: string;
  options: QuestionOption[] | null;
  points: number;
}

interface ExamData {
  id: string;
  titleEs: string;
  titleEn: string;
  timeLimitMin: number;
  questions: Question[];
  attemptId: string;
}

interface Props {
  params: { locale: string; courseSlug: string; examId: string };
}

export default function TakeExamPage({ params }: Props) {
  const router = useRouter();
  const locale = params.locale as 'es' | 'en';
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar datos del examen + attemptId
  useEffect(() => {
    async function load() {
      try {
        // Iniciar intento (idempotente)
        const startRes = await fetch(`/api/exam/${params.examId}/start`, { method: 'POST' });
        if (!startRes.ok) throw new Error('start_failed');
        const { attemptId } = await startRes.json() as { attemptId: string };

        // Cargar datos del examen
        const examRes = await fetch(`/api/exam/${params.examId}`);
        if (!examRes.ok) throw new Error('exam_not_found');
        const examData = await examRes.json() as Omit<ExamData, 'attemptId'>;

        setExam({ ...examData, attemptId });
        setSecondsLeft(examData.timeLimitMin * 60);
      } catch {
        setError('No se pudo cargar el examen. Volvé e intentá de nuevo.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.examId]);

  const handleSubmit = useCallback(async (auto = false) => {
    if (!exam || submitting) return;
    setSubmitting(true);

    const answerList = Object.entries(answers).map(([questionId, answer]) => ({
      questionId,
      answer
    }));

    try {
      const res = await fetch(`/api/exam/${exam.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: exam.attemptId, answers: answerList })
      });
      if (!res.ok) throw new Error('submit_failed');
      router.push(`/${params.locale}/student/courses/${params.courseSlug}/exam/${params.examId}/results`);
    } catch {
      if (!auto) setSubmitting(false);
    }
  }, [exam, answers, submitting, router, params]);

  // Timer countdown
  useEffect(() => {
    if (!exam || secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(interval);
          handleSubmit(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [exam, secondsLeft, handleSubmit]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-midsea-surface flex items-center justify-center">
        <div className="text-midsea-muted text-sm">Cargando examen...</div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-midsea-surface flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-midsea-ink mb-4">{error ?? 'Error desconocido'}</p>
          <button
            onClick={() => router.back()}
            className="text-midsea-lagoon text-sm underline"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  const title = locale === 'es' ? exam.titleEs : exam.titleEn;
  const answeredCount = Object.keys(answers).length;
  const isTimeLow = secondsLeft < 300; // menos de 5 min

  return (
    <div className="min-h-screen bg-midsea-surface">
      {/* Topbar fija */}
      <div className="sticky top-0 z-10 bg-midsea-foam border-b border-midsea-border px-4 py-3 flex items-center justify-between">
        <div className="text-sm font-medium text-midsea-ink truncate max-w-[50%]">{title}</div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-midsea-muted">
            {answeredCount}/{exam.questions.length} respondidas
          </span>
          <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-mono font-medium
            ${isTimeLow ? 'bg-red-50 text-red-700' : 'bg-midsea-lagoon-light text-midsea-lagoon'}`}>
            <IconClock size={14} />
            {formatTime(secondsLeft)}
          </div>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {exam.questions.map((q, idx) => {
          const stem = locale === 'es' ? q.stemEs : q.stemEn;
          const selected = answers[q.id];

          return (
            <div key={q.id} className="rounded-xl border border-midsea-border bg-midsea-foam p-5">
              <div className="flex items-start gap-3 mb-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-midsea-lagoon-light text-midsea-lagoon text-xs font-semibold flex items-center justify-center">
                  {idx + 1}
                </span>
                <p className="text-sm text-midsea-ink leading-relaxed">{stem}</p>
              </div>

              {q.type === 'MULTIPLE_CHOICE' && q.options && (
                <div className="space-y-2 pl-10">
                  {q.options.map((opt) => {
                    const label = locale === 'es' ? opt.textEs : opt.textEn;
                    const isSelected = selected === opt.id;
                    return (
                      <button
                        key={opt.id}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        className={`w-full text-left rounded-lg border px-4 py-2.5 text-sm transition-colors
                          ${isSelected
                            ? 'border-midsea-lagoon bg-midsea-lagoon-light text-midsea-lagoon font-medium'
                            : 'border-midsea-border bg-white text-midsea-ink hover:border-midsea-lagoon/40'
                          }`}
                      >
                        <span className="font-semibold mr-2">{opt.id}.</span>{label}
                      </button>
                    );
                  })}
                </div>
              )}

              {q.type === 'TRUE_FALSE' && (
                <div className="flex gap-3 pl-10">
                  {[{ id: 'TRUE', label: 'Verdadero' }, { id: 'FALSE', label: 'Falso' }].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                      className={`flex-1 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors
                        ${selected === opt.id
                          ? 'border-midsea-lagoon bg-midsea-lagoon-light text-midsea-lagoon'
                          : 'border-midsea-border bg-white text-midsea-ink hover:border-midsea-lagoon/40'
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {q.type === 'SHORT_ANSWER' && (
                <div className="pl-10">
                  <input
                    type="text"
                    value={selected ?? ''}
                    onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                    placeholder="Tu respuesta..."
                    className="w-full rounded-lg border border-midsea-border px-3 py-2 text-sm text-midsea-ink focus:outline-none focus:border-midsea-lagoon"
                  />
                </div>
              )}
            </div>
          );
        })}

        {/* Submit */}
        <div className="pt-4 pb-12">
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-midsea-lagoon text-white font-medium text-sm py-3.5 hover:bg-midsea-lagoon/90 transition-colors disabled:opacity-60"
          >
            {submitting ? 'Enviando...' : 'Enviar respuestas'}
            {!submitting && <IconChevronRight size={16} />}
          </button>
          <p className="text-center text-xs text-midsea-muted mt-2">
            Respondiste {answeredCount} de {exam.questions.length} preguntas
          </p>
        </div>
      </div>
    </div>
  );
}
