import type { StudentSummary } from '../types';
import { buildSylvieSystemPromptEs } from './sylvie-es';
import { buildSylvieSystemPromptEn } from './sylvie-en';

/**
 * Selector de system prompt por locale. v1: no hay code-switching dentro
 * de una respuesta — el modelo responde íntegramente en el idioma del
 * locale de la sesión (Epic 02 §1 OUT). v2 puede agregar `auto` que
 * detecte el idioma del último mensaje del estudiante.
 */
export function buildSylvieSystemPrompt(
  locale: 'es' | 'en',
  student: StudentSummary
): string {
  return locale === 'en'
    ? buildSylvieSystemPromptEn(student)
    : buildSylvieSystemPromptEs(student);
}

export { buildSylvieSystemPromptEs, buildSylvieSystemPromptEn };
