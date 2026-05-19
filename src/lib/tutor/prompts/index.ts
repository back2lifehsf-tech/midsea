import type { StudentSummary } from '../types';
import { buildAngelaSystemPromptEs } from './angela-es';
import { buildAngelaSystemPromptEn } from './angela-en';

/**
 * Selector de system prompt por locale. v1: no hay code-switching dentro
 * de una respuesta — el modelo responde íntegramente en el idioma del
 * locale de la sesión (Epic 02 §1 OUT). v2 puede agregar `auto` que
 * detecte el idioma del último mensaje del estudiante.
 */
export function buildAngelaSystemPrompt(
  locale: 'es' | 'en',
  student: StudentSummary
): string {
  return locale === 'en'
    ? buildAngelaSystemPromptEn(student)
    : buildAngelaSystemPromptEs(student);
}

export { buildAngelaSystemPromptEs, buildAngelaSystemPromptEn };
