import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export async function LandingFooter({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.footer' });

  const columns: { heading: string; links: { label: string; href: string }[] }[] = [
    {
      heading: t('columnProduct'),
      links: [
        { label: t('catalog'), href: `/${locale}/catalog` },
        { label: t('features'), href: '#features' },
        { label: t('pricing'), href: '#pricing' },
        { label: t('forParents'), href: '#parents' },
        { label: t('forStudents'), href: '#learners' }
      ]
    },
    {
      heading: t('columnIdentity'),
      links: [
        { label: t('accreditation'), href: '#' },
        { label: t('values'), href: '#' },
        { label: t('about'), href: '#' },
        { label: t('contact'), href: '#' }
      ]
    },
    {
      heading: t('columnLegal'),
      links: [
        { label: t('terms'), href: '#' },
        { label: t('privacy'), href: '#' }
      ]
    }
  ];

  return (
    <footer className="border-t border-midsea-ocean/10 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Link
              href={`/${locale}`}
              className="flex items-center gap-2 font-display text-lg font-bold text-midsea-deep"
            >
              <span
                aria-hidden
                className="inline-block h-8 w-8 rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-deep shadow-wave"
              />
              MIDSEA Academy
            </Link>
            <p className="mt-3 max-w-xs text-sm text-midsea-ink/70">{t('brandTagline')}</p>
          </div>

          {columns.map((col) => (
            <div key={col.heading}>
              <h3 className="font-display text-sm font-bold uppercase tracking-wide text-midsea-deep">
                {col.heading}
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {col.links.map((link) =>
                  link.href.startsWith('#') ? (
                    <li key={link.label}>
                      <a href={link.href} className="text-midsea-ink/70 hover:text-midsea-deep">
                        {link.label}
                      </a>
                    </li>
                  ) : (
                    <li key={link.label}>
                      <Link href={link.href} className="text-midsea-ink/70 hover:text-midsea-deep">
                        {link.label}
                      </Link>
                    </li>
                  )
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 border-t border-midsea-ocean/10 pt-6 text-xs text-midsea-ink/60">
          {t('copyright')}
        </div>
      </div>
    </footer>
  );
}
