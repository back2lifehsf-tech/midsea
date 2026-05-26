import Link from 'next/link';
import { useTranslations } from 'next-intl';

const baseCls =
  'inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coin to-coin-dark px-4 py-1.5 shadow-wave';

// Mejora 9: si se pasa `href`, el badge es un link a la tienda Coin.
export function CoinBadge({ amount, href }: { amount: number; href?: string }) {
  const t = useTranslations('gamification');
  const content = (
    <>
      <span aria-hidden className="text-lg">
        ⚡
      </span>
      <span className="font-display text-base font-bold text-midsea-deep">
        {amount.toLocaleString()} {t('coinShort')}
      </span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={`${baseCls} transition-opacity hover:opacity-80`}>
        {content}
      </Link>
    );
  }
  return <div className={baseCls}>{content}</div>;
}
