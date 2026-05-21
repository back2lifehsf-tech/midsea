/**
 * Heurística para escalar al modelo de reasoning (`gpt-4o` por default)
 * cuando el mensaje del estudiante huele a STEM. Epic 02.5 §1 + §5.
 *
 * Diseño:
 *  - Si detectamos keywords STEM (matemática, física, química, biología,
 *    lógica) O patrones de operación matemática literal, devolvemos
 *    `reasoning`. Caso contrario, `mini`.
 *  - Mini (gpt-4o-mini) es ~10x más barato. Solo escalamos cuando se
 *    justifica — no para chat conversacional ni humanidades.
 *  - Sin function calling todavía; la decisión es por mensaje individual
 *    (no por sesión). El próximo turno puede bajar a mini si la conver-
 *    sación gira a humanidades.
 *
 * Variables de entorno:
 *  - `OPENAI_MODEL`           default `gpt-4o-mini`  (mini)
 *  - `OPENAI_MODEL_REASONING` default `gpt-4o`       (reasoning)
 *
 * El módulo es importable desde server-only paths (route handler) y
 * desde tests (puro, sin side effects).
 */

export type ModelKind = 'mini' | 'reasoning';

const STEM_KEYWORDS_ES = [
  // matemática
  'demuestra', 'demuéstrame', 'demuestre',
  'resolvé', 'resuelve', 'resuelva', 'resolver',
  'calculá', 'calcula', 'calcule', 'calcular',
  'ecuación', 'ecuaciones', 'inecuación',
  'fórmula', 'fórmulas',
  'derivada', 'derivar', 'integral', 'integrar',
  'función', 'funciones', 'gráfica', 'gráfico',
  'sistema de ecuaciones', 'matriz', 'matrices',
  'logaritmo', 'logaritmos', 'exponencial',
  'trigonometría', 'sin(', 'cos(', 'tan(',
  'paso a paso', 'paso por paso',
  // ciencias
  'fotosíntesis', 'átomo', 'átomos', 'molécula', 'moléculas',
  'mitosis', 'meiosis', 'célula', 'células',
  'newton', 'kepler', 'fuerza', 'aceleración',
  'reacción química', 'balanceo', 'estequiometría',
  'genética', 'adn', 'cromosoma'
];

const STEM_KEYWORDS_EN = [
  'solve', 'compute', 'calculate', 'derive', 'integrate',
  'equation', 'equations', 'inequality',
  'formula', 'formulas',
  'derivative', 'integral', 'limit ',
  'function', 'functions', 'graph',
  'system of equations', 'matrix', 'matrices',
  'logarithm', 'logarithms', 'exponential',
  'trigonometry', 'sin(', 'cos(', 'tan(',
  'step by step', 'step-by-step',
  'photosynthesis', 'atom', 'atoms', 'molecule', 'molecules',
  'mitosis', 'meiosis', 'cell ', 'cells',
  'newton', 'kepler', 'force', 'acceleration',
  'chemical reaction', 'balance', 'stoichiometry',
  'genetics', 'dna', 'chromosome'
];

// Patrón de operación matemática literal en el mensaje.
// Ejemplos que matchean: "2x+5=11", "(3+4)*2", "x^2-1", "x = 5"
const MATH_OP_PATTERN =
  /(\d+\s*[+\-*/=^]\s*\d+|[a-z]\s*[\+\-\*\/=\^]\s*\d+|\d+\s*[\+\-\*\/=\^]\s*[a-z]|x\^?\d|\^2|\bsqrt|\\frac|\\int|∫|∂|√)/i;

export function pickModel(text: string): ModelKind {
  if (!text) return 'mini';
  const lower = text.toLowerCase();
  const stemHit =
    STEM_KEYWORDS_ES.some((k) => lower.includes(k)) ||
    STEM_KEYWORDS_EN.some((k) => lower.includes(k));
  const mathHit = MATH_OP_PATTERN.test(text);
  return stemHit || mathHit ? 'reasoning' : 'mini';
}

export function resolveModelName(kind: ModelKind): string {
  if (kind === 'reasoning') {
    return process.env.OPENAI_MODEL_REASONING ?? 'gpt-4o';
  }
  return process.env.OPENAI_MODEL ?? 'gpt-4o-mini';
}

/** Conveniencia: heurística + resolución de env en una sola llamada. */
export function pickModelForMessage(text: string): {
  kind: ModelKind;
  name: string;
} {
  const kind = pickModel(text);
  return { kind, name: resolveModelName(kind) };
}
