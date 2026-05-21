'use client';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import { AngelaAvatar } from './AngelaAvatar';
import { ProactiveBubble } from './ProactiveBubble';
import { useTutorStore } from '@/lib/tutor/angela-state';

/**
 * Hero variant client-side wrapper. Epic 02.5 §1.
 *
 * Se monta en el header del student layout reemplazando el círculo
 * "Midsea" original. Click abre el widget en modo expanded — Sofia
 * ve a Angela como protagonista y al primer click obtiene chat.
 *
 * En `/student/lessons/*` se oculta vía el path-check del propio
 * AngelaWidget (decisión 2026-05-20 #5); el avatar hero también
 * debe ocultarse aquí para no romper la jerarquía visual de la
 * lección. Misma regex que el widget.
 */
export function HeaderAngelaHero() {
  const t = useTranslations('student.angela');
  const pathname = usePathname();
  const angelaState = useTutorStore((s) => s.angelaState);
  const hasUnread = useTutorStore((s) => s.hasUnreadProactive);
  const openWidget = useTutorStore((s) => s.openWidget);

  // Espejo del path-check de AngelaWidget para mantener una sola
  // surface durante lecciones (Epic 04 le da contexto inline).
  if (pathname && /\/student\/(stuck|lessons)(\/|$)/.test(pathname)) {
    return null;
  }

  return (
    <div className="relative">
      {hasUnread ? (
        <span
          aria-hidden
          className="absolute -right-1 -top-1 z-10 h-3.5 w-3.5 rounded-full bg-midsea-coral ring-2 ring-white animate-pulse"
        />
      ) : null}
      <AngelaAvatar
        state={hasUnread ? 'suggesting' : angelaState}
        size="hero"
        onClick={() => openWidget('expanded')}
        ariaLabel={hasUnread ? t('openWithUnread') : t('open')}
      />
      <ProactiveBubble />
    </div>
  );
}
