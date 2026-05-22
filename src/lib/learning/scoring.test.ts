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
});
