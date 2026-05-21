'use client';
import { useTranslations } from 'next-intl';
import { AngelaAvatar } from './AngelaAvatar';
import { AngelaChat } from './AngelaChat';
import { useTutorStore } from '@/lib/tutor/angela-state';

/**
 * AngelaSidePanel — panel lateral fijo derecho en desktop (≥md).
 * Epic 02.5 §4.
 *
 * Reemplaza el popover bottom-right de Epic 02 cuando el viewport es
 * ≥md. El panel queda visualmente "junto al contenido", no encima —
 * la idea es que Sofia pueda leer su lección y hablar con Angela sin
 * cambiar de surface.
 *
 * Ancho fijo 400px (puede extenderse a 480px en v2 si las conversaciones
 * largas lo justifican). Top arranca en 80px para no chocar con headers
 * normales; el contenido principal del student space se mueve por el
 * mismo padding gracias al layout flex superior — punt visual edge case
 * a Epic 04 cuando rediseñemos el layout con sidebar fijo.
 */
export function AngelaSidePanel() {
  const t = useTranslations('student.angela');
  const angelaState = useTutorStore((s) => s.angelaState);
  const closeWidget = useTutorStore((s) => s.closeWidget);
  const setWidgetMode = useTutorStore((s) => s.setWidgetMode);

  return (
    <aside
      role="dialog"
      aria-label="Angela chat"
      className="fixed right-0 top-20 z-40 hidden h-[calc(100dvh-5rem)] w-[400px] flex-col rounded-l-2xl bg-white shadow-wave ring-1 ring-midsea-ocean/15 md:flex"
    >
      <header className="flex items-center justify-between border-b border-midsea-ocean/10 px-4 py-3">
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
            className="grid h-7 w-7 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
          >
            <ExpandIcon />
          </button>
          <button
            type="button"
            onClick={() => closeWidget()}
            aria-label={t('close')}
            className="grid h-7 w-7 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
          >
            <CloseIcon />
          </button>
        </div>
      </header>
      <div className="flex-1 overflow-hidden p-3">
        <AngelaChat mode="expanded" />
      </div>
    </aside>
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
