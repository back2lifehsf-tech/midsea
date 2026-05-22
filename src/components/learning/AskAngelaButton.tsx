/**
 * Boton inline "Pedir ayuda a Angela" — Epic 04 Tarea 5.
 *
 * Lleva al estudiante a /stuck con el lessonSlug pre-cargado como query
 * param. La integracion completa de Angela con contexto curricular
 * (CurriculumContextEngine real-time) es Epic 04.5/v1.1; en este epic
 * basta con redirigir y dejar que el chat existente reciba el slug por
 * query param.
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function AskAngelaButton({
  locale,
  lessonSlug,
  studentFirstName
}: {
  locale: string;
  lessonSlug: string;
  studentFirstName: string;
}) {
  const t = await getTranslations({ locale, namespace: 'student.lesson.askAngela' });
  const href = `/${locale}/student/stuck?lessonSlug=${encodeURIComponent(lessonSlug)}`;
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3 rounded-2xl bg-midsea-foam px-4 py-3 text-sm font-medium text-midsea-deep ring-1 ring-midsea-ocean/15 transition hover:bg-midsea-ocean/10"
      aria-label={t('ariaLabel', { name: studentFirstName })}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-6 w-6 shrink-0 text-midsea-ocean"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
      <span>
        <span className="block">{t('label')}</span>
        <span className="block text-xs text-midsea-ink/60">{t('hint')}</span>
      </span>
    </Link>
  );
}
