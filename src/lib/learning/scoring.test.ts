/**
 * Tests del scoring de quiz. Cubre los 3 tipos de pregunta v1.
 */
import { describe, expect, it } from 'vitest';
import { isQuestionCorrect, keywordMatches, scoreQuiz } from './scoring';

const MC = {
  id: 'q1',
  type: 'multiple_choice' as const,
  correctAnswer: { index: 2 }
};
const FILL = {
  id: 'q2',
  type: 'fill_in_blank' as const,
  correctAnswer: { es: ['racional'], en: ['rational'] }
};
const SHORT = {
  id: 'q3',
  type: 'short_answer' as const,
  correctAnswer: {
    keywordsEs: ['colección', 'objetos'],
    keywordsEn: ['collection', 'objects']
  }
};

describe('isQuestionCorrect', () => {
  it('multiple_choice: index correcto', () => {
    expect(isQuestionCorrect(MC, 2)).toBe(true);
  });

  it('multiple_choice: index incorrecto', () => {
    expect(isQuestionCorrect(MC, 1)).toBe(false);
  });

  it('fill_in_blank: match ES insensible a tildes y caps', () => {
    expect(isQuestionCorrect(FILL, 'Racional')).toBe(true);
    expect(isQuestionCorrect(FILL, 'racionál')).toBe(true);
    expect(isQuestionCorrect(FILL, '  racional  ')).toBe(true);
  });

  it('fill_in_blank: match EN tambien aceptado', () => {
    expect(isQuestionCorrect(FILL, 'rational')).toBe(true);
  });

  it('fill_in_blank: no match', () => {
    expect(isQuestionCorrect(FILL, 'irracional')).toBe(false);
  });

  it('short_answer: 1 keyword match es suficiente', () => {
    expect(isQuestionCorrect(SHORT, 'una colección de cosas')).toBe(true);
  });

  it('short_answer: zero keywords = false', () => {
    expect(isQuestionCorrect(SHORT, 'algo random sin contenido')).toBe(false);
  });
});

describe('scoreQuiz', () => {
  it('todas correctas → 100%', () => {
    const result = scoreQuiz(
      [MC, FILL, SHORT],
      { q1: 2, q2: 'racional', q3: 'colección de objetos bien definida' }
    );
    expect(result.correct).toBe(3);
    expect(result.total).toBe(3);
    expect(result.masteryPct).toBe(100);
  });

  it('2 de 3 → 67%', () => {
    const result = scoreQuiz(
      [MC, FILL, SHORT],
      { q1: 2, q2: 'rational', q3: 'random' }
    );
    expect(result.correct).toBe(2);
    expect(result.masteryPct).toBe(67);
  });

  it('quiz vacio → 0%', () => {
    const result = scoreQuiz([], {});
    expect(result.masteryPct).toBe(0);
    expect(result.total).toBe(0);
  });

  it('rounding del masteryPct (4/5 = 80%, no 80.0%)', () => {
    const Qs = Array.from({ length: 5 }, (_, i) => ({
      id: `q${i}`,
      type: 'multiple_choice' as const,
      correctAnswer: { index: 0 }
    }));
    const result = scoreQuiz(Qs, { q0: 0, q1: 0, q2: 0, q3: 0, q4: 1 });
    expect(result.masteryPct).toBe(80);
  });

  it('mastery threshold de 80% se respeta exactamente (3/4 = 75 < 80)', () => {
    const Qs = Array.from({ length: 4 }, (_, i) => ({
      id: `q${i}`,
      type: 'multiple_choice' as const,
      correctAnswer: { index: 0 }
    }));
    const result = scoreQuiz(Qs, { q0: 0, q1: 0, q2: 0, q3: 1 });
    expect(result.masteryPct).toBe(75);
    expect(result.masteryPct).toBeLessThan(80);
  });

  it('respuesta faltante (questionId sin answer) cuenta como incorrecta', () => {
    const Qs = [
      { id: 'q1', type: 'multiple_choice' as const, correctAnswer: { index: 0 } },
      { id: 'q2', type: 'multiple_choice' as const, correctAnswer: { index: 0 } }
    ];
    const result = scoreQuiz(Qs, { q1: 0 });
    expect(result.correct).toBe(1);
    expect(result.total).toBe(2);
  });
});

