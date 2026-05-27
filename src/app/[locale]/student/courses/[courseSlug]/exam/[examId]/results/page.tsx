import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

// Íconos inline (sin lucide-react — mismo patrón que el resto del codebase)
function IconCheckCircle({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconXCircle({ size = 48 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function IconCheckSmall({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
function IconXSmall({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
function IconCoins({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="8" cy="8" r="6" /><path d="M18.09 10.37A6 6 0 1 1 10.34 18" /><path d="M7 6h1v4" /><line x1="16.71" y1="13.88" x2="13.14" y2="17.42" />
    </svg>
  );
}
function IconArrowLeft({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}
function IconRefreshCw({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

interface Props {
  params: { locale: string; courseSlug: string; examId: string };
}

export default async function ExamResultsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) redirect(`/${params.locale}/login`);

  const exam = await prisma.exam.findUnique({
    where: { id: params.examId },
    include: {
      course: { select: { slug: true, titleEs: true, titleEn: true } },
      questions: { orderBy: { orderIndex: 'asc' } },
      attempts: {
        where: { studentId: session.user.studentId },
        orderBy: { startedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!exam || exam.course.slug !== params.courseSlug) notFound();

  const attempt = exam.attempts[0];
  if (!attempt || attempt.status !== 'GRADED') {
    redirect(`/${params.locale}/student/courses/${params.courseSlug}/exam/${params.examId}`);
  }

  const locale = params.locale as 'es' | 'en';
  const title = locale === 'es' ? exam.titleEs : exam.titleEn;
  const courseTitle = locale === 'es' ? exam.course.titleEs : exam.course.titleEn;

  // Parsear answers del intento para hacer el breakdown
  const studentAnswers = attempt.answers as { questionId: string; answer: string }[];
  const answerMap = new Map(studentAnswers.map((a) => [a.questionId, a.answer]));

  const breakdown = exam.questions.map((q) => {
    const studentAns = (answerMap.get(q.id) ?? '').trim().toUpperCase();
    const correct = studentAns === q.correctAnswer.trim().toUpperCase();
    const stem = locale === 'es' ? q.stemEs : q.stemEn;
    const explanation = locale === 'es' ? q.explanationEs : q.explanationEn;
    return { id: q.id, stem, correct, explanation, studentAns, correctAns: q.correctAnswer };
  });

  const correctCount = breakdown.filter((b) => b.correct).length;
  const passed = attempt.passed ?? false;
  const pctScore = attempt.pctScore ?? 0;

  return (
    <div className="min-h-screen bg-midsea-surface">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Back */}
        <Link
          href={`/${params.locale}/student`}
          className="inline-flex items-center gap-1.5 text-xs text-midsea-muted hover:text-midsea-ink mb-6"
        >
          <IconArrowLeft size={13} />
          {courseTitle}
        </Link>

        {/* Resultado principal */}
        <div className={`rounded-2xl border p-8 mb-6 text-center ${
          passed
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {passed ? (
            <span className="text-green-600 flex justify-center mb-3"><IconCheckCircle size={48} /></span>
          ) : (
            <span className="text-red-500 flex justify-center mb-3"><IconXCircle size={48} /></span>
          )}
          <h1 className="font-serif text-2xl font-normal mb-1 text-midsea-ink">
            {title}
          </h1>
          <p className={`text-3xl font-bold mb-1 ${passed ? 'text-green-700' : 'text-red-600'}`}>
            {pctScore}%
          </p>
          <p className="text-sm text-midsea-muted">
            {correctCount} de {exam.questions.length} correctas
          </p>

          {passed && attempt.coinAwarded && (
            <div className="inline-flex items-center gap-2 mt-4 rounded-full bg-coin-light border border-coin/20 px-4 py-2 text-sm font-medium text-coin-dark">
              <IconCoins size={16} />
              +{exam.coinReward} Coins ganados
            </div>
          )}

          {!passed && (
            <div className="mt-4 text-sm text-midsea-muted">
              {exam.consolationCoin > 0 && (
                <span className="block mb-1">+{exam.consolationCoin} Coins de consolación</span>
              )}
              <span>Necesitás {exam.passingPct}% para aprobar.</span>
            </div>
          )}
        </div>

        {/* Angela mensaje */}
        <div className="rounded-xl border border-midsea-border bg-midsea-foam p-4 mb-6 flex gap-3">
          <div className="w-8 h-8 rounded-full bg-midsea-lagoon flex items-center justify-center text-white text-sm font-semibold shrink-0">
            A
          </div>
          <p className="font-serif italic text-sm text-midsea-muted leading-relaxed">
            {passed
              ? '¡Excelente trabajo! Demostraste comprensión sólida del material. Seguí así con el siguiente mes.'
              : 'No te desanimes. Revisá las lecciones en las que tuviste dificultad y volvé a intentarlo. Cada error es una oportunidad de aprender más profundo.'}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3 mb-8">
          <Link
            href={`/${params.locale}/student`}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-midsea-border bg-midsea-foam text-sm font-medium text-midsea-ink py-3 hover:border-midsea-lagoon/40 transition-colors"
          >
            <IconArrowLeft size={15} />
            Volver al inicio
          </Link>
          {(!passed || exam.type === 'MONTHLY') && (
            <Link
              href={`/${params.locale}/student/courses/${params.courseSlug}/exam/${params.examId}`}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-midsea-lagoon/30 bg-midsea-lagoon-light text-sm font-medium text-midsea-lagoon py-3 hover:bg-midsea-lagoon/20 transition-colors"
            >
              <IconRefreshCw size={15} />
              {passed ? 'Ver instrucciones' : 'Reintentar'}
            </Link>
          )}
        </div>

        {/* Breakdown de preguntas */}
        <div>
          <h2 className="text-[10px] font-semibold tracking-widest text-midsea-muted uppercase mb-3">
            Corrección detallada
          </h2>
          <div className="space-y-3">
            {breakdown.map((item, idx) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
                  item.correct
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  {item.correct ? (
                    <span className="text-green-600 shrink-0 mt-0.5"><IconCheckSmall size={16} /></span>
                  ) : (
                    <span className="text-red-500 shrink-0 mt-0.5"><IconXSmall size={16} /></span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-midsea-ink mb-1">
                      <span className="font-semibold">{idx + 1}.</span> {item.stem}
                    </p>
                    {!item.correct && (
                      <p className="text-xs text-red-700 mb-1">
                        Tu respuesta: <span className="font-medium">{item.studentAns || '—'}</span>
                        {' · '}Correcta: <span className="font-medium">{item.correctAns}</span>
                      </p>
                    )}
                    {item.explanation && (
                      <p className="text-xs text-midsea-muted italic leading-relaxed">
                        {item.explanation}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
