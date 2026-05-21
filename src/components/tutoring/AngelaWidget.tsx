'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useTutorStore } from '@/lib/tutor/angela-state';
import { AngelaAvatar } from './AngelaAvatar';
import { AngelaChat } from './AngelaChat';
import { AngelaBottomSheet } from './AngelaBottomSheet';
import { AngelaSidePanel } from './AngelaSidePanel';

/**
 * AngelaWidget — shell flotante que mantiene a Angela disponible desde
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
export function AngelaWidget() {
  const t = useTranslations('student.angela');
  const pathname = usePathname();

  const widgetOpen = useTutorStore((s) => s.widgetOpen);
  const widgetMode = useTutorStore((s) => s.widgetMode);
  const angelaState = useTutorStore((s) => s.angelaState);
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

  // Epic 02 §5: en /stuck, Angela vive como pantalla completa (StuckChat).
  // Epic 02.5 §5: durante lecciones activas (/student/lessons/*), Angela
  // se oculta como surface global — el botón "Pedir ayuda" inline dentro
  // de LessonSurface (Epic 04) abrirá la conversación contextualizada.
  if (pathname && /\/student\/(stuck|lessons)(\/|$)/.test(pathname)) {
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
          <AngelaAvatar
            state={hasUnread ? 'suggesting' : angelaState}
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
            <AngelaAvatar state={angelaState} size="sm" />
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
            <AngelaChat mode="focus" />
          </div>
        </div>
        <footer className="border-t border-midsea-ocean/10 px-5 py-3 text-[11px] text-midsea-ink/60">
          {t('disclaimer')}
        </footer>
      </div>
    );
  }

  // Epic 02.5 §3+§4: expanded mode = bottom sheet en mobile + side panel
  // en desktop. Ambos se montan; cada uno se muestra según viewport via
  // Tailwind responsive classes en el propio componente. Shared store
  // hace que la conversación persista al cruzar el breakpoint (e.g.,
  // rotar tablet).
  return (
    <>
      <AngelaBottomSheet />
      <AngelaSidePanel />
    </>
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

