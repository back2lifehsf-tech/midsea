'use client';

import { useTranslations } from 'next-intl';

// Rediseño v3: card "Dominio" — porcentaje de mastery + texto incentivo.
// Client Component (Mejora 4) para poder renderizarse dentro del shell.

export interface LessonSidebarDomainProps {
  masteryPct: number;
  rewardCoin: number;
  hasAttempts: boolean;
}

export function LessonSidebarDomain({ masteryPct }: LessonSidebarDomainProps) {
  const t = useTranslations('student.lesson.sidebar');
  const complete = masteryPct >= 80;

  return (
    <div className="rounded-xl border border-midsea-border bg-midsea-foam p-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-midsea-muted">
        {t('domainTitle')}
      </p>
      <p className="text-3xl font-semibold text-midsea-ink">{masteryPct}%</p>
      <p className="mt-1 text-xs leading-snug text-midsea-muted">
        {complete ? t('domainComplete') : t('domainIncomplete')}
      </p>
    </div>
  );
}
