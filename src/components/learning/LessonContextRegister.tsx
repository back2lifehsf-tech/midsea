'use client';
/**
 * Registra el LessonContext en el store del tutor (Angela) al mount.
 * Limpia al unmount. Es el lado client minimo del lesson player real —
 * cuando la pagina del slug se carga, Angela ya "sabe" donde esta el
 * estudiante y puede dar ayuda contextual en /stuck o en el widget.
 *
 * Antes este side-effect vivia dentro de LessonSurface (componente
 * client con mock ExerciseDemo). Lo separamos para que la pagina real
 * pueda usar el registro de contexto sin arrastrar el demo.
 */
import { useEffect } from 'react';
import { useTutorStore } from '@/lib/tutor/angela-state';
import type { LessonContext } from '@/lib/tutor/LessonContext';

export function LessonContextRegister({
  lesson,
  studentFirstName
}: {
  lesson: LessonContext;
  studentFirstName: string;
}) {
  const setLessonContext = useTutorStore((s) => s.setLessonContext);
  useEffect(() => {
    setLessonContext(lesson, { firstName: studentFirstName });
    return () => {
      setLessonContext(null);
    };
  }, [lesson, studentFirstName, setLessonContext]);
  return null;
}
