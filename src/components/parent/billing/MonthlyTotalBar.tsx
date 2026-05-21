'use client';
import { useTranslations } from 'next-intl';
import { formatUsd } from '@/lib/pricing/format';
import type { StudentCardData } from './StudentCard';

interface MonthlyTotalBarProps {
  students: StudentCardData[];
}

/**
 * MonthlyTotalBar. Epic 03 §4.
 *
 * Suma monthlyAmountCents de students ACTIVE/TRIALING. Muestra el plan
 * mix ("2 Core + 1 Pro = $103/mes") cuando hay >1 student activo —
 * sirve al padre para entender el cálculo sin abrir cada card.
 *
 * Estados PENDING_PAYMENT NO suman (todavía no hay cobro confirmado).
 * Si todos los students están pending, devolvemos `$0/mes` con un
 * mensaje sutil de "completa el pago".
 *
 * Layout: sticky bottom en mobile, sidebar-like en desktop (md+).
 * El padre que mira sus 4 hijos en una pantalla pequeña debe ver
 * el total siempre.
 */
export function MonthlyTotalBar({ students }: MonthlyTotalBarProps) {
  const t = useTranslations('parent.students.total');

  const billed = students.filter(
    (s) =>
      (s.subscriptionStatus === 'ACTIVE' || s.subscriptionStatus === 'TRIALING') &&
      typeof s.monthlyAmountCents === 'number'
  );
  const totalCents = billed.reduce(
    (sum, s) => sum + (s.monthlyAmountCents ?? 0),
    0
  );
  const planCounts = countPlans(billed);

  const mixText = mixDescription(planCounts, t);

  return (
    <aside
      role="region"
      aria-label={t('aria')}
      className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-midsea-ocean/10 bg-white/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:mt-0 md:rounded-2xl md:border md:bg-white md:px-5 md:py-4 md:shadow-wave"
    >
      <div className="flex items-baseline justify-between gap-3 md:flex-col md:items-start md:gap-1">
        <div>
          <p className="text-[11px] uppercase tracking-wide text-midsea-ocean">
            {t('heading')}
          </p>
          <p className="font-display text-2xl font-bold text-midsea-deep">
            {formatUsd(totalCents)}
            <span className="ml-1 text-sm font-normal text-midsea-ink/60">
              {t('perMonth')}
            </span>
          </p>
        </div>
        {mixText ? (
          <p className="text-xs text-midsea-ink/60 md:mt-1">{mixText}</p>
        ) : null}
      </div>
    </aside>
  );
}

function countPlans(students: StudentCardData[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const s of students) {
    if (!s.planTier) continue;
    out[s.planTier] = (out[s.planTier] ?? 0) + 1;
  }
  return out;
}

function mixDescription(
  counts: Record<string, number>,
  t: (key: string, params?: Record<string, string | number>) => string
): string | null {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;
  if (total === 1) {
    const planKey = Object.keys(counts)[0];
    return t('singleStudent', { plan: t(`plan.${planKey}`) });
  }
  const parts = Object.entries(counts).map(([plan, n]) =>
    t('planCount', { n, plan: t(`plan.${plan}`) })
  );
  return parts.join(' · ');
}
