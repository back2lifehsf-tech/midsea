'use client';

import { useTranslations } from 'next-intl';
import { GoogleSignInButton } from './GoogleSignInButton';

/**
 * Pantalla de login para v1: solo Google OAuth (PRD seccion 1.4 — v1 alcance K-6,
 * ICP padres tech-savvy que usan Gmail). Email/password se reservaria para v2 si
 * agregamos passwordHash al modelo Parent.
 */
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations('auth');

  return (
    <section className="midsea-card mx-auto max-w-md space-y-5" aria-labelledby="login-title">
      <header className="space-y-1">
        <h1 id="login-title" className="font-display text-2xl font-bold text-midsea-deep">
          {t('loginTitle')}
        </h1>
        <p className="text-sm text-midsea-ink/70">{t('loginSubtitle')}</p>
      </header>

      <GoogleSignInButton callbackUrl={callbackUrl} />

      <p className="text-xs text-midsea-ink/60">{t('privacyNote')}</p>
    </section>
  );
}
