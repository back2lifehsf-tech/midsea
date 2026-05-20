'use client';
import { useState } from 'react';
import type { Plan, BillingCycle } from '@/lib/pricing/plans';
import { PricingToggle } from './PricingToggle';
import { PricingCard, type PricingCardDisplay } from './PricingCard';

export interface PricingDisplayMatrix {
  core: { monthly: PricingCardDisplay; annual: PricingCardDisplay };
  pro: { monthly: PricingCardDisplay; annual: PricingCardDisplay };
  family: { monthly: PricingCardDisplay; annual: PricingCardDisplay };
}

interface PricingPanelProps {
  displays: PricingDisplayMatrix;
  /** Sólo informativo: porcentaje a mostrar en el badge "Ahorra X%". */
  savePct: number;
}

/**
 * Container client del bloque toggle + cards. Epic 02b §2.
 *
 * Default: Anual (mayor LTV — Stripe/Linear/Notion pattern, ADR-001 §3).
 *
 * `aria-live="polite"` sobre el grid de cards: cuando el usuario alterna
 * mensual/anual el screen reader anuncia los nuevos precios. No usamos
 * `assertive` porque interrumpiría — el cambio no es urgente.
 */
export function PricingPanel({ displays, savePct }: PricingPanelProps) {
  const [cycle, setCycle] = useState<BillingCycle>('annual');

  const corePick = displays.core[cycle];
  const proPick = displays.pro[cycle];
  // Family ignora el ciclo: siempre se muestra el monthly.
  const familyPick = displays.family.monthly;

  return (
    <>
      <div className="mt-8 flex justify-center">
        <PricingToggle cycle={cycle} onChange={setCycle} savePct={savePct} />
      </div>
      <div
        className="mt-10 grid gap-5 md:grid-cols-3"
        aria-live="polite"
        aria-atomic="false"
      >
        <PricingCard
          plan="core"
          display={{ ...corePick, showAnnualSubtitle: cycle === 'annual' }}
        />
        <PricingCard
          plan="pro"
          display={{ ...proPick, showAnnualSubtitle: cycle === 'annual' }}
          highlight
        />
        <PricingCard
          plan="family"
          display={{ ...familyPick, showAnnualSubtitle: false }}
          showFamilyBadge
          showAnnualOnlyHint={cycle === 'annual'}
        />
      </div>
    </>
  );
}

/** Ayuda al server para construir el display matrix desde un solo lugar. */
export function buildDisplayCell(args: {
  monthlyDisplayCents: number;
  annualTotalCents: number | null;
  annualSavingsCents: number;
  formatUsd: (cents: number) => string;
}): PricingCardDisplay {
  const { monthlyDisplayCents, annualTotalCents, annualSavingsCents, formatUsd } = args;
  return {
    monthlyLabel: formatUsd(monthlyDisplayCents),
    annualTotalLabel:
      annualTotalCents !== null ? formatUsd(annualTotalCents) : null,
    annualSavingsLabel:
      annualSavingsCents > 0 ? formatUsd(annualSavingsCents) : null,
    // Server lo override con el flag real basado en el cycle activo:
    showAnnualSubtitle: false
  };
}

/** Re-export tipos para uso del server. */
export type { Plan, BillingCycle, PricingCardDisplay };
