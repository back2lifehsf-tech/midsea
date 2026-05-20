import { getTranslations } from 'next-intl/server';
import {
  getAnnualDiscountPct,
  getDisplayPlan,
  formatUsd,
  type Plan
} from '@/lib/pricing/plans';
import {
  PricingPanel,
  buildDisplayCell,
  type PricingDisplayMatrix
} from './pricing/PricingPanel';

/**
 * PricingSection — shell server. Epic 02b §1.
 *
 * Pre-computa todos los display strings (formato USD, redondeo) en el
 * servidor — el cliente sólo alterna entre `monthly` y `annual` de un
 * objeto plano. Mantiene `plans.ts` como `server-only`.
 *
 * Las cifras vienen del módulo de pricing que lee `ANNUAL_DISCOUNT_PCT`.
 * En Epic 03 esto se reemplaza por `getPlansFromStripe()` que va contra
 * el dashboard real.
 */
export async function PricingSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.pricing' });
  const savePct = getAnnualDiscountPct();

  const plans: Plan[] = ['core', 'pro', 'family'];
  const displays = plans.reduce((acc, plan) => {
    const monthly = getDisplayPlan(plan, 'monthly');
    const annual = getDisplayPlan(plan, 'annual');
    acc[plan] = {
      monthly: buildDisplayCell({
        monthlyDisplayCents: monthly.monthlyDisplayCents,
        annualTotalCents: monthly.annualTotalCents,
        annualSavingsCents: monthly.annualSavingsCents,
        formatUsd
      }),
      annual: buildDisplayCell({
        monthlyDisplayCents: annual.monthlyDisplayCents,
        annualTotalCents: annual.annualTotalCents,
        annualSavingsCents: annual.annualSavingsCents,
        formatUsd
      })
    };
    return acc;
  }, {} as PricingDisplayMatrix);

  return (
    <section id="pricing" className="scroll-mt-20 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <header className="mx-auto max-w-2xl space-y-3 text-center">
          <p className="text-xs font-bold uppercase tracking-wider text-midsea-lagoon">
            {t('eyebrow')}
          </p>
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
        </header>

        <PricingPanel displays={displays} savePct={savePct} />
      </div>
    </section>
  );
}
