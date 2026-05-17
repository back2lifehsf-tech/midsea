/**
 * Motor de Nexos — PRD seccion 2.3 punto 2.
 * "Los puntos solo se ganan con mastery (80%+), no con tiempo." (PRD seccion 1.5 riesgo #2)
 *
 * Reglas duras (no derivables del codigo, vienen del PRD):
 * - 100 Nexos por leccion dominada (paridad con Miacademy gold).
 * - Mastery threshold = 80%. Por debajo, 0 Nexos.
 * - Bonus de racha: +10% por cada dia consecutivo, cap a +50%.
 * - Penalty por reintentos abusivos: -5 Nexos por intento despues del 3ro (no debajo de 0 reward).
 */

export const MASTERY_THRESHOLD = 80;
export const BASE_LESSON_REWARD = 100;
export const STREAK_BONUS_PCT_PER_DAY = 10;
export const STREAK_BONUS_CAP_PCT = 50;
export const FREE_ATTEMPTS = 3;
export const PENALTY_PER_EXTRA_ATTEMPT = 5;

export interface LessonOutcome {
  masteryPct: number;
  attempts: number;
  streakDays: number;
}

export interface NexosAward {
  granted: number;
  reasonCode:
    | 'BELOW_MASTERY'
    | 'BASE_PLUS_STREAK'
    | 'BASE_PLUS_STREAK_WITH_PENALTY';
  breakdown: {
    base: number;
    streakBonus: number;
    attemptPenalty: number;
  };
}

export function computeLessonReward(outcome: LessonOutcome): NexosAward {
  if (outcome.masteryPct < MASTERY_THRESHOLD) {
    return {
      granted: 0,
      reasonCode: 'BELOW_MASTERY',
      breakdown: { base: 0, streakBonus: 0, attemptPenalty: 0 }
    };
  }

  const cappedStreak = Math.min(
    outcome.streakDays * STREAK_BONUS_PCT_PER_DAY,
    STREAK_BONUS_CAP_PCT
  );
  const streakBonus = Math.round((BASE_LESSON_REWARD * cappedStreak) / 100);

  const extraAttempts = Math.max(0, outcome.attempts - FREE_ATTEMPTS);
  const rawPenalty = extraAttempts * PENALTY_PER_EXTRA_ATTEMPT;
  const maxPenalty = BASE_LESSON_REWARD + streakBonus;
  const attemptPenalty = Math.min(rawPenalty, maxPenalty);

  const granted = BASE_LESSON_REWARD + streakBonus - attemptPenalty;

  return {
    granted,
    reasonCode: attemptPenalty > 0 ? 'BASE_PLUS_STREAK_WITH_PENALTY' : 'BASE_PLUS_STREAK',
    breakdown: {
      base: BASE_LESSON_REWARD,
      streakBonus,
      attemptPenalty
    }
  };
}

export function isLessonMastered(masteryPct: number): boolean {
  return masteryPct >= MASTERY_THRESHOLD;
}
