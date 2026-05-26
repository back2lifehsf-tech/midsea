import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/gamification/ProgressBar';
import { requireStudent } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { DEMO_LESSONS, DEMO_LUCIA_PROGRESS } from '@/lib/demo/data';
import {
  INTENT_KEYS,
  intentIcons,
  intentTone,
  type IntentKey
} from '@/components/student/intentVisuals';
import { DailyVerseCard } from '@/components/student/DailyVerseCard';
import { getDailyVerse } from '@/lib/verses';

// Intent-based dashboard. Reemplaza el lesson grid por 4 entradas de intencion
// (CLAUDE.md seccion 7.1, AI_TUTOR_SPEC.md seccion 7). El estudiante no piensa
// "donde esta la materia X", piensa "que necesito ahora".
//
// Los datos siguen viniendo de Lesson + LessonProgress sin cambios de schema —
// solo presentados de forma distinta (no grid de materias, sino contexto de
// "donde estabas" + "logros recientes" alrededor de las intenciones).

interface ActiveCourse {
  courseId: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  subject: string;
  totalLessons: number;
  masteredLessons: number;
  nextLesson: { slug: string; titleEs: string; titleEn: string; monthIndex: number | null } | null;
}

interface DashboardData {
  inProgress: { slug: string; titleEs: string; titleEn: string; masteryPct: number; attempts: number } | null;
  recentMastered: Array<{ slug: string; titleEs: string; titleEn: string }>;
  reviewableCount: number;
  activeCourses: ActiveCourse[];
}

async function loadDashboardData(
  activeStudentId: string,
  isDemo: boolean
): Promise<DashboardData> {
  if (isDemo) {
    const inProgressP = DEMO_LUCIA_PROGRESS.find((p) => p.status === 'IN_PROGRESS');
    const inProgressLesson = inProgressP ? DEMO_LESSONS.find((l) => l.slug === inProgressP.slug) : null;
    const masteredP = DEMO_LUCIA_PROGRESS.filter((p) => p.status === 'MASTERED');
    return {
      inProgress:
        inProgressP && inProgressLesson
          ? {
              slug: inProgressLesson.slug,
              titleEs: inProgressLesson.titleEs,
              titleEn: inProgressLesson.titleEn,
              masteryPct: inProgressP.masteryPct,
              attempts: inProgressP.attempts
            }
          : null,
      recentMastered: masteredP
        .map((p) => DEMO_LESSONS.find((l) => l.slug === p.slug))
        .filter((l): l is NonNullable<typeof l> => Boolean(l))
        .map((l) => ({ slug: l.slug, titleEs: l.titleEs, titleEn: l.titleEn })),
      reviewableCount: masteredP.length,
      activeCourses: []
    };
  }

  const [inProgress, recentMastered, masteredCount, activeEnrollments] =
    await Promise.all([
      prisma.lessonProgress.findFirst({
        where: { studentId: activeStudentId, status: 'IN_PROGRESS' },
        orderBy: { lastAttempt: 'desc' },
        include: { lesson: { select: { slug: true, titleEs: true, titleEn: true } } }
      }),
      prisma.lessonProgress.findMany({
        where: { studentId: activeStudentId, status: 'MASTERED' },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { lesson: { select: { slug: true, titleEs: true, titleEn: true } } }
      }),
      prisma.lessonProgress.count({
        where: { studentId: activeStudentId, status: 'MASTERED' }
      }),
      prisma.studentCourseEnrollment.findMany({
        where: { studentId: activeStudentId, active: true },
        include: {
          course: {
            select: {
              id: true,
              slug: true,
              titleEs: true,
              titleEn: true,
              subject: true,
              orderIndex: true,
              _count: { select: { lessons: true } },
              lessons: {
                orderBy: [{ monthIndex: 'asc' }, { orderIndex: 'asc' }],
                select: { id: true, slug: true, titleEs: true, titleEn: true, monthIndex: true }
              }
            }
          }
        },
        orderBy: { activatedAt: 'desc' }
      })
    ]);

  // Próxima lección = primera lección del curso (orden monthIndex,
  // orderIndex) que NO esté MASTERED. Una query agregada por
  // (studentId, lessonId IN active courses).
  const allLessonIds = activeEnrollments.flatMap((e) =>
    e.course.lessons.map((l) => l.id)
  );
  const masteredIds = new Set<string>();
  if (allLessonIds.length > 0) {
    const rows = await prisma.lessonProgress.findMany({
      where: {
        studentId: activeStudentId,
        lessonId: { in: allLessonIds },
        status: 'MASTERED'
      },
      select: { lessonId: true }
    });
    for (const r of rows) masteredIds.add(r.lessonId);
  }

  const activeCourses: ActiveCourse[] = activeEnrollments.map((enr) => {
    const nextLesson = enr.course.lessons.find((l) => !masteredIds.has(l.id));
    const masteredInCourse = enr.course.lessons.filter((l) =>
      masteredIds.has(l.id)
    ).length;
    return {
      courseId: enr.course.id,
      slug: enr.course.slug,
      titleEs: enr.course.titleEs,
      titleEn: enr.course.titleEn,
      subject: enr.course.subject,
      totalLessons: enr.course._count.lessons,
      masteredLessons: masteredInCourse,
      nextLesson: nextLesson
        ? {
            slug: nextLesson.slug,
            titleEs: nextLesson.titleEs,
            titleEn: nextLesson.titleEn,
            monthIndex: nextLesson.monthIndex
          }
        : null
    };
  });

  return {
    inProgress: inProgress
      ? {
          slug: inProgress.lesson.slug,
          titleEs: inProgress.lesson.titleEs,
          titleEn: inProgress.lesson.titleEn,
          masteryPct: inProgress.masteryPct,
          attempts: inProgress.attempts
        }
      : null,
    recentMastered: recentMastered.map((p) => ({
      slug: p.lesson.slug,
      titleEs: p.lesson.titleEs,
      titleEn: p.lesson.titleEn
    })),
    reviewableCount: masteredCount,
    activeCourses
  };
}

