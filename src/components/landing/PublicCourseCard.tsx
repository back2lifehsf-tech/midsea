import Link from 'next/link';

export interface PublicCourseSummary {
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

/**
 * Card publica para el catalogo `/[locale]/catalog`. NO muestra
 * contenido de lecciones — solo metadata. El contenido vive detras del
 * paywall (per guardrail epic-04 §guardrails).
 *
 * Decisiones UX:
 *   - Pill de subject + gradeBand arriba para escaneo rapido por
 *     padre buscando "Matematica 9°".
 *   - Description completa (no truncada) — el padre debe poder leerla
 *     antes de decidir signup, anti-Wited.
 *   - CTA "Empezar" lleva a /signup; el padre crea cuenta + activa
 *     este curso para su hijo despues (Tarea 6).
 */
const SUBJECT_COLOR: Record<string, string> = {
  MATH: 'bg-blue-100 text-blue-800',
  LANGUAGE: 'bg-purple-100 text-purple-800',
  ENGLISH_ESL: 'bg-indigo-100 text-indigo-800',
  HISTORY: 'bg-amber-100 text-amber-800',
  SCIENCE: 'bg-emerald-100 text-emerald-800',
  MUSIC: 'bg-rose-100 text-rose-800',
  ELECTIVE_OTHER: 'bg-midsea-ink/10 text-midsea-ink/70'
};

export function PublicCourseCard({
  course,
  isEs,
  locale,
  ctaLabel,
  statsLabel,
  subjectLabel,
  gradeBandLabel
}: {
  course: PublicCourseSummary;
  isEs: boolean;
  locale: string;
  ctaLabel: string;
  statsLabel: string;
  subjectLabel: string;
  gradeBandLabel: string;
}) {
  const title = isEs ? course.titleEs : course.titleEn;
  const description = isEs ? course.descriptionEs : course.descriptionEn;
  const subjectCls = SUBJECT_COLOR[course.subject] ?? SUBJECT_COLOR.ELECTIVE_OTHER;
  return (
    <article className="flex h-full flex-col rounded-2xl bg-white p-6 shadow-wave ring-1 ring-midsea-ocean/10 transition hover:shadow-lg">
      <div className="flex flex-wrap items-center gap-1.5">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${subjectCls}`}
        >
          {subjectLabel}
        </span>
        <span className="inline-flex items-center rounded-full bg-midsea-foam px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-midsea-deep">
          {gradeBandLabel}
        </span>
      </div>
      <h3 className="mt-3 font-display text-lg font-bold text-midsea-deep">
        {title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-midsea-ink/75">{description}</p>
      <p className="mt-4 text-xs font-medium text-midsea-ink/55">{statsLabel}</p>
      <Link
        href={`/${locale}/signup?course=${encodeURIComponent(course.slug)}`}
        className="mt-4 inline-flex items-center justify-center rounded-xl bg-midsea-lagoon px-4 py-2 text-sm font-medium text-white transition hover:bg-midsea-ocean"
      >
        {ctaLabel}
      </Link>
    </article>
  );
}
