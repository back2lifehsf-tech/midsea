import { getTranslations } from 'next-intl/server';

function CheckBullet() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-0.5 h-5 w-5 shrink-0 text-midsea-lagoon"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export async function ParentToolsSection({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'landing.parentTools' });
  const bullets = ['b1', 'b2', 'b3', 'b4'] as const;

  return (
    <section id="parents" className="scroll-mt-20 bg-white/60">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 md:grid-cols-2 md:py-20">
        <div className="space-y-5">
          <h2 className="font-display text-3xl font-bold text-midsea-deep sm:text-4xl">
            {t('heading')}
          </h2>
          <p className="text-base text-midsea-ink/70">{t('subheading')}</p>
          <ul className="space-y-3 pt-2">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3 text-sm text-midsea-ink/80">
                <CheckBullet />
                <span>{t(b)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-label={t('visualAlt')}
          role="img"
          className="relative mx-auto aspect-square w-full max-w-md"
        >
          <div className="absolute inset-0 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-midsea-lagoon/20 via-white to-midsea-ocean/20 ring-1 ring-midsea-ocean/10">
            <div className="absolute -left-12 -top-10 h-40 w-40 rounded-full bg-midsea-lagoon/30 blur-2xl" />
            <div className="absolute -right-10 -bottom-12 h-44 w-44 rounded-full bg-midsea-coral/20 blur-2xl" />

            <div className="absolute inset-6 flex flex-col gap-3 rounded-2xl bg-white p-5 shadow-wave">
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-2 w-24 rounded-full bg-midsea-foam" />
                  <div className="mt-2 h-3 w-32 rounded-full bg-midsea-deep/80" />
                </div>
                <div className="relative">
                  <div className="h-8 w-8 rounded-full bg-midsea-lagoon" />
                  <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-midsea-coral ring-2 ring-white" />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-full bg-midsea-lagoon text-xs font-bold text-white">
                  L
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-midsea-ocean text-xs font-bold text-white">
                  M
                </div>
                <div className="grid h-9 w-9 place-items-center rounded-full bg-midsea-coral text-xs font-bold text-white">
                  S
                </div>
              </div>

              <div className="mt-1 rounded-xl bg-midsea-foam p-3">
                <div className="grid grid-cols-7 items-end gap-1">
                  {[55, 70, 40, 85, 65, 30, 0].map((v, i) => (
                    <div
                      key={i}
                      className="rounded-md bg-gradient-to-t from-midsea-lagoon to-midsea-ocean"
                      style={{ height: `${Math.max(4, v / 1.4)}px` }}
                    />
                  ))}
                </div>
              </div>

              <div className="mt-auto space-y-2">
                <div className="h-2 w-full rounded-full bg-midsea-foam" />
                <div className="h-2 w-3/4 rounded-full bg-midsea-foam" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
