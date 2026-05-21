'use client';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useTutorStore } from '@/lib/tutor/angela-state';

const VISIBLE_MS = 3000;
const MOUNT_TICK_MS = 16; // un frame para que transition agarre

/**
 * ProactiveBubble — burbuja con texto contextual al lado del avatar hero.
 * Epic 02.5 §6.
 *
 * Cuando `ProactiveIntervention` deposita una sugerencia en `pendingProactive`,
 * la burbuja aparece 3 segundos junto al avatar y luego se oculta. El
 * `hasUnreadProactive` flag sigue activo (mostrado como dot rojo en
 * HeaderAngelaHero) hasta que Sofia abra el widget — la burbuja es el
 * heads-up; el dot es el persistent indicator.
 *
 * NO consumimos `pendingProactive` aquí: el widget lo lee al abrirse y
 * decide si insertarlo como mensaje de "angela-proactive" en el historial.
 */
export function ProactiveBubble() {
  const pending = useTutorStore((s) => s.pendingProactive);
  const t = useTranslations('student.angela.proactive');
  const [shouldRender, setShouldRender] = useState(false);
  const [transitionIn, setTransitionIn] = useState(false);

  useEffect(() => {
    if (!pending) {
      setShouldRender(false);
      setTransitionIn(false);
      return;
    }
    setShouldRender(true);
    // Frame de mount → animate opacity/translate
    const mountTimer = setTimeout(() => setTransitionIn(true), MOUNT_TICK_MS);
    // Auto-dismiss
    const hideTimer = setTimeout(() => setTransitionIn(false), VISIBLE_MS);
    const unmountTimer = setTimeout(
      () => setShouldRender(false),
      VISIBLE_MS + 350 // wait for fade-out transition
    );
    return () => {
      clearTimeout(mountTimer);
      clearTimeout(hideTimer);
      clearTimeout(unmountTimer);
    };
  }, [pending]);

  if (!shouldRender || !pending) return null;

  const text = t(pending.messageKey, pending.messageParams ?? {});

  return (
    <div
      role="status"
      aria-live="polite"
      className={[
        'pointer-events-none absolute left-full top-1/2 z-30 ml-3 hidden -translate-y-1/2 sm:block',
        'max-w-[260px] transition-all duration-300',
        transitionIn ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
      ].join(' ')}
    >
      <div className="relative rounded-2xl bg-white px-4 py-2.5 text-sm leading-snug text-midsea-deep shadow-wave ring-1 ring-midsea-ocean/15">
        {text}
        <span
          aria-hidden
          className="absolute -left-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm bg-white ring-1 ring-midsea-ocean/15"
        />
      </div>
    </div>
  );
}
