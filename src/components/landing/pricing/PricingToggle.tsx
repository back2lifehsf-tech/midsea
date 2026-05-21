'use client';
import { useTranslations } from 'next-intl';
import type { BillingCycle } from '@/lib/pricing/plans';

interface PricingToggleProps {
  cycle: BillingCycle;
  onChange: (next: BillingCycle) => void;
  /** Porcentaje de ahorro a mostrar en el badge inline del Anual. */
  savePct: number;
}

/**
 * Toggle Mensual / Anual. Epic 02b §6.
 *
 * Semántica radio (no toggle visual sin keyboard). `aria-live="polite"` en
 * el contenedor padre (PricingPanel) anuncia el cambio de precio cuando
 * el usuario alterna — no aquí, para no spamear al SR con el click mismo.
 *
 * Visual: un track pill con dos opciones. El estado activo se marca con
 * fondo blanco + sombra suave; el inactivo es texto sobre el track.
 */
export function PricingToggle({ cycle, onChange, savePct }: PricingToggleProps) {
  const t = useTranslations('landing.pricing.toggle');

  return (
    <fieldset className="mx-auto inline-flex items-center rounded-full bg-midsea-foam p-1 ring-1 ring-midsea-ocean/10">
      <legend className="sr-only">{t('legend')}</legend>
      <Option
        value="monthly"
        label={t('monthly')}
        checked={cycle === 'monthly'}
        onChange={onChange}
      />
      <Option
        value="annual"
        label={t('annual')}
        checked={cycle === 'annual'}
        onChange={onChange}
        badge={t('savePct', { pct: savePct })}
      />
    </fieldset>
  );
}

function Option({
  value,
  label,
  checked,
  onChange,
  badge
}: {
  value: BillingCycle;
  label: string;
  checked: boolean;
  onChange: (next: BillingCycle) => void;
  badge?: string;
}) {
  return (
    <label
      className={[
        'relative flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors',
        'has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-midsea-lagoon has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-midsea-foam',
        checked
          ? 'bg-white text-midsea-deep shadow-sm ring-1 ring-midsea-ocean/15'
          : 'text-midsea-ink/70 hover:text-midsea-deep'
      ].join(' ')}
    >
      <input
        type="radio"
        name="billing-cycle"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span>{label}</span>
      {badge ? (
        <span
          aria-hidden
          className="rounded-full bg-midsea-lagoon/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-midsea-lagoon"
        >
          {badge}
        </span>
      ) : null}
    </label>
  );
}
