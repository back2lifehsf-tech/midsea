'use client';
/**
 * Mejora 7 (Parte B): bienvenida bíblica al inicio de la vista Lectura.
 *
 * Combina el versículo del día (mismo que el dashboard) + la reflexión
 * específica de la lección (si existe) + la pregunta de conexión. Client
 * Component porque calcula la fecha en el cliente (getDailyVerse(new Date())).
 *
 * La reflexión de la lección se mueve aquí (al inicio) — antes vivía al final
 * de ReadingView. El campo Prisma reflectionEs/En no cambia.
 */
import { useTranslations } from 'next-intl';
import { getDailyVerse } from '@/lib/verses';
import { BookOpenIcon, SparklesIcon } from './lessonIcons';

export interface LessonWelcomeCardProps {
  reflectionEs?: string;
  reflectionEn?: string;
  locale: string;
}

export function LessonWelcomeCard({
  reflectionEs,
  reflectionEn,
  locale
}: LessonWelcomeCardProps) {
  const t = useTranslations('student.lesson.welcome');
  const isEs = locale !== 'en';
  const verse = getDailyVerse(new Date());
  const text = isEs ? verse.textEs : verse.textEn;
  const reference = isEs ? verse.referenceEs : verse.referenceEn;
  const reflection = isEs ? reflectionEs : reflectionEn;

  return (
    <div className="mb-6 rounded-xl border border-midsea-lagoon/20 bg-midsea-lagoon-light px-5 py-4">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-midsea-lagoon">
        <BookOpenIcon className="h-3 w-3" />
        {t('verseLabel')}
      </p>
      <p className="font-serif text-[15px] italic leading-relaxed text-midsea-ink">{text}</p>
      <p className="mt-1 text-xs font-medium text-midsea-lagoon">{reference}</p>

      {reflection ? (
        <div className="mt-3 border-t border-midsea-lagoon/20 pt-3">
          <p className="mb-1 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest text-coin-dark">
            <SparklesIcon className="h-[11px] w-[11px]" />
            {t('reflectionLabel')}
          </p>
          <p className="font-serif text-sm italic leading-relaxed text-coin-dark">{reflection}</p>
        </div>
      ) : null}

      <div className="mt-3 border-t border-midsea-lagoon/20 pt-3">
        <p className="text-sm italic text-midsea-muted">{t('connectionQuestion')}</p>
      </div>
    </div>
  );
}
