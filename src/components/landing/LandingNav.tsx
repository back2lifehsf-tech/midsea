'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';

const sectionAnchors = [
  { key: 'features', href: '#features' },
  { key: 'pricing', href: '#pricing' },
  { key: 'forParents', href: '#parents' },
  { key: 'forStudents', href: '#learners' }
] as const;

// Sticky nav con hamburger en mobile. State minimal: el menu desplegable usa
// solo un boolean en useState. Links anchor scrollean a sus secciones; "Entrar"
// va a /[locale]/login.
export function LandingNav() {
  const locale = useLocale();
  const t = useTranslations('landing.nav');
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-midsea-ocean/10 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-display text-lg font-bold text-midsea-deep"
        >
          <span
            aria-hidden
            className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-deep shadow-wave"
          />
          MIDSEA Academy
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-1 text-sm md:flex">
          {sectionAnchors.map((s) => (
            <a
              key={s.key}
              href={s.href}
              className="rounded-lg px-3 py-1.5 text-midsea-deep hover:bg-midsea-foam"
            >
              {t(s.key)}
            </a>
          ))}
          <Link
            href={`/${locale}/catalog`}
            className="rounded-lg px-3 py-1.5 text-midsea-deep hover:bg-midsea-foam"
          >
            {t('catalog')}
          </Link>
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <LocaleSwitcher />
          <Link
            href={`/${locale}/login`}
            className="rounded-xl bg-midsea-lagoon px-4 py-2 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-ocean focus-visible:ring-offset-2"
          >
            {t('enter')}
          </Link>
        </div>

        <button
          type="button"
          aria-label={open ? t('closeMenu') : t('openMenu')}
          aria-expanded={open}
          aria-controls="landing-mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="grid h-10 w-10 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam md:hidden"
        >
          {open ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6"
              aria-hidden
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      <div
        id="landing-mobile-menu"
        hidden={!open}
        className="border-t border-midsea-ocean/10 bg-white md:hidden"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
          {sectionAnchors.map((s) => (
            <a
              key={s.key}
              href={s.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm text-midsea-deep hover:bg-midsea-foam"
            >
              {t(s.key)}
            </a>
          ))}
          <Link
            href={`/${locale}/catalog`}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm text-midsea-deep hover:bg-midsea-foam"
          >
            {t('catalog')}
          </Link>
          <div className="mt-2 flex items-center justify-between gap-2 border-t border-midsea-ocean/10 pt-3">
            <LocaleSwitcher />
            <Link
              href={`/${locale}/login`}
              onClick={() => setOpen(false)}
              className="rounded-xl bg-midsea-lagoon px-4 py-2 text-sm font-semibold text-white shadow-wave hover:bg-midsea-ocean"
            >
              {t('enter')}
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
