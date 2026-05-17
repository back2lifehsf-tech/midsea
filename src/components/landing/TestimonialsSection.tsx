import { getTranslations } from 'next-intl/server';
import { TestimonialCard } from './TestimonialCard';

export async function TestimonialsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.testimonials' });

  const items = [
    { key: 't1', tone: 'lagoon' },
    { key: 't2', tone: 'ocean' },
    { key: 't3', tone: 'coral' }
  ] as const;

  return (
    <section id="testimonials" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-4 py-16 md:py-20">
        <header className="max-w-2xl space-y-3">
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
        </header>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((item) => (
            <TestimonialCard
              key={item.key}
              quote={t(`${item.key}.quote`)}
              name={t(`${item.key}.name`)}
              location={t(`${item.key}.location`)}
              tone={item.tone}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
