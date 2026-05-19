import { Card } from '@/components/ui/Card';

const avatarTones = ['lagoon', 'coral', 'ocean', 'sun'] as const;
type AvatarTone = (typeof avatarTones)[number];

const toneBg: Record<AvatarTone, string> = {
  lagoon: 'bg-gradient-to-br from-midsea-lagoon to-midsea-ocean',
  coral: 'bg-gradient-to-br from-midsea-coral to-midsea-sun',
  ocean: 'bg-gradient-to-br from-midsea-ocean to-midsea-deep',
  sun: 'bg-gradient-to-br from-coin to-coin-dark'
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function TestimonialCard({
  quote,
  name,
  location,
  tone
}: {
  quote: string;
  name: string;
  location: string;
  tone: AvatarTone;
}) {
  return (
    <Card className="flex h-full flex-col">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden
        className="h-6 w-6 text-midsea-lagoon/60"
      >
        <path d="M7 7h4v6H7v3a2 2 0 0 1-2 2H4v-7a4 4 0 0 1 3-4zm9 0h4v6h-4v3a2 2 0 0 1-2 2h-1v-7a4 4 0 0 1 3-4z" />
      </svg>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-midsea-ink/80">{quote}</p>
      <div className="mt-5 flex items-center gap-3">
        <span
          aria-hidden
          className={`grid h-10 w-10 place-items-center rounded-full text-sm font-bold text-white shadow-wave ${toneBg[tone]}`}
        >
          {initials(name)}
        </span>
        <div>
          <p className="font-display text-sm font-semibold text-midsea-deep">{name}</p>
          <p className="text-xs text-midsea-ink/60">{location}</p>
        </div>
      </div>
    </Card>
  );
}
