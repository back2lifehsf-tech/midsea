'use client';

import { useTranslations } from 'next-intl';
import { useTutorStore } from '@/lib/tutor/angela-state';

/**
 * Rediseño v3 — Mejora 2: card "Angela" del sidebar. El card completo es
 * clickable y abre el panel de Angela inline (openWidget) sin navegar a
 * /stuck. El lessonContext ya está en el store (lo registra
 * LessonContextRegister al montar la página).
 */
export function AngelaSidebarCard({ locale }: { locale: string }) {
  const t = useTranslations('student.angela');
  const lessonContext = useTutorStore((s) => s.lessonContext);
  const openWidget = useTutorStore((s) => s.openWidget);

  const title = lessonContext
    ? locale === 'en'
      ? lessonContext.titleEn
      : lessonContext.titleEs
    : null;
  // Fallback genérico si el contexto aún no cargó / se desmontó.
  const message = title ? t('sidebarContextPrompt', { title }) : t('placeholder.default');

  const open = () => openWidget('expanded');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open();
        }
      }}
      className="cursor-pointer rounded-xl border border-midsea-border bg-midsea-foam p-4 transition-colors hover:border-midsea-lagoon/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon/40"
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-midsea-lagoon text-sm font-semibold text-white">
          A
        </span>
        <span className="text-sm font-medium text-midsea-ink">{t('sidebarLabel')}</span>
      </div>
      <p className="font-serif text-sm italic leading-relaxed text-midsea-muted">{message}</p>
    </div>
  );
}
