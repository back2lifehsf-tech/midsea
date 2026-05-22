'use client';
/**
 * Boton + dialog wrapper para activar/desactivar Course. El parent
 * server-component pasa todo el contexto y este client se encarga del
 * estado del dialog.
 */
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CourseActivationDialog,
  type CourseSummary,
  type DialogMode
} from './CourseActivationDialog';

export function CourseActionButton({
  mode,
  course,
  studentId,
  studentName,
  isEs,
  variant = 'primary'
}: {
  mode: DialogMode;
  course: CourseSummary;
  studentId: string;
  studentName: string;
  isEs: boolean;
  variant?: 'primary' | 'ghost';
}) {
  const t = useTranslations('parent.courses.actions');
  const [open, setOpen] = useState(false);
  const label = mode === 'activate' ? t('activate') : t('deactivate');
  const baseCls =
    'rounded-xl px-3 py-1.5 text-sm font-medium transition disabled:opacity-50';
  const variantCls =
    variant === 'primary'
      ? mode === 'activate'
        ? 'bg-midsea-lagoon text-white hover:bg-midsea-ocean'
        : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
      : 'bg-transparent text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam';
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`${baseCls} ${variantCls}`}
      >
        {label}
      </button>
      {open ? (
        <CourseActivationDialog
          mode={mode}
          course={course}
          studentId={studentId}
          studentName={studentName}
          isEs={isEs}
          onClose={() => setOpen(false)}
        />
      ) : null}
    </>
  );
}
