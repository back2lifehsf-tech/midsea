'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useDemoSession } from '@/lib/auth/use-demo-session';
import type { DemoRole } from '@/lib/auth/demo-shared';

// Seccion de auth para desarrollo. Salta NextAuth y crea una sesion mock
// (localStorage + cookie firmada implicitamente por Next) que requireParent
// reconoce. No usar en produccion: trivialmente falsificable.
export function DemoLogin() {
  const locale = useLocale();
  const t = useTranslations('demo');
  const { signInAs, hydrated } = useDemoSession();
  const [pending, setPending] = useState<DemoRole | null>(null);

  async function enterAs(role: DemoRole) {
    if (pending) return;
    setPending(role);
    const destination = role === 'parent' ? `/${locale}/parent` : `/${locale}/student`;
    try {
      await signInAs(role, destination);
    } catch {
      setPending(null);
    }
  }

  const disabled = !hydrated;

  return (
    <section
      aria-labelledby="demo-heading"
      className="rounded-2xl border-2 border-dashed border-midsea-ocean/20 bg-midsea-foam/60 p-5"
    >
      <header className="mb-4">
        <h2 id="demo-heading" className="font-display text-base font-bold text-midsea-deep">
          {t('heading')}
        </h2>
        <p className="mt-1 text-xs text-midsea-ink/60">{t('subheading')}</p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => enterAs('parent')}
          disabled={disabled || pending !== null}
          aria-busy={pending === 'parent'}
          className="flex flex-col items-start gap-2 rounded-xl bg-white p-4 text-left shadow-wave ring-1 ring-midsea-ocean/15 transition hover:bg-midsea-foam disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          <span aria-hidden className="text-3xl leading-none">
            👨‍👩‍👧
          </span>
          <span className="font-display text-sm font-bold text-midsea-deep">
            {pending === 'parent' ? '…' : t('asParent')}
          </span>
          <span className="text-xs text-midsea-ink/60">{t('parentDescription')}</span>
        </button>

        <button
          type="button"
          onClick={() => enterAs('student')}
          disabled={disabled || pending !== null}
          aria-busy={pending === 'student'}
          className="flex flex-col items-start gap-2 rounded-xl bg-white p-4 text-left shadow-wave ring-1 ring-midsea-ocean/15 transition hover:bg-midsea-foam disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          <span aria-hidden className="text-3xl leading-none">
            🎓
          </span>
          <span className="font-display text-sm font-bold text-midsea-deep">
            {pending === 'student' ? '…' : t('asStudent')}
          </span>
          <span className="text-xs text-midsea-ink/60">{t('studentDescription')}</span>
        </button>
      </div>

      <p className="mt-3 text-[11px] uppercase tracking-wide text-midsea-coral">{t('devOnly')}</p>
    </section>
  );
}
