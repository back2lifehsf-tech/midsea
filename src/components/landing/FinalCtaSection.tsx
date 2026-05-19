import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function FinalCtaSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.finalCta' });

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-midsea-deep via-midsea-ocean to-midsea-lagoon p-10 text-center shadow-wave md:p-16">
          <div className="absolute -left-12 -top-12 h-48 w-48 rounded-full bg-midsea-sun/20 blur-3xl" />
          <div className="absolute -right-12 -bottom-12 h-56 w-56 rounded-full bg-midsea-coral/20 blur-3xl" />
          <div className="relative mx-auto max-w-2xl space-y-5">
            <h2 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
              {t('heading')}
            </h2>
            <p className="text-base text-white/80 sm:text-lg">{t('body')}</p>
            <div className="pt-2">
              <Link
                href={`/${locale}/signup`}
                className="inline-flex items-center justify-center rounded-2xl bg-white px-7 py-3.5 text-base font-semibold text-midsea-deep shadow-wave transition hover:bg-midsea-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-midsea-deep"
              >
                {t('cta')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
