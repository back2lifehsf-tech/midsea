// Tipos del contexto que Angela necesita para responder con sentido.
// AI_TUTOR_SPEC seccion 4.3: Curriculum Context Engine.
//
// v1: alimentado por el lesson detail page (server-component) que pasa los
// campos al store via un client component "loader". No tocamos Prisma, asi
// que estos datos vienen de Lesson + LessonProgress ya cargados server-side.

import type { Locale } from '@/i18n';

export interface LessonContext {
  lessonId: string;
  slug: string;
  titleEs: string;
  titleEn: string;
  subject: string; // Enum Subject como string (MATH, LANGUAGE_ARTS, ...)
  gradeLevel: number;
  estMinutes: number;
}

export interface StudentBrief {
  firstName: string;
  gradeLevel: number;
  preferredLocale: Locale;
}

// Snapshot del contexto de la sesion actual — derivado del store en cualquier
// momento para construir el system prompt o evaluar reglas de intervencion.
export interface SessionSnapshot {
  currentExercise: number; // 1-based index
  totalExercises: number;
  consecutiveErrors: number;
  totalErrors: number;
  totalCorrect: number;
  sessionStartedAt: number; // ms epoch
  lastExerciseStartedAt: number; // ms epoch
  studentInteractedRecently: boolean;
  // ms desde el ultimo intento (calculado on-demand)
  msSinceLastExercise: number;
}

export function lessonTitleForLocale(lesson: LessonContext, locale: Locale): string {
  return locale === 'en' ? lesson.titleEn : lesson.titleEs;
}
