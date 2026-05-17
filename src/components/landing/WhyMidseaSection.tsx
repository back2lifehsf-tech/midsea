import { getTranslations } from 'next-intl/server';
import { FeatureCard } from './FeatureCard';

const iconClass = 'h-6 w-6';

const featureIcons = {
  faith: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <path d="M12 3v18" />
      <path d="M7 8h10" />
      <path d="M5 14a7 7 0 0 0 14 0" />
    </svg>
  ),
  bilingual: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  flexible: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 15 14" />
      <path d="M20 4l-1.5 1.5" />
      <path d="M4 4l1.5 1.5" />
    </svg>
  ),
  accredited: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <path d="M12 2l8 4v6c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V6l8-4z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  )
};

export async function WhyMidseaSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.why' });
  const features: { key: 'faith' | 'bilingual' | 'flexible' | 'accredited' }[] = [
    { key: 'faith' },
    { key: 'bilingual' },
    { key: 'flexible' },
    { key: 'accredited' }
  ];

  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <header className="max-w-2xl space-y-3">
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
        </header>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {features.map((f) => (
            <FeatureCard
              key={f.key}
              icon={featureIcons[f.key]}
              title={t(`${f.key}.title`)}
              body={t(`${f.key}.body`)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
