'use client';
import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { loadStripe, type Stripe as StripeJs } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { formatUsd } from '@/lib/pricing/format';

interface PaymentStepProps {
  clientSecret: string;
  studentName: string;
  amountCents: number;
  cycleLabel: string;
  onSuccess(): void;
  onFailure(message: string): void;
  onBack(): void;
}

/**
 * Step B — Confirmar Cobro con Stripe Payment Element inline.
 * Epic 03 §1 Step B + ADR-001 §12.
 *
 * El client_secret viene del response de /api/billing/subscribe.
 * `loadStripe` se cachea entre renders gracias al useMemo + variable
 * fuera del componente; no instanciar dentro del JSX porque rompería
 * la session de Elements.
 */
export function PaymentStep(props: PaymentStepProps) {
  const stripePromise = useMemo(() => loadStripePublishable(), []);
  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: props.clientSecret,
        appearance: { theme: 'stripe' }
      }}
    >
      <PaymentInner {...props} />
    </Elements>
  );
}

function PaymentInner({
  studentName,
  amountCents,
  cycleLabel,
  onSuccess,
  onFailure,
  onBack
}: PaymentStepProps) {
  const t = useTranslations('parent.students.payment');
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErrorMsg(null);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Stripe required: return_url. `redirect: 'if_required'` evita
        // navegación si no hay 3DS u otra redirección.
        return_url: window.location.origin + window.location.pathname
      },
      redirect: 'if_required'
    });
    setSubmitting(false);
    if (error) {
      // error.message viene localizado por Stripe (matches browser locale).
      const msg = error.message ?? 'payment_failed';
      setErrorMsg(msg);
      onFailure(msg);
      return;
    }
    onSuccess();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-xl bg-midsea-foam/60 p-4 ring-1 ring-midsea-ocean/10">
        <p className="text-xs uppercase tracking-wide text-midsea-ocean">
          {t('payingFor')}
        </p>
        <p className="mt-1 font-display text-lg font-bold text-midsea-deep">
          {studentName}
        </p>
        <p className="mt-2 text-sm text-midsea-ink/70">
          {t('amountLabel')}{' '}
          <span className="font-bold text-midsea-deep">
            {formatUsd(amountCents)} USD
          </span>
        </p>
        <p className="mt-2 text-xs text-midsea-ink/60">
          {t('disclaimer', { cycle: cycleLabel })}
        </p>
      </div>

      <PaymentElement />

      {errorMsg ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {errorMsg}
        </p>
      ) : null}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-xl bg-midsea-foam px-4 py-2.5 text-sm font-medium text-midsea-deep hover:bg-midsea-ocean/10 disabled:opacity-50"
        >
          {t('back')}
        </button>
        <button
          type="submit"
          disabled={!stripe || submitting}
          className="flex-1 rounded-xl bg-midsea-lagoon px-4 py-2.5 text-sm font-medium text-white hover:bg-midsea-ocean disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2"
        >
          {submitting
            ? t('confirming')
            : t('confirm', { amount: formatUsd(amountCents) })}
        </button>
      </div>
    </form>
  );
}

let cachedStripeJs: Promise<StripeJs | null> | null = null;
function loadStripePublishable(): Promise<StripeJs | null> {
  if (cachedStripeJs) return cachedStripeJs;
  const pk = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!pk) {
    return Promise.reject(
      new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY missing on client.')
    );
  }
  cachedStripeJs = loadStripe(pk);
  return cachedStripeJs;
}
