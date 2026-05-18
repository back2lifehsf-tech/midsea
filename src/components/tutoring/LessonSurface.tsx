'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTutorStore } from '@/lib/tutor/sylvie-state';
import type { LessonContext } from '@/lib/tutor/LessonContext';
import { ExerciseDemo } from './ExerciseDemo';

/**
 * LessonSurface — orquestador client-side de la página de lección.
 *
 * 1) En mount registra el contexto curricular en el store (Sylvie ya sabe
 *    dónde está el estudiante).
 * 2) Renderiza el ExerciseDemo (MCQ mock) que dispara `recordAnswer` → motor
 *    de intervención proactiva → Sylvie aparece sugiriendo en el widget.
 * 3) Expone un botón "Pedir ayuda" que abre el SylvieWidget en modo focus.
 * 4) En unmount limpia el contexto para que Sylvie no use info stale en otra
 *    pantalla.
 */
export function LessonSurface({
  lesson,
  studentFirstName
}: {
  lesson: LessonContext;
  studentFirstName: string;
}) {
  const t = useTranslations('student.exercises');
  const setLessonContext = useTutorStore((s) => s.setLessonContext);
  const openWidget = useTutorStore((s) => s.openWidget);
  const recordInteraction = useTutorStore((s) => s.recordInteraction);

  useEffect(() => {
    setLessonContext(lesson, { firstName: studentFirstName });
    return () => {
      setLessonContext(null);
    };
  }, [lesson, studentFirstName, setLessonContext]);

  function askSylvie() {
    recordInteraction();
    openWidget('focus');
  }

  return (
    <div className="space-y-6">
      <ExerciseDemo slug={lesson.slug} />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={askSylvie}
          className="rounded-xl bg-midsea-coral px-5 py-3 text-sm font-semibold text-white shadow-wave hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-coral focus-visible:ring-offset-2"
        >
          {t('askSylvieBig')}
        </button>
      </div>
    </div>
  );
}
