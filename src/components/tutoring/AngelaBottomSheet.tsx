'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AngelaAvatar } from './AngelaAvatar';
import { AngelaChat } from './AngelaChat';
import { useTutorStore } from '@/lib/tutor/angela-state';

type Snap = 'half' | 'tall' | 'full';

const SNAP_HEIGHT: Record<Snap, string> = {
  half: 'h-[50dvh]',
  tall: 'h-[85dvh]',
  full: 'h-[100dvh]'
};

const NEXT_SNAP: Record<Snap, Snap> = {
  half: 'tall',
  tall: 'full',
  full: 'half'
};

/**
 * AngelaBottomSheet — sheet mobile que reemplaza el popover bottom-right
 * de Epic 02. Epic 02.5 §3.
 *
 * Drag handle visible como pill. Tap cicla snap heights (50dvh → 85dvh →
 * 100dvh). `dvh` (vs `vh`) respeta safe-area-bottom de iOS modernos.
 *
 * Esc cierra (delegado al keyboard handler de AngelaWidget). Tab + Enter
 * sobre el handle cicla por keyboard.
 *
 * Drag-to-resize real con touch events queda como Pendiente Epic 04
 * (requiere pointer events + framer-motion o vaul); v1 expone el handle
 * como botón para mantener a11y completa con tap/keyboard.
 */
export function AngelaBottomSheet() {
  const t = useTranslations('student.angela');
  const tSheet = useTranslations('student.angela.sheet');
  const angelaState = useTutorStore((s) => s.angelaState);
  const closeWidget = useTutorStore((s) => s.closeWidget);
  const setWidgetMode = useTutorStore((s) => s.setWidgetMode);
  const [snap, setSnap] = useState<Snap>('tall');

  // Reset snap on mount so cada apertura empieza en 'tall'.
  useEffect(() => {
    setSnap('tall');
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Angela chat"
      className="fixed inset-x-0 bottom-0 z-50 md:hidden"
    >
      <div
        className={`flex flex-col rounded-t-3xl bg-white shadow-2xl ring-1 ring-midsea-ocean/15 transition-[height] duration-200 ${SNAP_HEIGHT[snap]}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <button
          type="button"
          onClick={() => setSnap(NEXT_SNAP[snap])}
          aria-label={tSheet('dragHandle')}
          className="mx-auto my-2 grid h-7 w-16 place-items-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          <span className="block h-1.5 w-12 rounded-full bg-midsea-ink/20" aria-hidden />
        </button>

        <header className="flex items-center justify-between border-b border-midsea-ocean/10 px-4 pb-2">
          <div className="flex items-center gap-2">
            <AngelaAvatar state={angelaState} size="sm" />
            <span className="font-display text-sm font-bold text-midsea-deep">
              Angela
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWidgetMode('focus')}
              aria-label={t('expand')}
              className="grid h-8 w-8 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
            >
              <ExpandIcon />
            </button>
            <button
              type="button"
              onClick={() => closeWidget()}
              aria-label={t('close')}
              className="grid h-8 w-8 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden p-3">
          <AngelaChat mode="expanded" />
        </div>
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="h-4 w-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden className="h-4 w-4">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  );
}
