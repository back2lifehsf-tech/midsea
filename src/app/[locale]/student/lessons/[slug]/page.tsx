import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/gamification/ProgressBar';
import { LessonSurface } from '@/components/tutoring/LessonSurface';
import { LessonMarkdown } from '@/components/learning/LessonMarkdown';
import { ActivityList, type ActivityData } from '@/components/learning/Activity';
import { Quiz } from '@/components/learning/Quiz';
import { AskAngelaButton } from '@/components/learning/AskAngelaButton';
import { LessonContextRegister } from '@/components/learning/LessonContextRegister';
import { requireStudent } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { DEMO_LESSONS, DEMO_LUCIA_PROGRESS } from '@/lib/demo/data';
import type { LessonContext } from '@/lib/tutor/LessonContext';

interface LessonRender {
  id: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  summaryEs: string;
  summaryEn: string;
  subject: string;
  gradeLevel: number;
  estMinutes: number;
  rewardCoin: number;
  status: string;
  masteryPct: number;
  // Campos de Epic 04 — solo presentes en lecciones generadas por el
  // pipeline, ausentes en placeholders/demo.
  bodyMd: string | null;
  bodyMdEn: string | null;
  reflectionEs: string | null;
  reflectionEn: string | null;
  activities: ActivityData[] | null;
  quizQuestions: Array<{
    id: string;
    type: 'multiple_choice' | 'fill_in_blank' | 'short_answer';
    promptEs: string;
    promptEn: string;
    optionsEs?: string[];
    optionsEn?: string[];
  }>;
}

async function loadLessonForDemo(slug: string): Promise<LessonRender | null> {
  const lesson = DEMO_LESSONS.find((l) => l.slug === slug);
  if (!lesson) return null;
  const progress = DEMO_LUCIA_PROGRESS.find((p) => p.slug === slug);
  return {
    id: lesson.slug,
    slug: lesson.slug,
    titleEs: lesson.titleEs,
    titleEn: lesson.titleEn,
    summaryEs: '',
    summaryEn: '',
    subject: lesson.subject,
    gradeLevel: lesson.gradeLevel,
    estMinutes: lesson.estMinutes,
    rewardCoin: lesson.rewardCoin,
    status: progress?.status ?? 'AVAILABLE',
    masteryPct: progress?.masteryPct ?? 0,
    bodyMd: null,
    bodyMdEn: null,
    reflectionEs: null,
    reflectionEn: null,
    activities: null,
    quizQuestions: []
  };
}

async function loadLessonReal(
  slug: string,
  studentId: string
): Promise<LessonRender | null> {
  const lesson = await prisma.lesson.findUnique({
    where: { slug },
    include: {
      quizQuestions: { orderBy: { orderIndex: 'asc' } }
    }
  });
  if (!lesson) return null;
  const progress = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId, lessonId: lesson.id } }
  });
  return {
    id: lesson.id,
    slug: lesson.slug,
    titleEs: lesson.titleEs,
    titleEn: lesson.titleEn,
    summaryEs: lesson.summaryEs,
    summaryEn: lesson.summaryEn,
    subject: lesson.subject,
    gradeLevel: lesson.gradeLevel,
    estMinutes: lesson.estMinutes,
    rewardCoin: lesson.rewardCoin,
    status: progress?.status ?? 'AVAILABLE',
    masteryPct: progress?.masteryPct ?? 0,
    bodyMd: lesson.bodyMd ?? null,
    bodyMdEn: lesson.bodyMdEn ?? null,
    reflectionEs: lesson.reflectionEs ?? null,
    reflectionEn: lesson.reflectionEn ?? null,
    activities: (lesson.activities as ActivityData[] | null) ?? null,
    quizQuestions: lesson.quizQuestions.map((q) => {
      const options = q.options as { es?: string[]; en?: string[] } | null;
      return {
        id: q.id,
        type: q.type as 'multiple_choice' | 'fill_in_blank' | 'short_answer',
        promptEs: q.promptEs,
        promptEn: q.promptEn,
        optionsEs: options?.es,
        optionsEn: options?.en
      };
    })
  };
}

