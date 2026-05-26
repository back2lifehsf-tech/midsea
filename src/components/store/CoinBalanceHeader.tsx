import { getTranslations } from 'next-intl/server';
import { CoinsIcon } from '@/components/learning/lessonIcons';

// Mejora 9 (Tienda Coin): header de /student/store con el saldo de Coins del
// estudiante + frase motivacional. Server Component puro.

export interface CoinBalanceHeaderProps {
  balance: number;
  locale: string;
}

export async function CoinBalanceHeader({ balance, locale }: CoinBalanceHeaderProps) {
  const t = await getTranslations({ locale, namespace: 'student.store' });

  return (
    <header className="mb-6">
      <div className="flex items-center gap-2">
        <CoinsIcon className="h-7 w-7 text-coin-dark" />
        <h1 className="text-2xl font-semibold text-midsea-ink">
          {t('balance', { amount: balance.toLocaleString() })}
        </h1>
      </div>
      <p className="mt-1 text-sm text-midsea-muted">{t('subtitle')}</p>
    </header>
  );
}
