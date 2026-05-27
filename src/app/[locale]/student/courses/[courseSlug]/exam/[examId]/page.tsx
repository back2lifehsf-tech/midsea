import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import ExamStartButton from './ExamStartButton';

// Íconos inline (sin lucide-react — mismo patrón que el resto del codebase)
function IconClock({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
function IconListChecks({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <line x1="10" y1="6" x2="21" y2="6" /><line x1="10" y1="12" x2="21" y2="12" /><line x1="10" y1="18" x2="21" y2="18" />
      <polyline points="3 6 4 7 6 5" /><polyline points="3 12 4 13 6 11" /><polyline points="3 18 4 19 6 17" />
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
function IconAlertTriangle({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}
function IconBookOpen({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

interface Props {
  params: { locale: string; courseSlug: string; examId: string };
}

export default async function ExamInstructionsPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) redirect(`/${params.locale}/login`);

  const exam = await prisma.exam.findUnique({
    where: { id: params.examId },
    include: {
      course: { select: { slug: true, titleEs: true, titleEn: true } },
      questions: { select: { id: true } },
      attempts: {
        where: { studentId: session.user.studentId },
        orderBy: { startedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!exam || exam.course.slug !== params.courseSlug) notFound();

  const t = await getTranslations('student.exam');
  const locale = params.locale as 'es' | 'en';

  const title = locale === 'es' ? exam.titleEs : exam.titleEn;
  const instruction = locale === 'es' ? exam.instructionEs : exam.instructionEn;
  const courseTitle = locale === 'es' ? exam.course.titleEs : exam.course.titleEn;
  const questionCount = exam.questions.length;

  const lastAttempt = exam.attempts[0] ?? null;
  const canRetry =
    exam.type === 'MONTHLY' ||
    !lastAttempt ||
    lastAttempt.status !== 'GRADED' ||
    lastAttempt.passed === true;

  return (
    <div className="min-h-screen bg-midsea-surface flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Breadcrumb */}
        <nav className="text-xs text-midsea-muted mb-6 flex items-center gap-1.5">
          <Link href={`/${params.locale}/student`} className="hover:text-midsea-ink">
            Inicio
          </Link>
          <span>›</span>
          <span className="text-midsea-ink">{courseTitle}</span>
        </nav>

        {/* Badge tipo examen */}
        <div className="mb-4">
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold
            ${exam.type === 'FINAL' ? 'bg-red-50 text-red-700' :
              exam.type === 'MIDTERM' ? 'bg-purple-50 text-purple-700' :
              'bg-midsea-lagoon-light text-midsea-lagoon'}`}>
            <IconListChecks size={12} />
            {exam.type === 'MONTHLY' ? t('monthly.badge') :
             exam.type === 'MIDTERM' ? t('midterm.badge') : t('final.badge')}
          </span>
        </div>

        {/* Card principal */}
        <div className="rounded-2xl border border-midsea-border bg-midsea-foam shadow-sm p-8">
          <h1 className="font-serif text-2xl font-normal text-midsea-ink leading-snug mb-3">
            {title}
          </h1>
          <p className="text-sm text-midsea-muted leading-relaxed mb-6">
            {instruction}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="flex items-center gap-2 rounded-xl bg-midsea-surface border border-midsea-border px-3 py-2.5">
              <span className="text-midsea-lagoon shrink-0"><IconClock size={16} /></span>
              <div>
                <div className="text-xs text-midsea-muted">Tiempo</div>
                <div className="text-sm font-medium text-midsea-ink">{exam.timeLimitMin} min</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-midsea-surface border border-midsea-border px-3 py-2.5">
              <span className="text-midsea-lagoon shrink-0"><IconListChecks size={16} /></span>
              <div>
                <div className="text-xs text-midsea-muted">Preguntas</div>
                <div className="text-sm font-medium text-midsea-ink">{questionCount}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-coin-light border border-coin/20 px-3 py-2.5">
              <span className="text-coin-dark shrink-0"><IconCoins size={16} /></span>
              <div>
                <div className="text-xs text-coin-dark/70">Si aprobás</div>
                <div className="text-sm font-medium text-coin-dark">+{exam.coinReward} Coins</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-midsea-surface border border-midsea-border px-3 py-2.5">
              <span className="text-midsea-lagoon shrink-0"><IconBookOpen size={16} /></span>
              <div>
                <div className="text-xs text-midsea-muted">Para aprobar</div>
                <div className="text-sm font-medium text-midsea-ink">{exam.passingPct}%</div>
              </div>
            </div>
          </div>

          {/* Advertencias */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 mb-6 space-y-1">
            <div className="flex items-start gap-2 text-xs text-amber-800">
              <span className="shrink-0 mt-0.5"><IconAlertTriangle size={13} /></span>
              <span>No podés pausar el examen una vez iniciado.</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-amber-800">
              <span className="shrink-0 mt-0.5"><IconAlertTriangle size={13} /></span>
              <span>Angela no puede ayudarte con las preguntas durante el examen.</span>
            </div>
          </div>

          {/* Resultado anterior (si existe) */}
          {lastAttempt?.status === 'GRADED' && (
            <div className={`rounded-xl border px-4 py-3 mb-6 text-sm ${
              lastAttempt.passed
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {lastAttempt.passed
                ? `✓ Aprobaste con ${lastAttempt.pctScore}% — podés verlo nuevamente`
                : `✗ Obtuviste ${lastAttempt.pctScore}%. Necesitás ${exam.passingPct}% para aprobar.`
              }
              {' '}
              <Link
                href={`/${params.locale}/student/courses/${params.courseSlug}/exam/${params.examId}/results`}
                className="underline font-medium"
              >
                Ver resultados
              </Link>
            </div>
          )}

          {/* Bloqueo MIDTERM/FINAL si reprobó */}
          {!canRetry && (
            <div className="rounded-xl bg-midsea-surface border border-midsea-border px-4 py-3 mb-6 text-sm text-midsea-muted text-center">
              Tu padre o madre debe aprobar un nuevo intento desde su cuenta.
            </div>
          )}

          {/* CTA */}
          {canRetry ? (
            <ExamStartButton
              examId={params.examId}
              courseSlug={params.courseSlug}
              locale={params.locale}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
