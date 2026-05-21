import type { StudentSummary } from '../types';
import { buildAngelaSystemPromptEs } from './angela-es';
import { buildAngelaSystemPromptEn } from './angela-en';
import { buildAngelaSystemPromptHsEs } from './angela-hs-es';
import { buildAngelaSystemPromptHsEn } from './angela-hs-en';

/**
 * `CORE` = el prompt original de Epic 02 (cálida pero no infantil, K-6).
 * `HS`   = pilot HS Epic 02.5 (LATAM neutro, cristiano coherente,
 *          chain-of-thought visible STEM, push back, ADR-003 + ADR-007).
 */
export type AudienceTier = 'CORE' | 'HS';

/**
 * Selector de system prompt por locale + audienceTier.
 *
 * Default `HS` porque el pilot v1 actual es HS (ADR-003). Callers de
 * código existente que no pasan el argumento heredan el nuevo
 * comportamiento — esto es intencional para que la transición sea silent.
 * Tests legacy que quieran preservar el tono CORE deben pasar 'CORE'
 * explícito.
 */
export function buildAngelaSystemPrompt(
  locale: 'es' | 'en',
  student: StudentSummary,
  audienceTier: AudienceTier = 'HS'
): string {
  if (audienceTier === 'HS') {
    return locale === 'en'
      ? buildAngelaSystemPromptHsEn(student)
      : buildAngelaSystemPromptHsEs(student);
  }
  return locale === 'en'
    ? buildAngelaSystemPromptEn(student)
    : buildAngelaSystemPromptEs(student);
}

export {
  buildAngelaSystemPromptEs,
  buildAngelaSystemPromptEn,
  buildAngelaSystemPromptHsEs,
  buildAngelaSystemPromptHsEn
};
