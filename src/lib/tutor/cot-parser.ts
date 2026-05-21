/**
 * Parser cliente de Chain-of-Thought. Epic 02.5 §5.
 *
 * Detecta headers tipo `### Paso N` o `### Step N` en el texto del
 * mensaje y separa cada paso para que la UI lo renderice como tarjetas
 * secuenciales con visual sectioning.
 *
 * Sin animaciones entre pasos en v1 (sería ideal transicionar avatar
 * thinking → speaking entre pasos, pero requeriría parseo durante el
 * stream y orchestration de estado; punteado a Pendiente Epic 04).
 *
 * Diseño:
 *  - Reconoce `### Paso N` (ES) y `### Step N` (EN), donde N puede ser
 *    arábigo (1, 2, 3) o romano (I, II, III).
 *  - Caso negativo (sin headers): devuelve `hasSteps: false` con todo
 *    el texto en `preamble`. UI usa el render plano normal.
 *  - El "outro" (texto después del último step) queda absorbido en el
 *    body del último step. Suficientemente bueno para v1.
 */

export interface CotStep {
  /** Header text como lo escribió el LLM, sin `###`. E.g. "Paso 1", "Step 2". */
  label: string;
  /** Cuerpo del paso. Trimmed. Puede ser multilínea. */
  body: string;
}

export interface CotParsedMessage {
  /** Texto antes del primer header. Trimmed. Puede ser ''. */
  preamble: string;
  /** Pasos en orden. Vacío si no se detectaron headers. */
  steps: CotStep[];
  /** true si se detectó al menos un paso. */
  hasSteps: boolean;
}

const STEP_HEADER_RE = /^###\s+(?:Paso|Step)\s+/i;

export function parseChainOfThought(text: string): CotParsedMessage {
  const lines = text.split('\n');
  const preambleLines: string[] = [];
  const steps: { label: string; bodyLines: string[] }[] = [];
  let mode: 'preamble' | 'step' = 'preamble';
  let currentLabel = '';
  let currentBody: string[] = [];

  for (const line of lines) {
    if (STEP_HEADER_RE.test(line)) {
      // Cierra el step anterior si estábamos en uno.
      if (mode === 'step') {
        steps.push({ label: currentLabel, bodyLines: currentBody });
      }
      mode = 'step';
      currentLabel = line.replace(/^###\s+/, '').trim();
      currentBody = [];
      continue;
    }
    if (mode === 'preamble') {
      preambleLines.push(line);
    } else {
      currentBody.push(line);
    }
  }
  if (mode === 'step') {
    steps.push({ label: currentLabel, bodyLines: currentBody });
  }

  return {
    preamble: preambleLines.join('\n').trim(),
    steps: steps.map((s) => ({
      label: s.label,
      body: s.bodyLines.join('\n').trim()
    })),
    hasSteps: steps.length > 0
  };
}
