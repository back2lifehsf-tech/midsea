import { getTranslations } from 'next-intl/server';
import { PricingCard } from './PricingCard';

type PlanKey = 'monthly' | 'annual' | 'lifetime';

const planSuffixKey: Record<PlanKey, 'perMonth' | 'perYear' | 'oneTime'> = {
  monthly: 'perMonth',
  annual: 'perYear',
  lifetime: 'oneTime'
};

export async function PricingSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.pricing' });

  const plans: { key: PlanKey; popular: boolean }[] = [
    { key: 'monthly', popular: false },
    { key: 'annual', popular: true },
    { key: 'lifetime', popular: false }
  ];

  return (
    <section id="pricing" className="scroll-mt-20 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <header className="max-w-2xl space-y-3">
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
        </header>

        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {plans.map((plan) => (
            <PricingCard
              key={plan.key}
              name={t(`${plan.key}.name`)}
              price={t(`${plan.key}.price`)}
              priceSuffix={t(planSuffixKey[plan.key])}
              body={t(`${plan.key}.body`)}
              features={[
                t(`${plan.key}.feat1`),
                t(`${plan.key}.feat2`),
                t(`${plan.key}.feat3`),
                t(`${plan.key}.feat4`)
              ]}
              ctaLabel={t('cta')}
              ctaHref={`/${locale}/login`}
              popularLabel={plan.popular ? t('popular') : undefined}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
