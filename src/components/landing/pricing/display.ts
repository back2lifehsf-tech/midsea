/**
 * Tipos UI + builder neutros (sin 'use client', sin 'server-only').
 *
 * Existe porque `buildDisplayCell` es una función runtime que el server
 * component `PricingSection` necesita llamar, pero antes vivía en
 * `PricingPanel.tsx` (que es 'use client'). Next.js no expone exports
 * no-componente a través de la frontera server→client → runtime error
 * "buildDisplayCell is not a function".
 *
 * Tipos también acá: importar tipos cross-boundary funciona vía
 * `import type` (erasure en compile), pero los consolidamos en un solo
 * lugar para no encadenar imports zigzag entre PricingCard / Panel /
 * Section.
 */

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

export interface PricingDisplayMatrix {
  core: { monthly: PricingCardDisplay; annual: PricingCardDisplay };
  pro: { monthly: PricingCardDisplay; annual: PricingCardDisplay };
  family: { monthly: PricingCardDisplay; annual: PricingCardDisplay };
}

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
