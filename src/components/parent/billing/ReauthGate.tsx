'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { formatUsd } from '@/lib/pricing/format';

interface ReauthGateProps {
  studentName: string;
  monthlyAmountCents: number;
  onSuccess(): void;
  onCancel(): void;
}

/**
 * Step A.5 — Re-auth gate. Epic 03 §2.5.
 *
 * Pide la contraseña otra vez antes de mostrar el Stripe Payment
 * Element. Mitiga session hijacking sin pedir 2FA (que rompería
 * adopción inicial).
 *
 * Trade-off: el padre tipea el password 2 veces (login + reauth). El
 * gate sólo se muestra al primer cobro / agregando estudiantes nuevos —
 * no en cada navegación.
 */
export function ReauthGate({
  studentName,
  monthlyAmountCents,
  onSuccess,
  onCancel
}: ReauthGateProps) {
  const t = useTranslations('parent.students.reauth');
  const tErr = useTranslations('parent.errors');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reauth', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'generic');
      }
      onSuccess();
    } catch (e) {
      setError((e as Error).message || 'generic');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <header className="space-y-2">
        <h3 className="font-display text-lg font-bold text-midsea-deep">
          {t('heading')}
        </h3>
        <p className="text-sm text-midsea-ink/70">
          {t('subheading', {
            name: studentName,
            amount: formatUsd(monthlyAmountCents)
          })}
        </p>
      </header>

      <label className="block space-y-1.5 text-sm">
        <span className="block font-medium text-midsea-deep">
          {t('passwordLabel')}
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
          autoFocus
          className="block w-full rounded-xl border border-midsea-ocean/15 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-1"
        />
      </label>

      {error ? (
        <p role="alert" className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {tErr(error in errorKeys ? error : 'generic')}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl bg-midsea-foam px-4 py-2.5 text-sm font-medium text-midsea-deep hover:bg-midsea-ocean/10"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting || !password}
          className="flex-1 rounded-xl bg-midsea-lagoon px-4 py-2.5 text-sm font-medium text-white hover:bg-midsea-ocean disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  );
}

// Whitelist de error codes que esperamos del endpoint /reauth. Cualquier
// otro cae al `generic`. Evita que el form muestre "invalid_json" raw.
const errorKeys: Record<string, true> = {
  invalid_password: true,
  no_password_set: true,
  unauthorized: true,
  generic: true
};
