'use client';
import { useTranslations } from 'next-intl';
import { formatUsd } from '@/lib/pricing/format';
import type { SubscriptionStatus, PlanTier } from '@prisma/client';

export interface StudentCardData {
  id: string;
  displayName: string;
  gradeLevel: number;
  subscriptionStatus: SubscriptionStatus;
  planTier: PlanTier | null;
  monthlyAmountCents: number | null;
}

interface StudentCardProps {
  student: StudentCardData;
  locale: string;
}

/**
 * StudentCard. Epic 03 §1 + §6 + Estado 6 (PENDING_PAYMENT variant).
 *
 * Tres variants visuales:
 *   - ACTIVE / TRIALING → card normal con plan + grado.
 *   - PENDING_PAYMENT   → opacity 0.7, borde dashed orange, badge
 *                         "Pago pendiente" + monto a completar.
 *   - CANCELED / PAUSED → grayscale, badge "Cancelado" / "Pausado".
 *
 * Vapor prohibido (Epic 03): NO mostramos MasteryMap, minutos del día
 * ni estado emocional. Eso es Epic 04+. La card es mínima a propósito.
 */
export function StudentCard({ student, locale }: StudentCardProps) {
  const t = useTranslations('parent.students.card');
  const variant = variantFor(student.subscriptionStatus);
  const planLabel = student.planTier ? t(`plan.${student.planTier}`) : '';
  const gradeLabel =
    student.gradeLevel === 0
      ? t('gradePreK')
      : t('gradeNumbered', { n: student.gradeLevel });

  const containerClass =
    variant === 'pending'
      ? 'border-2 border-dashed border-amber-400 bg-amber-50/40 opacity-90'
      : variant === 'inactive'
        ? 'border border-midsea-ocean/10 bg-white grayscale'
        : 'border border-midsea-ocean/10 bg-white';

  return (
    <article
      data-status={student.subscriptionStatus}
      className={`relative flex h-full flex-col rounded-2xl p-4 shadow-sm transition-shadow hover:shadow-wave ${containerClass}`}
    >
      <header className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-lg font-bold text-midsea-deep">
            {student.displayName}
          </h3>
          <p className="text-xs text-midsea-ink/60">{gradeLabel}</p>
        </div>
        <Avatar name={student.displayName} variant={variant} />
      </header>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {variant === 'active' && planLabel ? (
          <Pill kind="info">{planLabel}</Pill>
        ) : null}
        <StatusPill status={student.subscriptionStatus} t={t} />
      </div>

      {variant === 'pending' && student.monthlyAmountCents !== null ? (
        <p className="mt-3 text-xs text-amber-900">
          {t('completeHint', { amount: formatUsd(student.monthlyAmountCents) })}
        </p>
      ) : null}

      <footer className="mt-auto pt-4">
        <span className="block text-[11px] text-midsea-ink/40">
          {t('viewProfileSoon')}
        </span>
      </footer>
    </article>
  );
}

type Variant = 'active' | 'pending' | 'inactive';
function variantFor(status: SubscriptionStatus): Variant {
  switch (status) {
    case 'ACTIVE':
    case 'TRIALING':
      return 'active';
    case 'PENDING_PAYMENT':
    case 'PAST_DUE':
      return 'pending';
    case 'CANCELED':
    case 'PAUSED':
      return 'inactive';
  }
}

function StatusPill({
  status,
  t
}: {
  status: SubscriptionStatus;
  t: (key: string, params?: Record<string, string | number>) => string;
}) {
  const map: Record<SubscriptionStatus, { kind: PillKind; key: string }> = {
    ACTIVE: { kind: 'success', key: 'status.active' },
    TRIALING: { kind: 'info', key: 'status.trialing' },
    PENDING_PAYMENT: { kind: 'warn', key: 'status.pending' },
    PAST_DUE: { kind: 'warn', key: 'status.pastDue' },
    CANCELED: { kind: 'muted', key: 'status.canceled' },
    PAUSED: { kind: 'muted', key: 'status.paused' }
  };
  const cfg = map[status];
  return <Pill kind={cfg.kind}>{t(cfg.key)}</Pill>;
}

type PillKind = 'info' | 'success' | 'warn' | 'muted';
function Pill({
  kind,
  children
}: {
  kind: PillKind;
  children: React.ReactNode;
}) {
  const cls: Record<PillKind, string> = {
    info: 'bg-midsea-lagoon/10 text-midsea-lagoon',
    success: 'bg-emerald-100 text-emerald-800',
    warn: 'bg-amber-100 text-amber-900',
    muted: 'bg-midsea-ink/10 text-midsea-ink/70'
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${cls[kind]}`}
    >
      {children}
    </span>
  );
}

function Avatar({ name, variant }: { name: string; variant: Variant }) {
  const initial = name.charAt(0).toUpperCase() || '?';
  const bg =
    variant === 'pending'
      ? 'bg-amber-200 text-amber-900'
      : variant === 'inactive'
        ? 'bg-midsea-ink/10 text-midsea-ink/50'
        : 'bg-gradient-to-br from-midsea-lagoon to-midsea-ocean text-white';
  return (
    <span
      aria-hidden
      className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-sm font-bold ${bg}`}
    >
      {initial}
    </span>
  );
}
