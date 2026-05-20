'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { NewStudentDialog } from './NewStudentDialog';
import type {
  PLAN_TIER_VALUES,
  BILLING_CYCLE_VALUES
} from '@/lib/schemas/student';

type PlanTier = (typeof PLAN_TIER_VALUES)[number];
type BillingCycle = (typeof BILLING_CYCLE_VALUES)[number];

interface AddStudentButtonProps {
  /** Default plan precargado en el form. Viene del query param del landing. */
  initialPlan?: PlanTier;
  initialCycle?: BillingCycle;
  /** 'cta' renders a big primary button (empty state); 'header' renders a slim one. */
  variant?: 'cta' | 'header';
}

/**
 * Botón cliente que abre `NewStudentDialog`. Epic 03 §1.
 *
 * Aislado para que el parent dashboard (server component) pueda
 * mantenerse `async` y solo prender el dialog en una pequeña isla.
 */
export function AddStudentButton({
  initialPlan,
  initialCycle,
  variant = 'header'
}: AddStudentButtonProps) {
  const t = useTranslations('parent.students.list');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          variant === 'cta'
            ? 'inline-flex items-center justify-center gap-2 rounded-xl bg-midsea-lagoon px-6 py-3 text-base font-medium text-white shadow-wave transition-colors hover:bg-midsea-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2'
            : 'inline-flex items-center gap-1 rounded-lg bg-midsea-deep px-3 py-1.5 text-sm font-medium text-white hover:bg-midsea-ocean focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2'
        }
      >
        <span aria-hidden>+</span>
        <span>{t('addCta')}</span>
      </button>
      <NewStudentDialog
        open={open}
        onClose={() => setOpen(false)}
        defaultPlan={initialPlan}
        defaultCycle={initialCycle}
      />
    </>
  );
}
