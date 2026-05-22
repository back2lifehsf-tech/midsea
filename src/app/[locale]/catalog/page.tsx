import Link from 'next/link';
import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LandingNav } from '@/components/landing/LandingNav';
import { LandingFooter } from '@/components/landing/LandingFooter';
import {
  PublicCourseCard,
  type PublicCourseSummary
} from '@/components/landing/PublicCourseCard';
import { prisma } from '@/lib/prisma';

/**
 * Catalogo publico pre-signup — Epic 04 Tarea 7.
 *
 * Visible sin login. Lista los Course `published=true` con metadata
 * (titulo, descripcion, lessons, competencias) pero NO el contenido
 * de las lecciones. Anti-Wited: el padre puede auditar que hay antes
 * de pagar (ADR-005 §4).
 *
 * SEO:
 *  - SSR con metadata para shareability.
 *  - ISR cada hora: el catalogo cambia poco (rolling release post-pilot).
 */
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'catalog.meta' });
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function CatalogPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const [tCatalog, tSubject, tGradeBand] = await Promise.all([
    getTranslations({ locale, namespace: 'catalog' }),
    getTranslations({ locale, namespace: 'catalog.subjectLabel' }),
    getTranslations({ locale, namespace: 'catalog.gradeBandLabel' })
  ]);

  const courses = await prisma.course.findMany({
    where: { published: true },
    orderBy: { orderIndex: 'asc' },
    select: {
      slug: true,
      titleEs: true,
      titleEn: true,
      descriptionEs: true,
      descriptionEn: true,
      subject: true,
      gradeBand: true,
      _count: { select: { lessons: true, competencies: true } }
    }
  });

  const summaries: PublicCourseSummary[] = courses.map((c) => ({
    slug: c.slug,
    titleEs: c.titleEs,
    titleEn: c.titleEn,
    descriptionEs: c.descriptionEs,
    descriptionEn: c.descriptionEn,
    subject: c.subject,
    gradeBand: c.gradeBand,
    lessonCount: c._count.lessons,
    competencyCount: c._count.competencies
  }));

  const isEs = locale !== 'en';
  const totalLessons = summaries.reduce((acc, c) => acc + c.lessonCount, 0);

  return (
    <>
      <LandingNav />
      <main>
        <section className="relative overflow-hidden bg-midsea-foam/40 px-4 py-16 sm:py-24">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-midsea-ocean">
              {tCatalog('hero.eyebrow')}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold text-midsea-deep sm:text-5xl">
              {tCatalog('hero.title')}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-base text-midsea-ink/75 sm:text-lg">
              {tCatalog('hero.subtitle')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-midsea-ink/70">
              <span>{tCatalog('hero.stat.courses', { n: summaries.length })}</span>
              <span aria-hidden>·</span>
              <span>{tCatalog('hero.stat.lessons', { n: totalLessons })}</span>
              <span aria-hidden>·</span>
              <span>{tCatalog('hero.stat.gradeBand')}</span>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/signup`}
                className="rounded-xl bg-midsea-lagoon px-6 py-3 text-sm font-semibold text-white shadow-wave hover:bg-midsea-ocean"
              >
                {tCatalog('hero.primaryCta')}
              </Link>
              <Link
                href={`/${locale}#pricing`}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam"
              >
                {tCatalog('hero.secondaryCta')}
              </Link>
            </div>
            <p className="mt-6 text-xs text-midsea-ink/55">
              {tCatalog('hero.transparencyNote')}
            </p>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="font-display text-2xl font-bold text-midsea-deep">
              {tCatalog('list.heading')}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-midsea-ink/70">
              {tCatalog('list.subheading')}
            </p>
            {summaries.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-white p-8 text-center text-sm text-midsea-ink/60 ring-1 ring-midsea-ocean/10">
                {tCatalog('list.empty')}
              </div>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {summaries.map((course) => (
                  <PublicCourseCard
                    key={course.slug}
                    course={course}
                    isEs={isEs}
                    locale={locale}
                    ctaLabel={tCatalog('card.cta')}
                    statsLabel={tCatalog('card.stats', {
                      lessons: course.lessonCount,
                      competencies: course.competencyCount
                    })}
                    subjectLabel={tSubject(course.subject)}
                    gradeBandLabel={tGradeBand(course.gradeBand)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="bg-midsea-deep px-4 py-16 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              {tCatalog('finalCta.title')}
            </h2>
            <p className="mt-3 text-sm text-white/80 sm:text-base">
              {tCatalog('finalCta.body')}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/${locale}/signup`}
                className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-midsea-deep shadow-wave hover:bg-midsea-foam"
              >
                {tCatalog('finalCta.primary')}
              </Link>
              <Link
                href={`/${locale}/login`}
                className="rounded-xl bg-transparent px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/30 hover:bg-white/10"
              >
                {tCatalog('finalCta.secondary')}
              </Link>
            </div>
          </div>
        </section>
      </main>
      <LandingFooter locale={locale} />
    </>
  );
}
