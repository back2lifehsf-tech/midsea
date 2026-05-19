'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { signIn } from 'next-auth/react';

type ErrorKey =
  | 'emailRequired'
  | 'emailInvalid'
  | 'nameRequired'
  | 'passwordTooShort'
  | 'passwordMismatch'
  | 'emailTaken'
  | 'generic';

const SERVER_ERROR_MAP: Record<string, ErrorKey> = {
  email_required: 'emailRequired',
  email_invalid: 'emailInvalid',
  name_required: 'nameRequired',
  password_too_short: 'passwordTooShort',
  email_taken: 'emailTaken',
  generic: 'generic'
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Form de signup de padre. Epic 01 §3a.
 *
 * Flow:
 *   1) POST /api/auth/signup con { email, name, password, locale }
 *   2) Si 201: signIn('parent-credentials', { email, password, redirect: false })
 *   3) Redirect a /<locale>/parent.
 */
export function SignupForm({ callbackUrl }: { callbackUrl: string }) {
  const t = useTranslations('auth.signup');
  const tErr = useTranslations('auth.errors');
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<ErrorKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clientValidate(): ErrorKey | null {
    if (!name.trim()) return 'nameRequired';
    if (!email.trim()) return 'emailRequired';
    if (!EMAIL_RE.test(email.trim())) return 'emailInvalid';
    if (password.length < 8) return 'passwordTooShort';
    if (password !== confirm) return 'passwordMismatch';
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const clientErr = clientValidate();
    if (clientErr) {
      setError(clientErr);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, locale })
      });
      if (!res.ok) {
        let code = 'generic';
        try {
          const data = (await res.json()) as { error?: string };
          code = data.error ?? 'generic';
        } catch {}
        setError(SERVER_ERROR_MAP[code] ?? 'generic');
        setSubmitting(false);
        return;
      }
      // Auto sign-in.
      const result = await signIn('parent-credentials', {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl
      });
      if (result?.error) {
        setError('generic');
        setSubmitting(false);
        return;
      }
      router.push(result?.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError('generic');
      setSubmitting(false);
    }
  }

  return (
    <section className="midsea-card mx-auto max-w-md space-y-5" aria-labelledby="signup-title">
      <header className="space-y-1">
        <h1 id="signup-title" className="font-display text-2xl font-bold text-midsea-deep">
          {t('title')}
        </h1>
        <p className="text-sm text-midsea-ink/70">{t('subtitle')}</p>
      </header>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field
          id="signup-name"
          label={t('nameLabel')}
          placeholder={t('namePlaceholder')}
          value={name}
          onChange={setName}
          autoComplete="name"
          disabled={submitting}
        />
        <Field
          id="signup-email"
          label={t('emailLabel')}
          type="email"
          placeholder={t('emailPlaceholder')}
          value={email}
          onChange={setEmail}
          autoComplete="email"
          disabled={submitting}
        />
        <Field
          id="signup-password"
          label={t('passwordLabel')}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          disabled={submitting}
          hint={t('passwordHint')}
        />
        <Field
          id="signup-confirm"
          label={t('confirmLabel')}
          type="password"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          disabled={submitting}
        />

        {error ? (
          <p role="alert" className="rounded-lg bg-midsea-coral/10 px-3 py-2 text-xs text-midsea-coral">
            {tErr(error)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-midsea-deep px-4 py-2.5 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>

      <p className="text-center text-xs text-midsea-ink/60">
        {t('haveAccount')}{' '}
        <Link href={`/${locale}/login`} className="font-semibold text-midsea-deep hover:underline">
          {t('haveAccountLink')}
        </Link>
      </p>
    </section>
  );
}

function Field({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  autoComplete,
  disabled,
  hint
}: {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password';
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="block text-sm font-medium text-midsea-deep">
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        disabled={disabled}
        className="w-full rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
      />
      {hint ? <p className="text-[11px] text-midsea-ink/60">{hint}</p> : null}
    </div>
  );
}
