import { getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { ProgressBar } from '@/components/gamification/ProgressBar';
import { LessonHelpPanel } from '@/components/tutoring/LessonHelpPanel';
import { requireStudentSpaceAccess } from '@/lib/auth/session';
import { getActiveStudent } from '@/lib/auth/active-student';
import { prisma } from '@/lib/prisma';
import { DEMO_LESSONS, DEMO_LUCIA_PROGRESS } from '@/lib/demo/data';
import type { Locale } from '@/i18n';

interface LessonRender {
  titleEs: string;
  titleEn: string;
  subject: string; // Subject enum value as string
  gradeLevel: number;
  estMinutes: number;
  rewardNexos: number;
  status: string;
  masteryPct: number;
}

async function loadLessonForDemo(slug: string): Promise<LessonRender | null> {
  const lesson = DEMO_LESSONS.find((l) => l.slug === slug);
  if (!lesson) return null;
  const progress = DEMO_LUCIA_PROGRESS.find((p) => p.slug === slug);
  return {
    titleEs: lesson.titleEs,
    titleEn: lesson.titleEn,
    subject: lesson.subject,
    gradeLevel: lesson.gradeLevel,
    estMinutes: lesson.estMinutes,
    rewardNexos: lesson.rewardNexos,
    status: progress?.status ?? 'AVAILABLE',
    masteryPct: progress?.masteryPct ?? 0
  };
}

async function loadLessonReal(slug: string, studentId: string): Promise<LessonRender | null> {
  const lesson = await prisma.lesson.findUnique({ where: { slug } });
  if (!lesson) return null;
  const progress = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId, lessonId: lesson.id } }
  });
  return {
    titleEs: lesson.titleEs,
    titleEn: lesson.titleEn,
    subject: lesson.subject,
    gradeLevel: lesson.gradeLevel,
    estMinutes: lesson.estMinutes,
    rewardNexos: lesson.rewardNexos,
    status: progress?.status ?? 'AVAILABLE',
    masteryPct: progress?.masteryPct ?? 0
  };
}

export default async function LessonDetailPage({
  params: { locale, slug }
}: {
  params: { locale: string; slug: string };
}) {
  const parent = await requireStudentSpaceAccess(locale);
  const activeStudent = await getActiveStudent(parent);
  if (!activeStudent) notFound();

  const data = activeStudent.isDemo
    ? await loadLessonForDemo(slug)
    : await loadLessonReal(slug, activeStudent.id);
  if (!data) notFound();

  const [tLesson, tTutor, tHome, tSubjects] = await Promise.all([
    getTranslations({ locale, namespace: 'student.lesson' }),
    getTranslations({ locale, namespace: 'student.tutor' }),
    getTranslations({ locale, namespace: 'student.home' }),
    getTranslations({ locale, namespace: 'subjects' })
  ]);

  const isEs = locale !== 'en';
  const title = isEs ? data.titleEs : data.titleEn;
  const subject = tSubjects(data.subject);
  const safeLocale: Locale = locale === 'en' ? 'en' : 'es';
  const studentFirstName = activeStudent.displayName.split(/\s+/)[0];

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
        <p className="text-sm text-midsea-ink/70">
          {tLesson('minutesEstimate', { minutes: data.estMinutes })} ·{' '}
          {tLesson('rewardPreview', { nexos: data.rewardNexos })}
        </p>
        {data.status === 'IN_PROGRESS' ? (
          <div className="max-w-md pt-2">
            <p className="mb-1 text-xs text-midsea-ink/60">{tLesson('masteryProgress')}</p>
            <ProgressBar value={data.masteryPct} label={`${data.masteryPct}%`} />
          </div>
        ) : null}
      </header>

      <Card>
        <h2 className="font-display text-lg font-semibold text-midsea-deep">
          {tLesson('placeholderHeading')}
        </h2>
        <p className="mt-2 text-sm text-midsea-ink/70">{tLesson('placeholderBody')}</p>
        <div
          aria-hidden
          className="mt-6 grid h-48 place-items-center rounded-xl bg-midsea-foam text-sm text-midsea-ink/40"
        >
          {tLesson('placeholderHeading')}
        </div>
      </Card>

      <div className="sticky bottom-4 z-30 flex justify-end pr-1">
        <LessonHelpPanel
          locale={safeLocale}
          topic={title}
          gradeLevel={data.gradeLevel}
          studentFirstName={studentFirstName}
          labels={{
            ask: tHome('askForHelp'),
            panelTitle: tTutor('title'),
            context: tTutor('context', { topic: title }),
            disclaimer: tTutor('disclaimer'),
            close: tTutor('back'),
            chat: {
              placeholder: tTutor('placeholder'),
              send: tTutor('send'),
              thinking: tTutor('thinking'),
              starters: [
                tTutor('starters.explain'),
                tTutor('starters.stuck'),
                tTutor('starters.example')
              ]
            }
          }}
        />
      </div>
    </div>
  );
}
