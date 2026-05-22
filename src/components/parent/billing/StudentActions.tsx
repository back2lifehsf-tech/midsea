'use client';
import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import type { SubscriptionStatus } from '@prisma/client';

interface StudentActionsProps {
  studentId: string;
  studentName: string;
  subscriptionStatus: SubscriptionStatus;
  hasStripeSubscription: boolean;
}

type ActionKind = 'cancel' | 'delete';

/**
 * StudentActions — menu contextual por card. Epic 03.5.
 *
 * Renderiza un botón `⋯` que abre un popup con acciones según el estado:
 *   - ACTIVE / TRIALING → "Cancelar suscripción"
 *   - PENDING_PAYMENT sin Stripe sub → "Eliminar"
 *   - PENDING_PAYMENT con Stripe sub → "Cancelar suscripción" (lo que
 *     desbloquea el delete después que llegue el webhook)
 *   - CANCELED / PAUSED → "Eliminar"
 *
 * Sin librería de menu (Headless UI / Radix). Click outside + Esc
 * cierran. AlertDialog inline con foco trap básico.
 */
export function StudentActions({
  studentId,
  studentName,
  subscriptionStatus,
  hasStripeSubscription
}: StudentActionsProps) {
  const t = useTranslations('parent.students.card.actions');
  const tErr = useTranslations('parent.errors');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState<ActionKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Click-outside + Esc para cerrar el menú.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const canCancel =
    hasStripeSubscription &&
    (subscriptionStatus === 'ACTIVE' ||
      subscriptionStatus === 'TRIALING' ||
      subscriptionStatus === 'PENDING_PAYMENT' ||
      subscriptionStatus === 'PAST_DUE');
  const canDelete =
    !hasStripeSubscription ||
    subscriptionStatus === 'CANCELED' ||
    subscriptionStatus === 'PAUSED';

  async function doCancel() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/billing/cancel-subscription', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ studentId })
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'generic');
      }
      setConfirm(null);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || 'generic');
    } finally {
      setSubmitting(false);
    }
  }

  async function doDelete() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'generic');
      }
      setConfirm(null);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError((e as Error).message || 'generic');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('menuLabel', { name: studentName })}
        aria-expanded={open}
        className="grid h-8 w-8 place-items-center rounded-lg text-midsea-ink/60 hover:bg-midsea-foam hover:text-midsea-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
      >
        <DotsIcon />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-9 z-20 min-w-[200px] rounded-xl bg-white py-1 shadow-wave ring-1 ring-midsea-ocean/15"
        >
          {canCancel ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirm('cancel')}
              className="block w-full px-3 py-2 text-left text-sm text-midsea-deep hover:bg-midsea-foam focus-visible:outline-none focus-visible:bg-midsea-foam"
            >
              {t('cancel')}
            </button>
          ) : null}
          {canDelete ? (
            <button
              type="button"
              role="menuitem"
              onClick={() => setConfirm('delete')}
              className="block w-full px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 focus-visible:outline-none focus-visible:bg-rose-50"
            >
              {t('delete')}
            </button>
          ) : null}
          {!canCancel && !canDelete ? (
            <p className="px-3 py-2 text-xs text-midsea-ink/50">
              {t('noActions')}
            </p>
          ) : null}
        </div>
      ) : null}

      {confirm ? (
        <AlertDialog
          title={t(`${confirm}Confirm.title`, { name: studentName })}
          body={t(`${confirm}Confirm.body`, { name: studentName })}
          confirmLabel={t(`${confirm}Confirm.confirm`)}
          cancelLabel={t(`${confirm}Confirm.cancel`)}
          destructive={confirm === 'delete'}
          submitting={submitting}
          error={error ? tErr(error in errorKeys ? error : 'generic') : null}
          onConfirm={confirm === 'cancel' ? doCancel : doDelete}
          onCancel={() => {
            setConfirm(null);
            setError(null);
          }}
        />
      ) : null}
    </div>
  );
}

const errorKeys: Record<string, true> = {
  generic: true,
  no_active_subscription: true,
  student_not_found: true,
  student_active_cancel_first: true,
  student_pending_cancel_first: true,
  unauthorized: true,
  cancel_failed: true
};

function AlertDialog({
  title,
  body,
  confirmLabel,
  cancelLabel,
  destructive,
  submitting,
  error,
  onConfirm,
  onCancel
}: {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  submitting: boolean;
  error: string | null;
  onConfirm(): void;
  onCancel(): void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-midsea-ocean/15">
        <h3 className="font-display text-lg font-bold text-midsea-deep">{title}</h3>
        <p className="mt-2 text-sm text-midsea-ink/70">{body}</p>
        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {error}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl bg-midsea-foam px-4 py-2 text-sm font-medium text-midsea-deep hover:bg-midsea-ocean/10 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={submitting}
            autoFocus
            className={[
              'rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              destructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-midsea-lagoon hover:bg-midsea-ocean'
            ].join(' ')}
          >
            {submitting ? '…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function DotsIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      className="h-5 w-5"
    >
      <circle cx="4" cy="10" r="1.5" />
      <circle cx="10" cy="10" r="1.5" />
      <circle cx="16" cy="10" r="1.5" />
    </svg>
  );
}
