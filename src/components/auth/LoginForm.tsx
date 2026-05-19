'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { GoogleSignInButton } from './GoogleSignInButton';

/**
 * Login de padre. Acepta dos métodos:
 *   - Google OAuth (legacy / opcional, atajo)
 *   - Email + password (Credentials Provider, Epic 01 §3a)
 *
 * El divider entre ambos se muestra siempre. Si Google no está configurado
 * el botón sigue visible pero falla; ese caso lo cubre /api/auth/error.
 */
export function LoginForm({ callbackUrl }: { callbackUrl?: string }) {
  const t = useTranslations('auth');
  const tSignIn = useTranslations('auth.signIn');
  const tErr = useTranslations('auth.errors');
  const locale = useLocale();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const target = callbackUrl ?? `/${locale}/parent`;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!email.trim() || !password) {
      setError(tErr('invalidCredentials'));
      return;
    }
    setError(null);
    setSubmitting(true);
    const result = await signIn('parent-credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: target
    });
    if (!result || result.error) {
      setError(tErr('invalidCredentials'));
      setSubmitting(false);
      return;
    }
    router.push(result.url ?? target);
    router.refresh();
  }

  return (
    <section className="midsea-card mx-auto max-w-md space-y-5" aria-labelledby="login-title">
      <header className="space-y-1">
        <h1 id="login-title" className="font-display text-2xl font-bold text-midsea-deep">
          {t('loginTitle')}
        </h1>
        <p className="text-sm text-midsea-ink/70">{t('loginSubtitle')}</p>
      </header>

      <GoogleSignInButton callbackUrl={target} />

      <div className="flex items-center gap-3 text-[11px] uppercase tracking-wide text-midsea-ink/50">
        <span aria-hidden className="h-px flex-1 bg-midsea-ocean/15" />
        <span>{tSignIn('divider')}</span>
        <span aria-hidden className="h-px flex-1 bg-midsea-ocean/15" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <div className="space-y-1">
          <label htmlFor="login-email" className="block text-sm font-medium text-midsea-deep">
            {tSignIn('emailLabel')}
          </label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={tSignIn('emailPlaceholder')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="login-password" className="block text-sm font-medium text-midsea-deep">
            {tSignIn('passwordLabel')}
          </label>
          <input
            id="login-password"
            type="password"
            autoComplete="current-password"
            placeholder={tSignIn('passwordPlaceholder')}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-midsea-coral/10 px-3 py-2 text-xs text-midsea-coral">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-midsea-deep px-4 py-2.5 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          {submitting ? tSignIn('submitting') : tSignIn('submit')}
        </button>
      </form>

      <p className="text-center text-xs text-midsea-ink/60">
        {tSignIn('noAccount')}{' '}
        <Link href={`/${locale}/signup`} className="font-semibold text-midsea-deep hover:underline">
          {tSignIn('noAccountLink')}
        </Link>
      </p>

      <p className="text-xs text-midsea-ink/60">{t('privacyNote')}</p>
    </section>
  );
}
