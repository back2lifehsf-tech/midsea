import { getTranslations } from 'next-intl/server';

/**
 * FAQ del bloque de pricing. Epic 02b §7.
 *
 * `<details>`/`<summary>` nativo: keyboard nav viene gratis (Enter / Space
 * abren/cierran), screen readers anuncian estado expandido, sin JS extra.
 * El chevron rota vía `group-open:rotate-180` — Tailwind expone el
 * pseudo-state `:open` del `<details>` como el modificador `open:`.
 *
 * Se renderiza server-side (no necesita estado de cliente) y vive bajo
 * la sección Pricing porque las dudas que captura son específicas del
 * modelo de cobro (proration, multi-hijo, métodos de pago LATAM).
 */
export async function PricingFAQ({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.pricing.faq' });
  const ids = [1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="mx-auto mt-16 max-w-3xl">
      <h3 className="text-center font-display text-2xl font-bold text-midsea-deep sm:text-3xl">
        {t('heading')}
      </h3>
      <div className="mt-6 divide-y divide-midsea-ocean/10 overflow-hidden rounded-2xl bg-white ring-1 ring-midsea-ocean/10">
        {ids.map((n) => (
          <details
            key={n}
            className="group p-4 transition-colors open:bg-midsea-foam/40 [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-lg text-base font-medium text-midsea-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2">
              <span>{t(`q${n}.question`)}</span>
              <Chevron />
            </summary>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-midsea-ink/75">
              {t(`q${n}.answer`)}
            </p>
          </details>
        ))}
      </div>
    </div>
  );
}

function Chevron() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 20 20"
      className="h-5 w-5 shrink-0 text-midsea-ink/50 transition-transform group-open:rotate-180"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 8 10 12 14 8" />
    </svg>
  );
}
