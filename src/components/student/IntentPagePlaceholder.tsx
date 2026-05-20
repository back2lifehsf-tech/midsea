import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { intentIcons, intentTone, type IntentKey } from './intentVisuals';

// Stub compartido por las 4 paginas de intencion (/stuck, /prep, /explore,
// /review). Honesto sobre el estado: explica que va a hacer Angela aqui en
// la version completa, no es un generico "Coming Soon".
export function IntentPagePlaceholder({
  locale,
  intentKey,
  title,
  body,
  pageBody,
  comingSoonLabel,
  backLabel
}: {
  locale: string;
  intentKey: IntentKey;
  title: string;
  body: string;
  pageBody: string;
  comingSoonLabel: string;
  backLabel: string;
}) {
  const tone = intentTone[intentKey];

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/student`}
        className="inline-block text-sm text-midsea-ocean hover:underline"
      >
        ← {backLabel}
      </Link>

      <header className="space-y-3">
        <div className={`inline-grid h-14 w-14 place-items-center rounded-2xl ${tone.iconClass}`}>
          {intentIcons[intentKey]}
        </div>
        <h1 className="font-display text-3xl font-bold text-midsea-deep">{title}</h1>
        <p className="max-w-2xl text-base text-midsea-ink/70">{body}</p>
      </header>

      <Card>
        <p className="text-sm text-midsea-ink/80">{pageBody}</p>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-wide text-midsea-ocean/70">
          {comingSoonLabel}
        </p>
      </Card>
    </div>
  );
}
