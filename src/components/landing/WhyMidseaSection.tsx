import { getTranslations } from 'next-intl/server';
import { FeatureCard } from './FeatureCard';

const iconClass = 'h-6 w-6';

const featureIcons = {
  bilingual: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3a14 14 0 0 1 0 18" />
      <path d="M12 3a14 14 0 0 0 0 18" />
    </svg>
  ),
  tutor: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <rect x="4" y="7" width="16" height="13" rx="3" />
      <line x1="12" y1="3" x2="12" y2="7" />
      <circle cx="9" cy="13" r="1.2" />
      <circle cx="15" cy="13" r="1.2" />
      <path d="M9 17h6" />
    </svg>
  ),
  gamification: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4z" />
      <path d="M7 6H4v2a3 3 0 0 0 3 3" />
      <path d="M17 6h3v2a3 3 0 0 1-3 3" />
      <path d="M10 13h4v3h-4z" />
      <path d="M8 20h8" />
    </svg>
  ),
  family: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M13 19c0-2 2-3.5 4-3.5s4 1.5 4 3.5" />
    </svg>
  )
};

export async function WhyMidseaSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.why' });
  const features: { key: 'bilingual' | 'tutor' | 'gamification' | 'family' }[] = [
    { key: 'bilingual' },
    { key: 'tutor' },
    { key: 'gamification' },
    { key: 'family' }
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
