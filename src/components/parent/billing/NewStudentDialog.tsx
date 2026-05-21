'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import type { StudentCreateInput } from '@/lib/schemas/student';
import type {
  PLAN_TIER_VALUES,
  BILLING_CYCLE_VALUES
} from '@/lib/schemas/student';
import { StudentForm } from './StudentForm';
import { ReauthGate } from './ReauthGate';
import { PaymentStep } from './PaymentStep';
import { formatUsd } from '@/lib/pricing/format';

type PlanTier = (typeof PLAN_TIER_VALUES)[number];
type BillingCycle = (typeof BILLING_CYCLE_VALUES)[number];
type Step = 'form' | 'reauth' | 'payment' | 'success' | 'error';

interface CreatedStudent {
  id: string;
  displayName: string;
  monthlyAmountCents: number;
  cycle: BillingCycle;
}

interface NewStudentDialogProps {
  open: boolean;
  onClose(): void;
  defaultPlan?: PlanTier;
  defaultCycle?: BillingCycle;
}

/**
 * Orchestrator del flujo Add Student. Epic 03 §1 + §2.
 *
 * Estados:
 *   form    Step A — datos del estudiante (validados client-side con Zod).
 *   reauth  Step A.5 — re-verifica password.
 *   payment Step B  — Stripe Payment Element con clientSecret.
 *   success Step C+ — confirmación post-pago (webhook eventualmente
 *                     marca ACTIVE; UI muestra "Angela está conociendo
 *                     a {name}").
 *   error   Step C- — fallo de pago. Student queda en PENDING_PAYMENT.
 *
 * Mobile-first: el contenedor es `inset-0` con `items-end` en mobile
 * (sheet-from-bottom) y `items-center` desde sm: (dialog centered).
 * Focus trap rudimentario: autoFocus en el input principal de cada
 * step. Esc cierra. Click backdrop NO cierra (evita pérdida del Student
 * en estado intermedio).
 */
