import { getTranslations } from 'next-intl/server';
import { requireStudent } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { DEMO_TOTAL_COIN } from '@/lib/demo/data';
import { CoinBalanceHeader } from '@/components/store/CoinBalanceHeader';
import {
  StoreItemCard,
  type PurchaseStatus
} from '@/components/store/StoreItemCard';

// Mejora 9 (Tienda Coin): página principal de la tienda. Server Component que
// fetchea los StoreItems activos + el saldo del estudiante + sus compras, y
// delega el canje a <StoreItemCard> (client).

export default async function StudentStorePage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const activeStudent = await requireStudent(locale);
  const t = await getTranslations({ locale, namespace: 'student.store' });
  const isEs = locale !== 'en';

  const items = await prisma.storeItem.findMany({
    where: { active: true },
    orderBy: { coinPrice: 'asc' }
  });

  // Saldo + compras existentes. El demo no tiene Student real en DB: saldo
  // fijo y sin compras.
  let balance: number;
  const purchaseByItem = new Map<string, { status: PurchaseStatus }>();
  if (activeStudent.isDemo) {
    balance = DEMO_TOTAL_COIN;
  } else {
    const agg = await prisma.coinEntry.aggregate({
      where: { studentId: activeStudent.id },
      _sum: { amount: true }
    });
    balance = agg._sum.amount ?? 0;
    const purchases = await prisma.storePurchase.findMany({
      where: {
        studentId: activeStudent.id,
        status: { in: ['PENDING_APPROVAL', 'APPROVED'] }
      },
      select: { itemId: true, status: true }
    });
    for (const p of purchases) {
      purchaseByItem.set(p.itemId, { status: p.status });
    }
  }

  return (
    <div>
      <CoinBalanceHeader balance={balance} locale={locale} />

      {items.length === 0 ? (
        <p className="rounded-xl border border-midsea-border bg-midsea-foam px-4 py-8 text-center text-sm text-midsea-muted">
          {t('emptyState')}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <StoreItemCard
              key={item.id}
              item={{
                id: item.id,
                titleEs: item.titleEs,
                titleEn: item.titleEn,
                descriptionEs: item.descriptionEs,
                descriptionEn: item.descriptionEn,
                coinPrice: item.coinPrice,
                type: item.type,
                imageUrl: item.imageUrl
              }}
              studentBalance={balance}
              existingPurchase={purchaseByItem.get(item.id) ?? null}
              isEs={isEs}
            />
          ))}
        </div>
      )}
    </div>
  );
}
