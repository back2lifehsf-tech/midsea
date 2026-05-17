import { getTranslations } from 'next-intl/server';
import { CurriculumTabs } from './CurriculumTabs';

export async function CurriculumSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.curriculum' });

  return (
    <section id="curriculum" className="scroll-mt-20 bg-white/60">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <header className="max-w-2xl space-y-3">
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
        </header>
        <div className="mt-8">
          <CurriculumTabs />
        </div>
      </div>
    </section>
  );
}