describe('isQuestionCorrect — edge cases adicionales', () => {
  it('multiple_choice rechaza string en lugar de number', () => {
    const MC = {
      id: 'q1',
      type: 'multiple_choice' as const,
      correctAnswer: { index: 0 }
    };
    // El cliente puede mandar string por accidente; debe ser false.
    expect(isQuestionCorrect(MC, '0')).toBe(false);
  });

  it('fill_in_blank con cadena vacia → false', () => {
    const FILL = {
      id: 'q1',
      type: 'fill_in_blank' as const,
      correctAnswer: { es: ['racional'], en: ['rational'] }
    };
    expect(isQuestionCorrect(FILL, '')).toBe(false);
  });

  it('short_answer con multiples keywords pero solo 1 match → true', () => {
    const SHORT = {
      id: 'q1',
      type: 'short_answer' as const,
      correctAnswer: {
        keywordsEs: ['ecuación', 'incógnita', 'igualdad'],
        keywordsEn: ['equation', 'unknown', 'equality']
      }
    };
    // "ecuación" matchea, otras dos no — pero >=1 cuenta.
    expect(
      isQuestionCorrect(SHORT, 'es una ecuación matemática')
    ).toBe(true);
  });

  it('short_answer es case + acento insensible', () => {
    const SHORT = {
      id: 'q1',
      type: 'short_answer' as const,
      correctAnswer: {
        keywordsEs: ['ecuación'],
        keywordsEn: ['equation']
      }
    };
    expect(isQuestionCorrect(SHORT, 'Una ECUACION resuelta')).toBe(true);
    expect(isQuestionCorrect(SHORT, 'una ECUACIÓN resuelta')).toBe(true);
  });
});

describe('keywordMatches — stemming heurístico', () => {
  it('keyword plural matchea answer singular (fracciones vs fracción)', () => {
    expect(keywordMatches('el cociente entre dos enteros es una fracción', 'fracciones')).toBe(true);
  });

  it('keyword singular matchea answer plural', () => {
    expect(keywordMatches('los racionales son fracciones de enteros', 'fracción')).toBe(true);
  });

  it('exact phrase match funciona (multi-word)', () => {
    expect(
      keywordMatches('el decimal es no repetitivo y no finito', 'no repetitivo')
    ).toBe(true);
  });

  it('multi-word con paráfrasis verbal NO matchea (limitación conocida v1)', () => {
    // El heurístico de 5-char no captura morfología verbal compleja:
    // `repetitivo` → stem `repet`, pero `repiten` (conjugación) empieza
    // con `repit` y no matchea. Requiere stemmer Snowball real (v1.1).
    // Por ahora, el estudiante que quiere mastery debe usar el termino
    // del prompt: "repetitivo" o sinónimos más cercanos a la raíz.
    expect(
      keywordMatches('es no periódico — los decimales no se repiten', 'no repetitivo')
    ).toBe(false);
  });

  it('multi-word con orden distinto en answer matchea (paráfrasis simple)', () => {
    // Caso que SI matchea: el estudiante invierte orden pero usa las
    // mismas raíces que el keyword.
    expect(
      keywordMatches(
        'son los decimales que son no repetitivos',
        'no repetitivo'
      )
    ).toBe(true);
  });

  it('caso real del smoke test 2026-05-22: "fracción de enteros"', () => {
    // Keyword del quiz: "fracciones", "enteros", "no repetitivo".
    // Respuesta del estudiante con singular debe matchear.
    expect(keywordMatches('un racional es una fracción de enteros', 'fracciones')).toBe(true);
    expect(keywordMatches('un racional es una fracción de entero', 'enteros')).toBe(true);
  });

  it('no false positive — palabras no relacionadas no matchean', () => {
    expect(keywordMatches('la ecuación tiene dos lados', 'fracciones')).toBe(false);
    expect(keywordMatches('habla del clima de hoy', 'racional')).toBe(false);
  });

  it('keyword corto (≤4 chars) no se trunca, requiere match como prefijo', () => {
    expect(keywordMatches('el numero pi es irracional', 'pi')).toBe(true);
    expect(keywordMatches('no es repetitivo', 'no')).toBe(true);
  });

  it('answer vacio o keyword vacio → false', () => {
    expect(keywordMatches('', 'fracciones')).toBe(false);
    expect(keywordMatches('algo', '')).toBe(false);
  });

  it('normaliza tildes y mayúsculas', () => {
    expect(keywordMatches('Las FRACCIONES son útiles', 'fracción')).toBe(true);
  });
});
