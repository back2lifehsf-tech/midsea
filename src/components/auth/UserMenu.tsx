'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { GoogleSignInButton } from './GoogleSignInButton';
import { SignOutButton } from './SignOutButton';
import { useDemoSession } from '@/lib/auth/use-demo-session';

/**
 * Muestra el usuario conectado (real de NextAuth o demo) con badge "DEMO"
 * cuando aplique. Si no hay ninguna sesion, muestra el CTA de Google.
 * Real session > demo session si por algun motivo coexisten.
 */
export function UserMenu({ callbackUrl }: { callbackUrl?: string }) {
  const { data: session, status } = useSession();
  const { user: demoUser, hydrated: demoHydrated } = useDemoSession();
  const t = useTranslations('auth');
  const tDemo = useTranslations('demo');

  if (status === 'loading' || !demoHydrated) {
    return (
      <span
        className="inline-flex h-8 w-8 animate-pulse rounded-full bg-midsea-foam"
        aria-label={t('loading')}
      />
    );
  }

  const realName = session?.user?.name ?? session?.user?.email ?? null;
  const effective = realName
    ? { name: realName, isDemo: false }
    : demoUser
      ? { name: demoUser.name, isDemo: true }
      : null;

  if (!effective) {
    return <GoogleSignInButton callbackUrl={callbackUrl} className="!w-auto !py-1.5 !text-xs" />;
  }

  const initials = effective.name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-full bg-white px-3 py-1 ring-1 ring-midsea-ocean/15 shadow-wave">
        <span
          aria-hidden
          className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-ocean text-xs font-bold text-white"
        >
          {initials || '·'}
        </span>
        <span className="text-sm font-medium text-midsea-deep">
          {t('signedInAs', { name: effective.name })}
        </span>
        {effective.isDemo ? (
          <span className="rounded-md bg-midsea-coral px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            {tDemo('badge')}
          </span>
        ) : null}
      </div>
      <SignOutButton />
    </div>
  );
}
