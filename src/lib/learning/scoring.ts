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

/**
 * Stemming heuristico ES/EN para keyword matching del quiz short_answer.
 *
 * Problema (detectado en smoke test 2026-05-22): el prompt v1.1 produce
 * keywords con forma morfologica especifica (ej. `fracciones` plural,
 * `enteros` plural). El estudiante escribe `fracción` (singular) o
 * `entero` (singular) y el `includes` exacto falla aunque la respuesta
 * sea conceptualmente correcta.
 *
 * Solucion v1: token-level prefix match. Truncamos cada keyword a sus
 * primeros 5 caracteres (suficiente para discriminar conceptos en
 * espanol — `fracc` matchea fracción/fracciones/fraccional, `enter`
 * matchea entero/enteros sin matchear "enterprise" en EN).
 *
 * Multi-word keywords (e.g. "no repetitivo"): primero intentamos exact
 * phrase match (caso del estudiante que reproduce literal). Si no, cada
 * palabra del keyword debe matchear como prefijo de algun token del
 * answer. Permite "no se repite" vs "no repetitivo".
 *
 * Esto es heuristica simple, no stemmer real (no se importa Snowball ni
 * `natural`). Sufficient for pilot. v1.1+ podemos formalizar.
 */
const STEM_LEN = 5;

function stem(word: string): string {
  if (word.length <= 4) return word;
  return word.slice(0, STEM_LEN);
}

function tokenize(text: string): string[] {
  return text.split(/[\s.,;:!?¿¡()\[\]{}"'/-]+/).filter(Boolean);
}

export function keywordMatches(answer: string, keyword: string): boolean {
  const normAnswer = normalize(answer);
  const normKeyword = normalize(keyword);
  if (!normAnswer || !normKeyword) return false;

  // Exact phrase substring match (caso facil — student reproduce literal).
  if (normAnswer.includes(normKeyword)) return true;

  // Tokenize answer una vez para reusar.
  const answerTokens = tokenize(normAnswer);
  if (answerTokens.length === 0) return false;

  const keywordWords = normKeyword.split(/\s+/).filter(Boolean);
  if (keywordWords.length === 0) return false;

  // Cada palabra del keyword debe matchear como prefijo de algun token
  // del answer (en cualquier orden — el estudiante puede parafrasear).
  return keywordWords.every((kw) => {
    const s = stem(kw);
    return answerTokens.some((t) => t.startsWith(s));
  });
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
    const all = [...ca.keywordsEs, ...ca.keywordsEn];
    return all.some((k) => keywordMatches(answer, k));
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
