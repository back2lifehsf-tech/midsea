'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useTutorStore } from '@/lib/tutor/sylvie-state';
import { SylvieAvatar } from './SylvieAvatar';
import { SylvieChat } from './SylvieChat';

/**
 * SylvieWidget — shell flotante que mantiene a Sylvie disponible desde
 * cualquier pantalla del espacio del estudiante.
 *
 * Tres modos (en el store: widgetMode):
 *   - collapsed: cerrado, solo el botón flotante con avatar.
 *   - expanded:  popover anclado a la esquina inferior derecha con chat.
 *   - focus:     overlay pantalla completa para sesiones largas.
 *
 * Se monta una sola vez en el student layout. Lee del store global de tutor;
 * cualquier `openWidget('focus')` desde una página (p.ej. "Pedir ayuda" en la
 * lesson detail) lo abre con contexto ya seteado.
 */
export function SylvieWidget() {
  const t = useTranslations('student.sylvie');
  const pathname = usePathname();

  const widgetOpen = useTutorStore((s) => s.widgetOpen);
  const widgetMode = useTutorStore((s) => s.widgetMode);
  const sylvieState = useTutorStore((s) => s.sylvieState);
  const hasUnread = useTutorStore((s) => s.hasUnreadProactive);
  const openWidget = useTutorStore((s) => s.openWidget);
  const closeWidget = useTutorStore((s) => s.closeWidget);
  const setWidgetMode = useTutorStore((s) => s.setWidgetMode);
  const hydrateFromStorage = useTutorStore((s) => s.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // ESC cierra (focus → expanded → collapsed)
  useEffect(() => {
    if (!widgetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (widgetMode === 'focus') setWidgetMode('expanded');
      else closeWidget();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [widgetOpen, widgetMode, closeWidget, setWidgetMode]);

  // Epic 02 §5: en /stuck, Sylvie vive como pantalla completa (StuckChat).
  // El widget flotante de v1 sigue activo en el resto del student space
  // (dashboard, lessons) hasta que Epic 03 unifique ambas superficies.
  if (pathname && /\/student\/stuck(\/|$)/.test(pathname)) {
    return null;
  }

  // collapsed → botón flotante
  if (!widgetOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-40">
        <div className="relative">
          {hasUnread ? (
            <span
              aria-hidden
              className="absolute -right-0.5 -top-0.5 z-10 h-3.5 w-3.5 rounded-full bg-midsea-coral ring-2 ring-white animate-pulse"
            />
          ) : null}
          <SylvieAvatar
            state={hasUnread ? 'suggesting' : sylvieState}
            size="md"
            onClick={() => openWidget('expanded')}
            ariaLabel={hasUnread ? t('openWithUnread') : t('open')}
            className="rounded-full bg-white shadow-wave ring-1 ring-midsea-ocean/15"
          />
        </div>
      </div>
    );
  }

  // focus → fullscreen
  if (widgetMode === 'focus') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white" role="dialog" aria-modal="true">
        <header className="flex items-center justify-between border-b border-midsea-ocean/10 px-5 py-3">
          <div className="flex items-center gap-3">
            <SylvieAvatar state={sylvieState} size="sm" />
            <h2 className="font-display text-lg font-bold text-midsea-deep">{t('focusTitle')}</h2>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWidgetMode('expanded')}
              className="rounded-lg px-3 py-1.5 text-sm text-midsea-deep hover:bg-midsea-foam"
            >
              {t('minimize')}
            </button>
            <button
              type="button"
              onClick={() => closeWidget()}
              aria-label={t('close')}
              className="grid h-8 w-8 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-hidden p-4 sm:p-6">
          <div className="mx-auto h-full max-w-3xl">
            <SylvieChat mode="focus" />
          </div>
        </div>
        <footer className="border-t border-midsea-ocean/10 px-5 py-3 text-[11px] text-midsea-ink/60">
          {t('disclaimer')}
        </footer>
      </div>
    );
  }

  // expanded → popover anclado bottom-right (mobile: ocupa casi todo el ancho)
  return (
    <div
      role="dialog"
      aria-label="Sylvie chat"
      className="fixed bottom-6 right-6 z-40 w-[min(380px,calc(100vw-2rem))]"
    >
      <div className="overflow-hidden rounded-2xl bg-white shadow-wave ring-1 ring-midsea-ocean/15">
        <header className="flex items-center justify-between border-b border-midsea-ocean/10 px-4 py-2.5">
          <div className="flex items-center gap-2">
            <SylvieAvatar state={sylvieState} size="sm" />
            <span className="font-display text-sm font-bold text-midsea-deep">Sylvie</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setWidgetMode('focus')}
              aria-label={t('expand')}
              className="grid h-7 w-7 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam"
            >
              <ExpandIcon />
            </button>
            <button
              type="button"
              onClick={() => closeWidget()}
              aria-label={t('close')}
              className="grid h-7 w-7 place-items-center rounded-lg text-midsea-deep hover:bg-midsea-foam"
            >
              <CloseIcon />
            </button>
          </div>
        </header>
        <div className="p-3">
          <SylvieChat mode="expanded" />
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
