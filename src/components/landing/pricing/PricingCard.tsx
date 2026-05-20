'use client';
import { useLocale, useTranslations } from 'next-intl';
import type { Plan } from '@/lib/pricing/plans';

export interface PricingCardDisplay {
  /** "$29.00" o "$20.30" — pre-formateado server-side. */
  monthlyLabel: string;
  /** "$243.60" total anual, o null si no aplica. */
  annualTotalLabel: string | null;
  /** "$104.40" ahorro vs 12 meses al precio mensual, o null. */
  annualSavingsLabel: string | null;
  /** true si el toggle Anual está activo Y el plan ofrece anual. */
  showAnnualSubtitle: boolean;
}

interface PricingCardProps {
  plan: Plan;
  display: PricingCardDisplay;
  /** Pro recibe true: borde + badge "Recomendado". */
  highlight?: boolean;
  /** Family recibe true: badge "Mejor para 3+ hijos" + hint disabled. */
  showFamilyBadge?: boolean;
  /** Family con toggle=anual: hint visible "solo mensual en v1". */
  showAnnualOnlyHint?: boolean;
}

/**
 * Card individual de un plan. Epic 02b §1, §6.
 *
 * Server pre-formatea las cifras (formatUsd vive en módulo `server-only`),
 * client solo renderiza strings. Eso permite que `plans.ts` quede
 * server-only sin filtrar al bundle del cliente la lógica de env.
 *
 * Las features se leen como feat1..feat5 desde i18n (mismo patrón que
 * el landing existente — arrays via t.raw todavía no probados en este
 * proyecto). Si una key falta, next-intl tira en build → invariante
 * implícita.
 */
export function PricingCard({
  plan,
  display,
  highlight,
  showFamilyBadge,
  showAnnualOnlyHint
}: PricingCardProps) {
  const locale = useLocale();
  const t = useTranslations(`landing.pricing.plans.${plan}`);
  const tShared = useTranslations('landing.pricing');

  const features = [1, 2, 3, 4, 5].map((n) => t(`feat${n}`));

  return (
    <article
      className={[
        'relative flex h-full flex-col rounded-2xl bg-white p-6 ring-1 transition-shadow',
        highlight
          ? 'ring-2 ring-midsea-lagoon shadow-wave'
          : 'ring-midsea-ocean/10 hover:shadow-wave',
        showFamilyBadge ? 'border-t-4 border-midsea-coral' : ''
      ].join(' ')}
    >
      {highlight ? (
        <span className="absolute -top-3 left-6 rounded-full bg-midsea-lagoon px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {tShared('badgeRecommended')}
        </span>
      ) : null}
      {showFamilyBadge ? (
        <span className="absolute -top-3 right-6 rounded-full bg-midsea-coral px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
          {t('badge')}
        </span>
      ) : null}

      <header className="space-y-1">
        <h3 className="font-display text-xl font-bold text-midsea-deep">
          {t('name')}
        </h3>
        <p className="text-sm text-midsea-ink/70">{t('tagline')}</p>
      </header>

      <div className="mt-6 min-h-[110px] space-y-1">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-4xl font-bold text-midsea-deep transition-all">
            {display.monthlyLabel}
          </span>
          <span className="text-sm text-midsea-ink/60">{tShared('perMonth')}</span>
        </div>
        <p className="text-xs text-midsea-ink/60">
          {plan === 'family' ? tShared('perFour') : tShared('perStudent')}
        </p>
        {display.showAnnualSubtitle && display.annualTotalLabel && display.annualSavingsLabel ? (
          <p className="pt-1 text-xs font-medium text-midsea-lagoon">
            {tShared('annualSubtitle', {
              total: display.annualTotalLabel,
              savings: display.annualSavingsLabel
            })}
          </p>
        ) : null}
        {showAnnualOnlyHint ? (
          <p className="pt-1 text-xs text-midsea-ink/50">
            {tShared('annualOnlyMonthly')}
          </p>
        ) : null}
      </div>

      <ul className="mt-6 flex-1 space-y-2 text-sm text-midsea-ink/80">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2">
            <Check />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      {plan === 'family' ? (
        <p className="mt-4 text-[11px] text-midsea-ink/50">{t('disclaimer')}</p>
      ) : null}

      <a
        href={`/${locale}/signup?role=parent&plan=${plan}`}
        className={[
          'mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
          highlight
            ? 'bg-midsea-lagoon text-white hover:bg-midsea-ocean'
            : 'bg-midsea-deep text-white hover:bg-midsea-ocean'
        ].join(' ')}
      >
        {tShared('cta')}
      </a>
    </article>
  );
}

function Check() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="mt-0.5 h-4 w-4 shrink-0 text-midsea-lagoon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="5 11 8.5 14.5 15 7" />
    </svg>
  );
}
