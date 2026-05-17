import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/gamification/ProgressBar';
import { requireParent, type ParentContext } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { DEMO_OVERVIEW_KIDS, DEMO_WEEKLY_MINUTES } from '@/lib/demo/data';

// Aproximacion v1 (real path): no tenemos sessions table, asi que "minutos hoy"
// y el chart semanal usan sum(lesson.estMinutes) agrupado por lastAttempt.
// El demo path usa fixtures pre-agregadas en src/lib/demo/data.ts.

interface KidView {
  id: string;
  name: string;
  gradeLabel: string;
  minutesToday: number;
  masteryPct: number;
  stuckTopic?: string;
}

async function loadDashboardData(
  parent: ParentContext,
  isEs: boolean
): Promise<{ kids: KidView[]; weeklyMinutes: number[] }> {
  if (parent.isDemo) {
    return {
      kids: DEMO_OVERVIEW_KIDS.map((k) => ({
        id: k.id,
        name: k.name,
        gradeLabel: isEs ? `${k.gradeLevel}°` : `Gr ${k.gradeLevel}`,
        minutesToday: k.minutesToday,
        masteryPct: k.masteryPct,
        stuckTopic: isEs ? k.stuckTopicEs : k.stuckTopicEn
      })),
      weeklyMinutes: DEMO_WEEKLY_MINUTES
    };
  }

  const students = await prisma.student.findMany({
    where: { familyId: parent.family.id },
    orderBy: { createdAt: 'asc' },
    include: {
      progress: {
        include: {
          lesson: { select: { titleEs: true, titleEn: true, estMinutes: true } }
        }
      }
    }
  });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const weekStart = new Date(startOfToday);
  weekStart.setDate(weekStart.getDate() - 6);

  const kids: KidView[] = students.map((s) => {
    const activeProgress = s.progress.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'MASTERED'
    );
    const masteryPct =
      activeProgress.length > 0
        ? Math.round(
            activeProgress.reduce((sum, p) => sum + p.masteryPct, 0) / activeProgress.length
          )
        : 0;

    const minutesToday = s.progress
      .filter((p) => p.lastAttempt && p.lastAttempt >= startOfToday)
      .reduce((sum, p) => sum + p.lesson.estMinutes, 0);

    const stuck = s.progress.find(
      (p) => p.status === 'IN_PROGRESS' && p.attempts >= 3 && p.masteryPct < 60
    );

    return {
      id: s.id,
      name: s.displayName,
      gradeLabel: isEs ? `${s.gradeLevel}°` : `Gr ${s.gradeLevel}`,
      minutesToday,
      masteryPct,
      stuckTopic: stuck ? (isEs ? stuck.lesson.titleEs : stuck.lesson.titleEn) : undefined
    };
  });

  const weeklyMinutes = [0, 0, 0, 0, 0, 0, 0];
  for (const s of students) {
    for (const p of s.progress) {
      if (!p.lastAttempt || p.lastAttempt < weekStart) continue;
      const jsDay = p.lastAttempt.getDay();
      const slot = jsDay === 0 ? 6 : jsDay - 1;
      weeklyMinutes[slot] += p.lesson.estMinutes;
    }
  }

  return { kids, weeklyMinutes };
}

export default async function ParentOverviewPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const parent = await requireParent(locale);
  const t = await getTranslations({ locale, namespace: 'parent.dashboard' });
  const isEs = locale !== 'en';

  const { kids, weeklyMinutes } = await loadDashboardData(parent, isEs);
  const weekdayKeys = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
  const maxMinutes = Math.max(...weeklyMinutes, 60);

  return (
    <div className="space-y-8">
      <header>
        <p className="text-sm uppercase tracking-wide text-midsea-ocean">{t('subheading')}</p>
        <h1 className="font-display text-3xl font-bold text-midsea-deep">{t('heading')}</h1>
      </header>

      <section aria-labelledby="kids-heading" className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 id="kids-heading" className="font-display text-xl font-semibold text-midsea-deep">
            {t('kidsHeading')}
          </h2>
          <Button variant="ghost">{t('addStudent')}</Button>
        </div>
        {kids.length === 0 ? (
          <Card>
            <p className="text-sm text-midsea-ink/70">{t('noAlerts')}</p>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {kids.map((kid) => (
              <Card key={kid.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display text-lg font-bold text-midsea-deep">{kid.name}</p>
                    <p className="text-xs text-midsea-ink/60">{kid.gradeLabel}</p>
                  </div>
                  <span
                    aria-hidden
                    className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-ocean text-sm font-bold text-white"
                  >
                    {kid.name[0]}
                  </span>
                </div>

                <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-midsea-ink/60">
                      {t('kidMinutesToday', { minutes: kid.minutesToday })}
                    </dt>
                    <dd className="font-display text-xl font-semibold text-midsea-deep">
                      {kid.minutesToday}′
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-midsea-ink/60">
                      {t('kidMastery', { pct: kid.masteryPct })}
                    </dt>
                    <dd className="mt-1">
                      <ProgressBar value={kid.masteryPct} label={`${kid.masteryPct}%`} />
                    </dd>
                  </div>
                </dl>

                {kid.stuckTopic ? (
                  <p className="mt-3 rounded-lg bg-midsea-coral/10 px-3 py-2 text-xs text-midsea-coral">
                    {t('kidStuck', { topic: kid.stuckTopic })}
                  </p>
                ) : null}

                <div className="mt-4 flex gap-2">
                  <Button as={Link} href={`/${locale}/parent/planner`} variant="primary">
                    {t('assignLesson')}
                  </Button>
                  <Button as={Link} href={`/${locale}/parent/reports`} variant="ghost">
                    {t('openReport')}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="week-heading" className="space-y-3">
        <h2 id="week-heading" className="font-display text-xl font-semibold text-midsea-deep">
          {t('weekHeading')}
        </h2>
        <Card>
          <p className="mb-3 text-sm text-midsea-ink/60">{t('weeklyMinutes')}</p>
          <div className="grid grid-cols-7 gap-2">
            {weekdayKeys.map((d, idx) => {
              const minutes = weeklyMinutes[idx];
              const pct = Math.round((minutes / maxMinutes) * 100);
              return (
                <div key={d} className="flex flex-col items-center gap-2">
                  <div className="relative w-full rounded-lg bg-midsea-foam" style={{ height: 80 }}>
                    <div
                      className="absolute bottom-0 left-0 w-full rounded-lg bg-gradient-to-t from-midsea-lagoon to-midsea-ocean"
                      style={{ height: `${pct}%` }}
                      aria-label={`${minutes} min`}
                    />
                  </div>
                  <span className="text-xs text-midsea-ink/60">{d}</span>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section aria-labelledby="alerts-heading" className="space-y-3">
        <h2 id="alerts-heading" className="font-display text-xl font-semibold text-midsea-deep">
          {t('alertsHeading')}
        </h2>
        <Card>
          <p className="text-sm text-midsea-ink/70">{t('noAlerts')}</p>
        </Card>
      </section>
    </div>
  );
}
