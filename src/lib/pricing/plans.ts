import 'server-only';

/**
 * Constantes de pricing del landing. Epic 02b §1 + ADR-001 §3.
 *
 * Source of truth: ADR-001-billing-stack.md. Si cambia un precio aquí
 * SIN cambiar el Price object en Stripe Dashboard, el usuario verá un
 * número distinto al que cobra. Esa drift se mitiga en Epic 03 cuando
 * `getPlansFromStripe()` reemplace este módulo.
 *
 * `ANNUAL_DISCOUNT_PCT` vive en env y es informativo en v1 — no recalcula
 * nada que se facture. Sirve para que el badge "Ahorra X%" y el precio
 * mensual-equivalente se mantengan en sync si el equipo cambia 30 → 25
 * sin redeploy.
 *
 * Centavos en vez de dólares para evitar floating-point y porque Stripe
 * trabaja siempre en la unidad mínima de la moneda.
 */

export type Plan = 'core' | 'pro' | 'family';
export type BillingCycle = 'monthly' | 'annual';

export const PLAN_MONTHLY_CENTS: Record<Plan, number> = {
  core: 2900, // $29.00
  pro: 4500, // $45.00
  family: 6900 // $69.00 (flat, hasta 4 hijos)
};

/**
 * Plans que en v1 NO ofrecen ciclo anual. Family hereda esta lista por
 * razones de proration documentadas en ADR-001 §3 — proration sobre un
 * commitment anual cuando se agrega/quita un hijo es complejo.
 */
export const ANNUAL_DISABLED_PLANS: ReadonlySet<Plan> = new Set<Plan>(['family']);

const DEFAULT_DISCOUNT_PCT = 30;

export function getAnnualDiscountPct(): number {
  const raw = process.env.ANNUAL_DISCOUNT_PCT;
  if (raw === undefined) return DEFAULT_DISCOUNT_PCT;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > 100) return DEFAULT_DISCOUNT_PCT;
  return n;
}

/**
 * Total anual con descuento aplicado, en centavos.
 *   $29 * 12 = $348 con 30% off → $243.60 → 24360 cents.
 *
 * Aritmética entera para esquivar errores de float (`29*12*0.7` en JS da
 * `243.60000000000002`). Se descuenta sobre los CENTAVOS anuales y se
 * redondea al entero más cercano para cerrar al céntimo visible.
 */
export function computeAnnualTotalCents(
  monthlyCents: number,
  discountPct: number
): number {
  if (monthlyCents < 0) throw new Error('monthlyCents must be >= 0');
  if (discountPct < 0 || discountPct > 100) {
    throw new Error('discountPct must be in [0,100]');
  }
  const yearlyCents = monthlyCents * 12;
  const keepPct = 100 - discountPct;
  return Math.round((yearlyCents * keepPct) / 100);
}

/**
 * Equivalente mensual de un total anual, en centavos.
 *   $243.60 / 12 = $20.30 → 2030 cents.
 *
 * v1 nunca encadena este número en otro cálculo, así que el redondeo es
 * puramente cosmético.
 */
export function computeMonthlyDisplayFromAnnual(annualTotalCents: number): number {
  return Math.round(annualTotalCents / 12);
}

export interface PlanDisplay {
  plan: Plan;
  cycle: BillingCycle;
  /** Precio mostrado como mensual (real o equivalente anual/12). */
  monthlyDisplayCents: number;
  /** Total anual con descuento, o null si el plan no tiene ciclo anual. */
  annualTotalCents: number | null;
  /** Ahorro vs pagar 12 meses al precio mensual, en centavos. */
  annualSavingsCents: number;
}

export function getDisplayPlan(plan: Plan, cycle: BillingCycle): PlanDisplay {
  const monthly = PLAN_MONTHLY_CENTS[plan];
  const effectiveCycle: BillingCycle =
    cycle === 'annual' && ANNUAL_DISABLED_PLANS.has(plan) ? 'monthly' : cycle;

  if (effectiveCycle === 'monthly') {
    return {
      plan,
      cycle: 'monthly',
      monthlyDisplayCents: monthly,
      annualTotalCents: null,
      annualSavingsCents: 0
    };
  }

  const discountPct = getAnnualDiscountPct();
  const annualTotal = computeAnnualTotalCents(monthly, discountPct);
  return {
    plan,
    cycle: 'annual',
    monthlyDisplayCents: computeMonthlyDisplayFromAnnual(annualTotal),
    annualTotalCents: annualTotal,
    annualSavingsCents: monthly * 12 - annualTotal
  };
}

/**
 * Formatea cents como USD. Uso `en-US` para que `2030 → "$20.30"` sea
 * consistente entre las páginas `es` y `en` (currency code es USD; los
 * separadores siguen el inglés). Si v2 mete monedas locales, esta
 * función pasa a recibir `currency` y locale.
 */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}
