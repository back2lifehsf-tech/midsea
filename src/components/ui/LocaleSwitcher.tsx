'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { locales, type Locale } from '@/i18n';

export function LocaleSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations('nav');
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const target = locales.find((l) => l !== locale) ?? 'en';

  function switchTo(next: Locale) {
    const segments = pathname.split('/');
    if (segments[1] && (locales as readonly string[]).includes(segments[1])) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    startTransition(() => router.replace(segments.join('/') || `/${next}`));
  }

  return (
    <button
      type="button"
      onClick={() => switchTo(target)}
      disabled={pending}
      aria-label={t('switchLocale')}
      className="rounded-lg px-3 py-1.5 text-sm font-medium text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam disabled:opacity-50"
    >
      {t('switchLocale')}
    </button>
  );
}
