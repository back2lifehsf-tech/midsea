import Link from 'next/link';
import { Card } from '@/components/ui/Card';

function CheckMini() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="mt-0.5 h-4 w-4 shrink-0 text-midsea-lagoon"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function PricingCard({
  name,
  price,
  priceSuffix,
  body,
  features,
  ctaLabel,
  ctaHref,
  popularLabel
}: {
  name: string;
  price: string;
  priceSuffix: string;
  body: string;
  features: string[];
  ctaLabel: string;
  ctaHref: string;
  popularLabel?: string;
}) {
  const highlighted = Boolean(popularLabel);

  return (
    <Card
      className={`relative flex h-full flex-col ${
        highlighted ? 'ring-2 ring-midsea-lagoon shadow-wave' : ''
      }`}
    >
      {popularLabel ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-midsea-lagoon px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-wave">
          {popularLabel}
        </span>
      ) : null}

      <h3 className="font-display text-lg font-bold text-midsea-deep">{name}</h3>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-display text-4xl font-extrabold text-midsea-deep">{price}</span>
        <span className="text-sm text-midsea-ink/60">{priceSuffix}</span>
      </div>
      <p className="mt-2 text-sm text-midsea-ink/70">{body}</p>

      <ul className="mt-5 space-y-2 text-sm text-midsea-ink/80">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <CheckMini />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6 pt-2">
        <Link
          href={ctaHref}
          className={`inline-flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-wave transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
            highlighted
              ? 'bg-midsea-lagoon text-white hover:bg-midsea-ocean focus-visible:ring-midsea-ocean'
              : 'bg-midsea-deep text-white hover:bg-midsea-ocean focus-visible:ring-midsea-ocean'
          }`}
        >
          {ctaLabel}
        </Link>
      </div>
    </Card>
  );
}
