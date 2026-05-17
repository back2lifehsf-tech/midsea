import { useTranslations } from 'next-intl';

export function NexosBadge({ amount }: { amount: number }) {
  const t = useTranslations('gamification');
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-nexos to-nexos-dark px-4 py-1.5 shadow-wave">
      <span aria-hidden className="text-lg">⚡</span>
      <span className="font-display text-base font-bold text-midsea-deep">
        {amount.toLocaleString()} {t('nexosShort')}
      </span>
    </div>
  );
}
