/**
 * Quiz scoring — Epic 04 Tarea 5.
 *
 * Funciones puras que comparan respuestas del estudiante contra el
 * `correctAnswer` JSON almacenado en `QuizQuestion`. Usado tanto en el
 * client component Quiz (preview score antes de submit) como en el API
 * `/api/lessons/[slug]/quiz` (scoring autoritativo server-side).
 *
 * Estrategia v1:
 *  - `multiple_choice`: index match exacto.
 *  - `fill_in_blank`: normalize (NFD + lowercase + trim) compare a algun
 *    accepted answer (es o en).
 *  - `short_answer`: rubric keywords — al menos 1 match cuenta como
 *    correcta. No IA, no API call. Suficiente para v1; v1.1+ puede usar
 *    LLM judge.
 */

export type QuizCorrectAnswer =
  | { index: number }
  | { es: string[]; en: string[] }
  | { keywordsEs: string[]; keywordsEn: string[] };

export interface QuizQuestionShape {
  id: string;
  type: 'multiple_choice' | 'fill_in_blank' | 'short_answer';
  correctAnswer: QuizCorrectAnswer;
}

export type StudentAnswer = number | string;

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();
}

export function isQuestionCorrect(
  q: QuizQuestionShape,
  answer: StudentAnswer
): boolean {
  const ca = q.correctAnswer;
  if (q.type === 'multiple_choice' && typeof answer === 'number') {
    return 'index' in ca && answer === ca.index;
  }
  if (q.type === 'fill_in_blank' && typeof answer === 'string') {
    if (!('es' in ca)) return false;
    const norm = normalize(answer);
    return [...ca.es, ...ca.en].some((a) => normalize(a) === norm);
  }
  if (q.type === 'short_answer' && typeof answer === 'string') {
    if (!('keywordsEs' in ca)) return false;
    const norm = normalize(answer);
    const all = [...ca.keywordsEs, ...ca.keywordsEn];
    return all.some((k) => norm.includes(normalize(k)));
  }
  return false;
}

export interface QuizScoreResult {
  correct: number;
  total: number;
  masteryPct: number;
  perQuestion: Array<{ questionId: string; correct: boolean }>;
}

export function scoreQuiz(
  questions: QuizQuestionShape[],
  answers: Record<string, StudentAnswer>
): QuizScoreResult {
  const perQuestion = questions.map((q) => ({
    questionId: q.id,
    correct: isQuestionCorrect(q, answers[q.id])
  }));
  const correct = perQuestion.filter((r) => r.correct).length;
  const total = questions.length;
  const masteryPct = total === 0 ? 0 : Math.round((correct / total) * 100);
  return { correct, total, masteryPct, perQuestion };
}
