// Motor de intervencion proactiva — locale-agnostic. Devuelve translation
// keys + params, la UI resuelve con next-intl.
//
// Reglas (de AI_TUTOR_SPEC.md seccion 3.1 y CLAUDE.md):
//  - consecutiveErrors >= 2 sin interaccion reciente → ofrecer pista
//  - timeSpent > 2x estimado en el ejercicio → preguntar si necesita ayuda
//
// Reglas a futuro (cuando exista mas tracking):
//  - idle 15s en pantalla de ejercicio → sugerir continuar
//  - 5 ejercicios correctos seguidos → celebrar

import type { SessionSnapshot } from './LessonContext';

export interface InterventionInput {
  session: SessionSnapshot;
  lessonEstMinutes: number;
  // Para evitar spam: si el estudiante interactuo en los ultimos N ms (envio
  // mensaje, abrio el widget), no interrumpas.
  studentInteractedWithinMs: number;
}

export interface InterventionResult {
  ruleId: 'consecutive-errors' | 'time-exceeded';
  messageKey: string; // referencia al namespace student.angela.proactive
  messageParams?: Record<string, string | number>;
  // Estado al que Angela deberia transicionar al disparar esta intervencion.
  angelaState: 'suggesting';
}

// Cooldown: una vez que disparamos una rule, no la volvemos a disparar hasta
// que el estudiante reset (acierto correcto resetea consecutiveErrors, lo que
// naturalmente apaga la regla).
const TIME_EXCEEDED_THRESHOLD_MS = 2 * 60 * 1000; // 2 min absolutos antes de
// que la rule se evalue (evita disparar al primer segundo de cargar la
// pantalla).

export function evaluateProactive(input: InterventionInput): InterventionResult | null {
  const { session, lessonEstMinutes, studentInteractedWithinMs } = input;

  // No interrumpas si el estudiante interactuo recientemente.
  if (studentInteractedWithinMs < 30_000) return null;

  // Rule: consecutiveErrors >= 2
  if (session.consecutiveErrors >= 2) {
    return {
      ruleId: 'consecutive-errors',
      messageKey: 'errors',
      messageParams: { count: session.consecutiveErrors },
      angelaState: 'suggesting'
    };
  }

  // Rule: time exceeded. Estimado por ejercicio = estimMinutes/totalExercises.
  if (session.totalExercises > 0 && lessonEstMinutes > 0) {
    const expectedPerExerciseMs = (lessonEstMinutes * 60 * 1000) / session.totalExercises;
    const threshold = Math.max(
      TIME_EXCEEDED_THRESHOLD_MS,
      expectedPerExerciseMs * 2
    );
    if (session.msSinceLastExercise > threshold) {
      return {
        ruleId: 'time-exceeded',
        messageKey: 'timeExceeded',
        angelaState: 'suggesting'
      };
    }
  }

  return null;
}
