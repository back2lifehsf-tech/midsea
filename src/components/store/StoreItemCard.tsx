'use client';
/**
 * Mejora 9 (Tienda Coin): card de un ítem premium canjeable con Coins.
 *
 * Recibe el saldo y la compra existente como props desde la página (Server
 * Component) — NO fetchea balance por su cuenta. Maneja el click de canje y
 * el estado del botón. En v1 toda compra queda PENDING_APPROVAL.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { CoinsIcon } from '@/components/learning/lessonIcons';

export type StoreItemType = 'COURSE' | 'MASTERCLASS' | 'ELECTIVE';
export type PurchaseStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

export interface StoreItemView {
  id: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  coinPrice: number;
  type: StoreItemType;
  imageUrl: string | null;
}

export interface StoreItemCardProps {
  item: StoreItemView;
  studentBalance: number;
  existingPurchase?: { status: PurchaseStatus } | null;
  isEs: boolean;
}

const TYPE_BADGE: Record<StoreItemType, string> = {
  COURSE: 'bg-midsea-lagoon-light text-midsea-lagoon',
  ELECTIVE: 'bg-midsea-lagoon-light text-midsea-lagoon',
  MASTERCLASS: 'bg-coin-light text-coin-dark'
};

export function StoreItemCard({
  item,
  studentBalance,
  existingPurchase,
  isEs
}: StoreItemCardProps) {
  const t = useTranslations('student.store');
  const router = useRouter();

  // El status local arranca del existingPurchase y se actualiza tras el canje.
  const [status, setStatus] = useState<PurchaseStatus | null>(
    existingPurchase?.status ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(false);
  const [success, setSuccess] = useState(false);

  const title = isEs ? item.titleEs : item.titleEn;
  const description = isEs ? item.descriptionEs : item.descriptionEn;
  const canAfford = studentBalance >= item.coinPrice;

  const buy = async () => {
    setSubmitting(true);
    setError(false);
    try {
      const res = await fetch('/api/store/purchase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      if (!res.ok) throw new Error('purchase_failed');
      setStatus('PENDING_APPROVAL');
      setSuccess(true);
      // Refresca el saldo del header y el resto de cards.
      router.refresh();
    } catch {
      setError(true);
    } finally {
      setSubmitting(false);
    }
  };

  // Estado del CTA según compra previa / saldo.
  let action: React.ReactNode;
  if (status === 'APPROVED') {
    action = (
      <div className="mt-3 w-full rounded-lg bg-midsea-lagoon-light py-2 text-center text-sm font-medium text-midsea-lagoon">
        {t('approved')}
      </div>
    );
  } else if (status === 'PENDING_APPROVAL') {
    action = (
      <Button variant="ghost" disabled className="mt-3 w-full opacity-50">
        {t('pendingApproval')}
      </Button>
    );
  } else if (!canAfford) {
    action = (
      <Button variant="ghost" disabled className="mt-3 w-full opacity-50">
        {t('insufficientCoins')}
      </Button>
    );
  } else {
    action = (
      <Button variant="primary" className="mt-3 w-full" onClick={buy} disabled={submitting}>
        {t('buyButton')}
      </Button>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-midsea-border bg-midsea-foam shadow-card">
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt={title} className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 w-full items-center justify-center bg-midsea-lagoon-light">
          <CoinsIcon className="h-10 w-10 text-midsea-lagoon/50" />
        </div>
      )}

      <div className="p-4">
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${TYPE_BADGE[item.type]}`}
        >
          {t(`itemTypes.${item.type}`)}
        </span>

        <h3 className="mt-2 font-serif text-base font-normal text-midsea-ink">{title}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-snug text-midsea-muted">{description}</p>

        <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-coin-dark">
          <CoinsIcon className="h-3.5 w-3.5" />
          {t('coinPrice', { price: item.coinPrice.toLocaleString() })}
        </p>

        {action}

        {success ? (
          <p role="status" className="mt-2 text-xs text-midsea-lagoon">
            {t('purchaseSuccess')}
          </p>
        ) : null}
        {error ? (
          <p role="alert" className="mt-2 text-xs text-rose-700">
            {t('purchaseError')}
          </p>
        ) : null}
      </div>
    </div>
  );
}
