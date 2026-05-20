/**
 * Formatter universal (no server-only) para precios USD. Epic 03 Tarea 4.
 *
 * Existe como módulo separado de `plans.ts` porque este último es
 * `server-only` y los componentes cliente (ReauthGate, PaymentStep)
 * necesitan formatear `monthlyAmountCents` que viene como número plano
 * desde el server.
 *
 * Si v2 mete monedas locales, esta función pasa a recibir
 * `(cents, currency, locale)`.
 */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(cents / 100);
}
