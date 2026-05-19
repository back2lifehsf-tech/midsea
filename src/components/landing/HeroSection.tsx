import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Fidelis } from './Fidelis';

// Iconos inline para los chips flotantes. Mantenidos simples (stroke-based)
// para que combinen con el resto del styling y eviten una dep nueva.
const icons = {
  faith: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
      <path d="M12 4v14" />
      <path d="M8 8h8" />
    </svg>
  ),
  accredited: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
      <path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3z" />
      <polyline points="9 11 11 13 15 9" />
    </svg>
  ),
  math: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
      <line x1="4" y1="9" x2="11" y2="9" />
      <line x1="7.5" y1="5.5" x2="7.5" y2="12.5" />
      <line x1="14" y1="6" x2="20" y2="12" />
      <line x1="20" y1="6" x2="14" y2="12" />
      <line x1="4" y1="17" x2="11" y2="17" />
      <line x1="4" y1="20" x2="11" y2="20" />
      <line x1="14" y1="18" x2="20" y2="18" />
      <circle cx="17" cy="20" r="1" />
    </svg>
  ),
  science: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
      <path d="M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-10V3" />
      <line x1="8" y1="3" x2="16" y2="3" />
    </svg>
  ),
  language: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="h-4 w-4">
      <path d="M5 8h7" />
      <path d="M8.5 5v3" />
      <path d="M5 8c0 4 3 7 6 8" />
      <path d="M12 8c0 4-3 7-6 8" />
      <path d="M13 21l4-10 4 10" />
      <path d="M14.5 17.5h5" />
    </svg>
  )
};

type ChipTone = 'deep' | 'lagoon' | 'coral' | 'sun' | 'coin';

const toneClasses: Record<ChipTone, string> = {
  deep: 'text-midsea-deep',
  lagoon: 'text-midsea-lagoon',
  coral: 'text-midsea-coral',
  sun: 'text-midsea-sun',
  coin: 'text-coin-dark'
};

function Chip({
  className,
  icon,
  label,
  tone,
  delay
}: {
  className: string;
  icon: React.ReactNode;
  label: string;
  tone: ChipTone;
  delay: string;
}) {
  return (
    <div
      className={`absolute flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 shadow-wave ring-1 ring-midsea-ocean/10 animate-floatY ${toneClasses[tone]} ${className}`}
      style={{ animationDelay: delay }}
    >
      {icon}
      <span className="text-xs font-semibold text-midsea-deep">{label}</span>
    </div>
  );
}

export async function HeroSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.hero' });

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-[1.15fr_1fr] md:py-24">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-midsea-foam px-3 py-1 text-xs font-semibold uppercase tracking-wide text-midsea-ocean">
            {t('eyebrow')}
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.1] text-midsea-deep sm:text-5xl md:text-6xl">
            {t('headline')}
          </h1>
          <p className="max-w-xl text-base text-midsea-ink/75 sm:text-lg">{t('subheadline')}</p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href={`/${locale}/signup`}
              className="inline-flex items-center justify-center rounded-2xl bg-midsea-lagoon px-6 py-3 text-base font-semibold text-white shadow-wave transition hover:bg-midsea-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-ocean focus-visible:ring-offset-2"
            >
              {t('ctaPrimary')}
            </Link>
            <a
              href="#features"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 text-base font-semibold text-midsea-deep ring-1 ring-midsea-ocean/20 transition hover:bg-midsea-foam"
            >
              {t('ctaSecondary')}
            </a>
          </div>
        </div>

        <div
          className="relative mx-auto aspect-square w-full max-w-md"
          aria-label={t('visualAlt')}
          role="img"
        >
          {/* halo de fondo muy sutil — la composicion principal es Fidelis */}
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-midsea-foam via-white to-midsea-foam/40" />
          <Fidelis className="relative h-full w-full animate-floatY" />

          <Chip
            className="top-[6%] -left-3 sm:-left-6"
            icon={icons.faith}
            label={t('tagFaith')}
            tone="deep"
            delay="0s"
          />
          <Chip
            className="top-[28%] -right-3 sm:-right-6"
            icon={icons.math}
            label={t('tagMath')}
            tone="coral"
            delay="0.4s"
          />
          <Chip
            className="bottom-[34%] -left-4 sm:-left-8"
            icon={icons.science}
            label={t('tagScience')}
            tone="lagoon"
            delay="0.8s"
          />
          <Chip
            className="bottom-[14%] -right-4 sm:-right-8"
            icon={icons.language}
            label={t('tagLanguage')}
            tone="sun"
            delay="1.2s"
          />
          <Chip
            className="-bottom-2 left-1/2 -translate-x-1/2"
            icon={icons.accredited}
            label={t('tagAccredited')}
            tone="coin"
            delay="1.6s"
          />
        </div>
      </div>
    </section>
  );
}
