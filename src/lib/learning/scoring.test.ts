/**
 * Tests del scoring de quiz. Cubre los 3 tipos de pregunta v1.
 */
import { describe, expect, it } from 'vitest';
import { isQuestionCorrect, scoreQuiz } from './scoring';

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
