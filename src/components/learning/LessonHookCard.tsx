/**
 * Mejora 8 (Activador Mental): card breve y llamativa que abre la vista
 * Lectura tras la bienvenida bíblica, para despertar la curiosidad antes de
 * leer. Componente compartido (sin 'use client', sin async): solo renderiza
 * markup estático + el label vía useTranslations. Quien lo invoca decide si
 * mostrarlo (solo cuando hay hook).
 */
import { useTranslations } from 'next-intl';
import { LightbulbIcon } from './lessonIcons';

export interface LessonHookCardProps {
  hook: string; // ya seleccionado según locale (hookEs o hookEn)
}

export function LessonHookCard({ hook }: LessonHookCardProps) {
  const t = useTranslations('student.lesson.hook');

  return (
    <div className="mb-6 rounded-xl border-2 border-midsea-lagoon/30 bg-midsea-foam px-5 py-5">
      <p className="mb-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-midsea-lagoon">
        <LightbulbIcon className="h-3 w-3" />
        {t('label')}
      </p>
      <p className="font-serif text-lg font-normal leading-snug text-midsea-ink">{hook}</p>
    </div>
  );
}
