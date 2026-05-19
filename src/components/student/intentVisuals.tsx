// Iconos + tonos compartidos entre el dashboard (4 tiles) y las 4 paginas
// stub (stuck/prep/explore/review). Tono por intencion segun la paleta
// emocional de CLAUDE.md 7.3 (Recovery/Focus/Discovery/Recovery-soft).
import type { ReactNode } from 'react';

export type IntentKey = 'stuck' | 'prep' | 'explore' | 'review';

export const INTENT_KEYS: IntentKey[] = ['stuck', 'prep', 'explore', 'review'];

const iconClass = 'h-7 w-7';

export const intentIcons: Record<IntentKey, ReactNode> = {
  stuck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 17v.01" />
      <path d="M12 14a2 2 0 0 1 .5-4 2 2 0 1 0-2.5-2" />
    </svg>
  ),
  prep: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  explore: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <path d="M5 19l3-9 9-3-3 9-9 3z" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  ),
  review: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden className={iconClass}>
      <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  )
};

export interface IntentTone {
  ringClass: string;
  iconClass: string;
  bgAccent: string;
}

export const intentTone: Record<IntentKey, IntentTone> = {
  stuck: {
    ringClass: 'ring-midsea-coral/40 hover:ring-midsea-coral',
    iconClass: 'bg-midsea-coral/15 text-midsea-coral',
    bgAccent: 'bg-midsea-coral/5'
  },
  prep: {
    ringClass: 'ring-midsea-deep/30 hover:ring-midsea-deep',
    iconClass: 'bg-midsea-deep/10 text-midsea-deep',
    bgAccent: 'bg-midsea-deep/5'
  },
  explore: {
    ringClass: 'ring-midsea-lagoon/40 hover:ring-midsea-lagoon',
    iconClass: 'bg-midsea-lagoon/15 text-midsea-lagoon',
    bgAccent: 'bg-midsea-lagoon/5'
  },
  review: {
    ringClass: 'ring-coin/50 hover:ring-coin',
    iconClass: 'bg-coin/15 text-coin-dark',
    bgAccent: 'bg-coin/5'
  }
};