export default async function LessonDetailPage({
  params: { locale, slug }
}: {
  params: { locale: string; slug: string };
}) {
  const activeStudent = await requireStudent(locale);

  const data = activeStudent.isDemo
    ? await loadLessonForDemo(slug)
    : await loadLessonReal(slug, activeStudent.id);
  if (!data) notFound();

  const [tLesson, tSubjects] = await Promise.all([
    getTranslations({ locale, namespace: 'student.lesson' }),
    getTranslations({ locale, namespace: 'subjects' })
  ]);

  const isEs = locale !== 'en';
  const title = isEs ? data.titleEs : data.titleEn;
  const summary = isEs ? data.summaryEs : data.summaryEn;
  const subject = tSubjects(data.subject);
  const studentFirstName = activeStudent.displayName.split(/\s+/)[0];
  const reflection = isEs ? data.reflectionEs : data.reflectionEn;
  // El cuerpo de la lección es bilingüe (bodyMd = es, bodyMdEn = en).
  // Si falta la versión en inglés (lecciones viejas pre-backfill), caemos
  // al español para no romper la lección.
  const body = isEs ? data.bodyMd : data.bodyMdEn ?? data.bodyMd;

  const lessonCtx: LessonContext = {
    lessonId: data.id,
    slug: data.slug,
    titleEs: data.titleEs,
    titleEn: data.titleEn,
    subject: data.subject,
    gradeLevel: data.gradeLevel,
    estMinutes: data.estMinutes
  };

  // Si la lección tiene contenido real generado por el pipeline (bodyMd),
  // renderizamos el lesson player completo. Si no (legacy/demo), caemos
  // al LessonSurface placeholder.
  const hasRealContent = data.bodyMd !== null;

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/student`}
        className="inline-block text-sm text-midsea-ocean hover:underline"
      >
        ← {tLesson('backToHome')}
      </Link>

      <header className="space-y-2">
        <p className="text-xs uppercase tracking-wide text-midsea-ocean">{subject}</p>
        <h1 className="font-display text-3xl font-bold text-midsea-deep">{title}</h1>
        {summary ? (
          <p className="max-w-2xl text-sm text-midsea-ink/70">{summary}</p>
        ) : null}
        <p className="text-sm text-midsea-ink/70">
          {tLesson('minutesEstimate', { minutes: data.estMinutes })} ·{' '}
          {tLesson('rewardPreview', { coin: data.rewardCoin })}
        </p>
        {data.status === 'IN_PROGRESS' || data.status === 'MASTERED' ? (
          <div className="max-w-md pt-2">
            <p className="mb-1 text-xs text-midsea-ink/60">
              {tLesson('masteryProgress')}
            </p>
            <ProgressBar value={data.masteryPct} label={`${data.masteryPct}%`} />
          </div>
        ) : null}
      </header>

      {hasRealContent ? (
        <>
          <LessonContextRegister
            lesson={lessonCtx}
            studentFirstName={studentFirstName}
          />
          <Card>
            <LessonMarkdown markdown={body!} />
          </Card>

          {data.activities && data.activities.length > 0 ? (
            <ActivityList activities={data.activities} isEs={isEs} />
          ) : null}

          {reflection ? (
            <Card className="bg-midsea-foam/50 ring-1 ring-midsea-ocean/15">
              <p className="text-xs font-semibold uppercase tracking-wide text-midsea-ocean">
                {tLesson('reflection')}
              </p>
              <p className="mt-2 text-sm italic text-midsea-deep">{reflection}</p>
            </Card>
          ) : null}

          <div className="flex justify-center">
            <AskAngelaButton
              locale={locale}
              lessonSlug={data.slug}
              studentFirstName={studentFirstName}
            />
          </div>

          {data.quizQuestions.length > 0 ? (
            <Quiz
              lessonSlug={data.slug}
              questions={data.quizQuestions as never}
              isEs={isEs}
            />
          ) : null}
        </>
      ) : (
        <>
          <Card>
            <h2 className="font-display text-lg font-semibold text-midsea-deep">
              {tLesson('placeholderHeading')}
            </h2>
            <p className="mt-2 text-sm text-midsea-ink/70">
              {tLesson('placeholderBody')}
            </p>
            <div
              aria-hidden
              className="mt-6 grid h-40 place-items-center rounded-xl bg-midsea-foam text-sm text-midsea-ink/40"
            >
              {tLesson('placeholderHeading')}
            </div>
          </Card>
          <LessonSurface lesson={lessonCtx} studentFirstName={studentFirstName} />
        </>
      )}
    </div>
  );
}
