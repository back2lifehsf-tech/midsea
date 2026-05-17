import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import type { Subject } from '@prisma/client';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/gamification/ProgressBar';
import { requireStudentSpaceAccess } from '@/lib/auth/session';
import { getActiveStudent } from '@/lib/auth/active-student';
import { prisma } from '@/lib/prisma';
import { DEMO_LESSONS, DEMO_LUCIA_PROGRESS, type DemoSubject } from '@/lib/demo/data';

type ViewState = 'available' | 'inProgress' | 'completed';

interface LessonView {
  slug: string;
  title: string;
  subjectLabel: string;
  estMinutes: number;
  rewardNexos: number;
  state: ViewState;
  masteryPct?: number;
}

function statusToState(status: string): ViewState {
  if (status === 'MASTERED') return 'completed';
  if (status === 'IN_PROGRESS') return 'inProgress';
  return 'available';
}

export default async function StudentHomePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const parent = await requireStudentSpaceAccess(locale);
  const activeStudent = await getActiveStudent(parent);
  if (!activeStudent) {
    redirect(`/${locale}/parent`);
  }

  const [tHome, tSubjects] = await Promise.all([
    getTranslations({ locale, namespace: 'student.home' }),
    getTranslations({ locale, namespace: 'subjects' })
  ]);

  const isEs = locale !== 'en';
  const subjectLabel = (s: Subject | DemoSubject) => tSubjects(s);

  let lessons: LessonView[];
  if (activeStudent.isDemo) {
    lessons = DEMO_LUCIA_PROGRESS.map((p) => {
      const lesson = DEMO_LESSONS.find((l) => l.slug === p.slug)!;
      return {
        slug: lesson.slug,
        title: isEs ? lesson.titleEs : lesson.titleEn,
        subjectLabel: subjectLabel(lesson.subject),
        estMinutes: lesson.estMinutes,
        rewardNexos: lesson.rewardNexos,
        state: statusToState(p.status),
        masteryPct: p.masteryPct
      };
    });
  } else {
    const progress = await prisma.lessonProgress.findMany({
      where: {
        studentId: activeStudent.id,
        status: { in: ['AVAILABLE', 'IN_PROGRESS', 'MASTERED'] }
      },
      include: { lesson: true },
      orderBy: [{ status: 'asc' }, { lesson: { orderIndex: 'asc' } }]
    });
    lessons = progress.map((p) => ({
      slug: p.lesson.slug,
      title: isEs ? p.lesson.titleEs : p.lesson.titleEn,
      subjectLabel: subjectLabel(p.lesson.subject),
      estMinutes: p.lesson.estMinutes,
      rewardNexos: p.lesson.rewardNexos,
      state: statusToState(p.status),
      masteryPct: p.masteryPct
    }));
  }

  const assigned = lessons.filter((l) => l.state !== 'completed');
  const completed = lessons.filter((l) => l.state === 'completed');

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-3xl font-bold text-midsea-deep">
          {tHome('greeting', { name: activeStudent.displayName })}
        </h1>
        <p className="mt-1 text-sm text-midsea-ink/70">{tHome('subhead')}</p>
      </header>

      <section aria-labelledby="assigned-heading" className="space-y-3">
        <h2 id="assigned-heading" className="font-display text-xl font-semibold text-midsea-deep">
          {tHome('assignedHeading')}
        </h2>
        {assigned.length === 0 ? (
          <Card>
            <p className="text-sm text-midsea-ink/70">{tHome('noLessons')}</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {assigned.map((lesson) => (
              <Card key={lesson.slug}>
                <p className="text-xs uppercase tracking-wide text-midsea-ocean">
                  {lesson.subjectLabel}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-midsea-deep">
                  {lesson.title}
                </p>
                <p className="mt-1 text-xs text-midsea-ink/60">
                  {tHome('minutesEstimate', { minutes: lesson.estMinutes })} ·{' '}
                  {tHome('rewardPreview', { nexos: lesson.rewardNexos })}
                </p>

                {lesson.state === 'inProgress' && typeof lesson.masteryPct === 'number' ? (
                  <div className="mt-3">
                    <ProgressBar value={lesson.masteryPct} label={`${lesson.masteryPct}%`} />
                  </div>
                ) : null}

                <div className="mt-4">
                  <Button
                    as={Link}
                    href={`/${locale}/student/lessons/${lesson.slug}`}
                    variant="primary"
                  >
                    {lesson.state === 'inProgress' ? tHome('continueLabel') : tHome('startLabel')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {completed.length > 0 ? (
        <section aria-labelledby="completed-heading" className="space-y-3">
          <h2 id="completed-heading" className="font-display text-xl font-semibold text-midsea-deep">
            {tHome('completedHeading')}
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completed.map((lesson) => (
              <Card key={lesson.slug} className="opacity-70">
                <p className="text-xs uppercase tracking-wide text-midsea-ocean">
                  {lesson.subjectLabel}
                </p>
                <p className="mt-1 font-display text-lg font-semibold text-midsea-deep">
                  {lesson.title}
                </p>
                {typeof lesson.masteryPct === 'number' ? (
                  <p className="mt-1 text-xs text-midsea-ink/60">{lesson.masteryPct}%</p>
                ) : null}
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
