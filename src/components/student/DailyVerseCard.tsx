import { getTranslations } from 'next-intl/server';
import { BookOpenIcon } from '@/components/learning/lessonIcons';
import type { Verse } from '@/lib/verses';

// Mejora 7 (Parte A): card del versículo del día en el dashboard del
// estudiante. Server Component — el versículo se calcula en page.tsx con
// getDailyVerse() (cálculo local, sin API ni DB).

export interface DailyVerseCardProps {
  verse: Verse;
  locale: string;
}

export async function DailyVerseCard({ verse, locale }: DailyVerseCardProps) {
  const t = await getTranslations({ locale, namespace: 'student.dashboard.verse' });
  const isEs = locale !== 'en';
  const text = isEs ? verse.textEs : verse.textEn;
  const reference = isEs ? verse.referenceEs : verse.referenceEn;

  return (
    <div className="mb-6 rounded-xl border border-midsea-lagoon/20 bg-midsea-lagoon-light px-5 py-4">
      <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-midsea-lagoon">
        <BookOpenIcon className="h-3 w-3" />
        {t('label')}
      </p>
      <p className="font-serif text-[15px] italic leading-relaxed text-midsea-ink">{text}</p>
      <p className="mt-1.5 text-xs font-medium text-midsea-lagoon">{reference}</p>
      <div className="mt-3 border-t border-midsea-lagoon/20 pt-3">
        <p className="text-sm italic text-midsea-muted">{t('connectionQuestion')}</p>
      </div>
    </div>
  );
}