export default async function StudentDashboardPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const activeStudent = await requireStudent(locale);

  const [tDash, tIntents] = await Promise.all([
    getTranslations({ locale, namespace: 'student.dashboard' }),
    getTranslations({ locale, namespace: 'student.intents' })
  ]);

  const isEs = locale !== 'en';
  const data = await loadDashboardData(activeStudent.id, activeStudent.isDemo);

  // Stuck hint: si hay leccion in-progress con >= 1 intento, sugiere ayuda contextual.
  const stuckTopic = data.inProgress && data.inProgress.attempts >= 1
    ? (isEs ? data.inProgress.titleEs : data.inProgress.titleEn)
    : null;

  // Review hint: cuenta cuanto hay reviewable (proxy hasta tener spaced repetition real).
  const reviewableCount = data.reviewableCount;

  const intentHint = (key: IntentKey): string => {
    if (key === 'stuck' && stuckTopic) {
      return tIntents('stuck.hintActive', { topic: stuckTopic });
    }
    if (key === 'review' && reviewableCount > 0) {
      return tIntents('review.hintActive', { count: reviewableCount });
    }
    return tIntents(`${key}.hint`);
  };

  return (
    <div className="space-y-10">
      {/* Mejora 7 (Parte A): versículo del día — primer elemento del dashboard. */}
      <DailyVerseCard verse={getDailyVerse()} locale={locale} />

      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-midsea-deep">
          {tDash('greeting', { name: activeStudent.displayName })}
        </h1>
        <p className="text-base text-midsea-ink/70">{tDash('subheading')}</p>
      </header>

      {data.activeCourses.length > 0 ? (
        <section aria-labelledby="courses-heading" className="space-y-3">
          <h2
            id="courses-heading"
            className="font-display text-xl font-semibold text-midsea-deep"
          >
            {tDash('coursesHeading')}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {data.activeCourses.map((c) => {
              const pct =
                c.totalLessons > 0
                  ? Math.round((c.masteredLessons / c.totalLessons) * 100)
                  : 0;
              return (
                <Card key={c.courseId}>
                  <h3 className="font-display text-base font-bold text-midsea-deep">
                    {isEs ? c.titleEs : c.titleEn}
                  </h3>
                  <p className="mt-1 text-xs text-midsea-ink/60">
                    {tDash('courseProgress', {
                      mastered: c.masteredLessons,
                      total: c.totalLessons,
                      pct
                    })}
                  </p>
                  <div className="mt-3 max-w-md">
                    <ProgressBar value={pct} label={`${pct}%`} />
                  </div>
                  {c.nextLesson ? (
                    <div className="mt-4">
                      <p className="text-xs text-midsea-ink/50">
                        {tDash('nextLesson')}
                      </p>
                      <p className="mt-1 line-clamp-2 text-sm font-medium text-midsea-deep">
                        {isEs ? c.nextLesson.titleEs : c.nextLesson.titleEn}
                      </p>
                      <Button
                        as={Link}
                        href={`/${locale}/student/lessons/${c.nextLesson.slug}`}
                        variant="primary"
                        className="mt-3"
                      >
                        {tDash('continueCourse')}
                      </Button>
                    </div>
                  ) : (
                    <p className="mt-4 text-sm font-medium text-emerald-700">
                      {tDash('courseCompleted')}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        </section>
      ) : null}

      <section aria-labelledby="intents-heading" className="space-y-4">
        <h2 id="intents-heading" className="font-display text-xl font-semibold text-midsea-deep">
          {tDash('intentsHeading')}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {INTENT_KEYS.map((key) => {
            const tone = intentTone[key];
            return (
              <Link
                key={key}
                href={`/${locale}/student/${key}`}
                className={`group flex flex-col gap-3 rounded-2xl bg-white p-6 ring-1 shadow-wave transition ${tone.ringClass} ${tone.bgAccent} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2`}
              >
                <div className={`grid h-12 w-12 place-items-center rounded-2xl ${tone.iconClass}`}>
                  {intentIcons[key]}
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-midsea-deep">
                    {tIntents(`${key}.title`)}
                  </h3>
                  <p className="mt-1 text-sm text-midsea-ink/75">{tIntents(`${key}.body`)}</p>
                </div>
                <p className="mt-auto text-xs text-midsea-ink/60">{intentHint(key)}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {data.inProgress ? (
        <section aria-labelledby="resume-heading" className="space-y-3">
          <h2 id="resume-heading" className="font-display text-xl font-semibold text-midsea-deep">
            {tDash('resumeHeading')}
          </h2>
          <Card>
            <p className="text-sm text-midsea-ink/60">{tDash('resumeContext')}</p>
            <p className="mt-2 font-display text-lg font-semibold text-midsea-deep">
              {isEs ? data.inProgress.titleEs : data.inProgress.titleEn}
            </p>
            <div className="mt-3 max-w-md">
              <ProgressBar
                value={data.inProgress.masteryPct}
                label={`${data.inProgress.masteryPct}%`}
              />
              <p className="mt-1 text-xs text-midsea-ink/60">
                {tDash('masteryLabel', { pct: data.inProgress.masteryPct })}
              </p>
            </div>
            <div className="mt-4">
              <Button
                as={Link}
                href={`/${locale}/student/lessons/${data.inProgress.slug}`}
                variant="primary"
              >
                {tDash('resume')}
              </Button>
            </div>
          </Card>
        </section>
      ) : null}

      {data.recentMastered.length > 0 ? (
        <section aria-labelledby="recent-heading" className="space-y-3">
          <h2 id="recent-heading" className="font-display text-xl font-semibold text-midsea-deep">
            {tDash('recentHeading')}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {data.recentMastered.map((l) => (
              <li
                key={l.slug}
                className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-midsea-deep ring-1 ring-midsea-lagoon/40"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className="h-4 w-4 text-midsea-lagoon"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{isEs ? l.titleEs : l.titleEn}</span>
                <span className="text-xs text-midsea-ink/50">{tDash('completedTag')}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : data.inProgress ? null : (
        <Card>
          <p className="text-sm text-midsea-ink/70">{tDash('noActivity')}</p>
        </Card>
      )}
    </div>
  );
}
