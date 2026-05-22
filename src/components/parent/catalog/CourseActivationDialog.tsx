'use client';
/**
 * CourseActivationDialog — Epic 04 Tarea 6.
 *
 * Modal que muestra detalles de un Course del catalogo y confirma
 * la activacion (o desactivacion) para un Student.
 *
 * UX: foco en el boton principal, Esc cierra, click afuera cierra,
 * boton de loading mientras la API responde. Espejo del flujo de
 * StudentActions (cancel/delete) que ya existe en Epic 03.5.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export interface CourseSummary {
  id: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  subject: string;
  gradeBand: string;
  lessonCount: number;
  competencyCount: number;
}

export type DialogMode = 'activate' | 'deactivate';

interface Props {
  mode: DialogMode;
  course: CourseSummary;
  studentId: string;
  studentName: string;
  isEs: boolean;
  onClose: () => void;
}

const ERROR_CODES = new Set([
  'generic',
  'unauthorized',
  'parent_not_found',
  'student_not_found',
  'course_not_found',
  'course_not_published',
  'enrollment_not_found',
  'already_inactive',
  'invalid_body'
]);

export function CourseActivationDialog({
  mode,
  course,
  studentId,
  studentName,
  isEs,
  onClose
}: Props) {
  const t = useTranslations('parent.courses.dialog');
  const tErr = useTranslations('parent.courses.errors');
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !submitting) onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, submitting]);

  const title = isEs ? course.titleEs : course.titleEn;
  const description = isEs ? course.descriptionEs : course.descriptionEn;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        mode === 'activate'
          ? `/api/parent/students/${studentId}/enrollments`
          : `/api/parent/students/${studentId}/enrollments/${course.id}`,
        {
          method: mode === 'activate' ? 'POST' : 'DELETE',
          headers:
            mode === 'activate'
              ? { 'content-type': 'application/json' }
              : undefined,
          body:
            mode === 'activate' ? JSON.stringify({ courseId: course.id }) : undefined
        }
      );
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? 'generic');
      }
      router.refresh();
      onClose();
    } catch (e) {
      setError((e as Error).message || 'generic');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="course-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={() => !submitting && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-midsea-ocean/15"
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          id="course-dialog-title"
          className="font-display text-xl font-bold text-midsea-deep"
        >
          {mode === 'activate'
            ? t('activateTitle', { course: title, name: studentName })
            : t('deactivateTitle', { course: title, name: studentName })}
        </h3>
        <p className="mt-2 text-sm text-midsea-ink/75">{description}</p>

        <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-midsea-foam/50 p-3 text-sm">
          <div>
            <dt className="text-xs uppercase text-midsea-ink/60">{t('lessons')}</dt>
            <dd className="font-semibold text-midsea-deep">{course.lessonCount}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-midsea-ink/60">
              {t('competencies')}
            </dt>
            <dd className="font-semibold text-midsea-deep">
              {course.competencyCount}
            </dd>
          </div>
        </dl>

        {mode === 'activate' ? (
          <p className="mt-4 text-xs text-midsea-ink/60">{t('includedInPlan')}</p>
        ) : (
          <p className="mt-4 text-xs text-amber-800">{t('deactivateWarning')}</p>
        )}

        {error ? (
          <p
            role="alert"
            className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700"
          >
            {tErr(ERROR_CODES.has(error) ? error : 'generic')}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl bg-midsea-foam px-4 py-2 text-sm font-medium text-midsea-deep hover:bg-midsea-ocean/10 disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting}
            autoFocus
            className={[
              'rounded-xl px-4 py-2 text-sm font-medium text-white disabled:opacity-50',
              mode === 'deactivate'
                ? 'bg-amber-600 hover:bg-amber-700'
                : 'bg-midsea-lagoon hover:bg-midsea-ocean'
            ].join(' ')}
          >
            {submitting
              ? t('submitting')
              : mode === 'activate'
                ? t('activateConfirm', { name: studentName })
                : t('deactivateConfirm')}
          </button>
        </div>
      </div>
    </div>
  );
}
