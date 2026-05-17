import { getTranslations } from 'next-intl/server';

function CheckBullet() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-0.5 h-5 w-5 shrink-0 text-midsea-lagoon"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const styleIcons = {
  visual: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      <polygon points="9 7 18 12 9 17 9 7" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      <line x1="6" y1="10" x2="6" y2="14" />
      <line x1="10" y1="6" x2="10" y2="18" />
      <line x1="14" y1="8" x2="14" y2="16" />
      <line x1="18" y1="11" x2="18" y2="13" />
    </svg>
  ),
  kinesthetic: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      <path d="M9 11V5a2 2 0 1 1 4 0v6" />
      <path d="M13 11V4a2 2 0 1 1 4 0v9" />
      <path d="M17 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-1a6 6 0 0 1-6-6v-2" />
      <path d="M9 11a2 2 0 1 0-4 0c0 2 2 4 2 6" />
    </svg>
  ),
  social: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-6 w-6">
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
      <circle cx="9" cy="11" r="1" />
      <circle cx="13" cy="11" r="1" />
      <circle cx="17" cy="11" r="1" />
    </svg>
  )
};

export async function LearnersSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.learners' });
  const bullets = ['b1', 'b2', 'b3', 'b4'] as const;

  return (
    <section id="learners" className="scroll-mt-20">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div
          aria-label={t('visualAlt')}
          role="img"
          className="relative order-2 mx-auto aspect-square w-full max-w-md md:order-1"
        >
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-midsea-foam via-white to-midsea-lagoon/30 ring-1 ring-midsea-ocean/10">
            <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-midsea-lagoon/20 blur-2xl" />
            <div className="absolute -bottom-10 -left-10 h-44 w-44 rounded-full bg-midsea-sun/30 blur-2xl" />
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-4 p-8">
              <div className="flex flex-col items-start justify-between rounded-2xl bg-white p-4 text-midsea-ocean shadow-wave">
                {styleIcons.visual}
                <span className="h-2 w-12 rounded-full bg-midsea-foam" />
              </div>
              <div className="flex flex-col items-start justify-between rounded-2xl bg-white p-4 text-midsea-coral shadow-wave">
                {styleIcons.audio}
                <span className="h-2 w-12 rounded-full bg-midsea-foam" />
              </div>
              <div className="flex flex-col items-start justify-between rounded-2xl bg-white p-4 text-midsea-lagoon shadow-wave">
                {styleIcons.kinesthetic}
                <span className="h-2 w-12 rounded-full bg-midsea-foam" />
              </div>
              <div className="flex flex-col items-start justify-between rounded-2xl bg-white p-4 text-midsea-sun shadow-wave">
                {styleIcons.social}
                <span className="h-2 w-12 rounded-full bg-midsea-foam" />
              </div>
            </div>
          </div>
        </div>

        <div className="order-1 space-y-5 md:order-2">
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
          <ul className="space-y-3 pt-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-midsea-ink/80">
                <CheckBullet />
                <span>{t(b)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
