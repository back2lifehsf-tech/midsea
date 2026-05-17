'use client';

import { signOut } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useDemoSession } from '@/lib/auth/use-demo-session';

export function SignOutButton({
  callbackUrl,
  className = ''
}: {
  callbackUrl?: string;
  className?: string;
}) {
  const t = useTranslations('auth');
  const { signOut: demoSignOut } = useDemoSession();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      onClick={async () => {
        setPending(true);
        // Limpiar demo primero (localStorage + cookie); luego signOut de NextAuth
        // por si tambien hay sesion real activa. NextAuth.signOut maneja el caso
        // de "no hay sesion" sin error.
        await demoSignOut();
        void signOut({ callbackUrl: callbackUrl ?? '/' });
      }}
      disabled={pending}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium text-midsea-deep ring-1 ring-midsea-ocean/20 transition hover:bg-midsea-foam disabled:opacity-60 ${className}`}
    >
      {t('signOut')}
    </button>
  );
}