export function NewStudentDialog({
  open,
  onClose,
  defaultPlan,
  defaultCycle
}: NewStudentDialogProps) {
  const t = useTranslations('parent.students.dialog');
  const tErr = useTranslations('parent.errors');
  const [step, setStep] = useState<Step>('form');
  const [student, setStudent] = useState<CreatedStudent | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  // Reset state cuando se cierra
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => {
      setStep('form');
      setStudent(null);
      setClientSecret(null);
      setErrorCode(null);
    }, 200);
    return () => clearTimeout(t);
  }, [open]);

  async function handleFormSubmit(data: StudentCreateInput) {
    try {
      const res = await fetch('/api/students/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'create_failed');
      }
      const body = (await res.json()) as {
        student: {
          id: string;
          displayName: string;
          monthlyAmountCents: number;
        };
      };
      setStudent({
        id: body.student.id,
        displayName: body.student.displayName,
        monthlyAmountCents: body.student.monthlyAmountCents,
        cycle: data.cycle
      });
      setStep('reauth');
    } catch (e) {
      setErrorCode((e as Error).message || 'create_failed');
      setStep('error');
    }
  }

  async function handleReauthOk() {
    if (!student) return;
    try {
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studentId: student.id })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'subscribe_failed');
      }
      const body = (await res.json()) as { clientSecret: string };
      setClientSecret(body.clientSecret);
      setStep('payment');
    } catch (e) {
      setErrorCode((e as Error).message || 'subscribe_failed');
      setStep('error');
    }
  }

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="new-student-title"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
    >
      <div className="w-full max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <header className="sticky top-0 flex items-center justify-between border-b border-midsea-ocean/10 bg-white px-5 py-4">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-midsea-ocean">
              {stepLabel(step, t)}
            </p>
            <h2
              id="new-student-title"
              className="font-display text-lg font-bold text-midsea-deep"
            >
              {t('title')}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('close')}
            className="grid h-9 w-9 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
          >
            ✕
          </button>
        </header>

        <div className="p-5">
          {step === 'form' && (
            <StudentForm
              defaultPlan={defaultPlan}
              defaultCycle={defaultCycle}
              onSubmit={handleFormSubmit}
            />
          )}
          {step === 'reauth' && student && (
            <ReauthGate
              studentName={student.displayName}
              monthlyAmountCents={student.monthlyAmountCents}
              onSuccess={handleReauthOk}
              onCancel={() => setStep('form')}
            />
          )}
          {step === 'payment' && student && clientSecret && (
            <PaymentStep
              clientSecret={clientSecret}
              studentName={student.displayName}
              amountCents={student.monthlyAmountCents}
              cycleLabel={t(
                student.cycle === 'ANNUAL'
                  ? 'cycleAnnualLabel'
                  : 'cycleMonthlyLabel'
              )}
              onSuccess={() => setStep('success')}
              onFailure={(msg) => {
                setErrorCode(msg);
                setStep('error');
              }}
              onBack={() => setStep('reauth')}
            />
          )}
          {step === 'success' && student && (
            <SuccessView studentName={student.displayName} onClose={onClose} />
          )}
          {step === 'error' && (
            <ErrorView
              errorCode={errorCode}
              studentName={student?.displayName}
              onRetry={() => {
                if (student && clientSecret) setStep('payment');
                else if (student) setStep('reauth');
                else setStep('form');
              }}
              onLater={onClose}
              renderError={(c) =>
                ERR_KEYS[c] ? tErr(c) : tErr('generic')
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}

const ERR_KEYS: Record<string, true> = {
  create_failed: true,
  subscribe_failed: true,
  customer_setup_failed: true,
  subscription_create_failed: true,
  subscription_exists: true,
  student_missing_plan: true,
  unauthorized: true,
  generic: true,
  payment_failed: true
};

function stepLabel(step: Step, t: (key: string) => string): string {
  switch (step) {
    case 'form':
      return t('stepForm');
    case 'reauth':
      return t('stepReauth');
    case 'payment':
      return t('stepPayment');
    case 'success':
      return t('stepSuccess');
    case 'error':
      return t('stepError');
  }
}

function SuccessView({
  studentName,
  onClose
}: {
  studentName: string;
  onClose(): void;
}) {
  const t = useTranslations('parent.students.success');
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-100 text-3xl">
        🎉
      </div>
      <h3 className="font-display text-xl font-bold text-midsea-deep">
        {t('heading', { name: studentName })}
      </h3>
      <p className="text-sm text-midsea-ink/70">
        {t('subheading', { name: studentName })}
      </p>
      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-xl bg-midsea-lagoon px-4 py-3 font-medium text-white hover:bg-midsea-ocean"
      >
        {t('goDashboard')}
      </button>
    </div>
  );
}

function ErrorView({
  errorCode,
  studentName,
  onRetry,
  onLater,
  renderError
}: {
  errorCode: string | null;
  studentName?: string;
  onRetry(): void;
  onLater(): void;
  renderError(code: string): string;
}) {
  const t = useTranslations('parent.students.error');
  return (
    <div className="space-y-4">
      <div className="space-y-2 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-rose-100 text-3xl">
          ⚠️
        </div>
        <h3 className="font-display text-xl font-bold text-midsea-deep">
          {t('heading')}
        </h3>
        {studentName ? (
          <p className="text-sm text-midsea-ink/70">
            {t('subheading', { name: studentName })}
          </p>
        ) : null}
      </div>
      {errorCode ? (
        <p
          role="alert"
          className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
        >
          {renderError(errorCode)}
        </p>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onLater}
          className="flex-1 rounded-xl bg-midsea-foam px-4 py-2.5 text-sm font-medium text-midsea-deep hover:bg-midsea-ocean/10"
        >
          {t('later')}
        </button>
        <button
          type="button"
          onClick={onRetry}
          className="flex-1 rounded-xl bg-midsea-lagoon px-4 py-2.5 text-sm font-medium text-white hover:bg-midsea-ocean"
        >
          {t('retry')}
        </button>
      </div>
    </div>
  );
}
