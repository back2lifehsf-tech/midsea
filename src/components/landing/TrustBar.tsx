import { getTranslations } from 'next-intl/server';

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="h-4 w-4 text-midsea-lagoon"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export async function TrustBar({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.trust' });
  const items = ['accredited', 'curriculum', 'bilingual', 'faithExcellence'] as const;

  return (
    <section className="border-y border-midsea-ocean/10 bg-white/70 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-4 py-4 text-sm">
        {items.map((key) => (
          <div key={key} className="inline-flex items-center gap-2 text-midsea-deep">
            <CheckIcon />
            <span className="font-medium">{t(key)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
