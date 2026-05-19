import { useTranslations } from 'next-intl';

export function CoinBadge({ amount }: { amount: number }) {
  const t = useTranslations('gamification');
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-coin to-coin-dark px-4 py-1.5 shadow-wave">
      <span aria-hidden className="text-lg">⚡</span>
      <span className="font-display text-base font-bold text-midsea-deep">
        {amount.toLocaleString()} {t('coinShort')}
      </span>
    </div>
  );
}
