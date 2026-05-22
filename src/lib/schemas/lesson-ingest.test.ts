/**
 * Tests del Zod schema de ingesta (ADR-006 §3).
 *
 * Verifica:
 *  - Una lección válida bilingüe completa pasa el schema.
 *  - Los 4 tipos de actividad son aceptados con sus shapes específicos.
 *  - Reglas de borde: titulos, min/max de arrays, regex de slug y de
 *    competencyCode, conteos del quiz.
 *  - El campo `reflectionEs/En` es opcional pero válido cuando presente.
 */
import { describe, expect, it } from 'vitest';
import { LessonIngestSchema } from './lesson-ingest';

function baseLesson() {
  return {
    slug: 'arg-math-g09-m01-t01-l01',
    courseSlug: 'math-grade-9',
    competencyCode: 'ARG-MATH-G09-M01-T01-L01',
    competencyDescriptionEs: 'Identifica y clasifica números reales.',
    competencyDescriptionEn: 'Identifies and classifies real numbers.',
    monthIndex: 1,
    topicTitleEs: 'Conjuntos y números reales',
    topicTitleEn: 'Sets and real numbers',
    lessonOrderIndex: 0,
    titleEs: 'Introducción a los conjuntos numéricos',
    titleEn: 'Introduction to numerical sets',
    summaryEs:
      'Aprenderás a distinguir entre números naturales, enteros, racionales e irracionales con ejemplos del mundo real.',
    summaryEn:
      'You will learn to distinguish between natural, integer, rational and irrational numbers with real-world examples.',
    estMinutes: 8,
    contentMarkdownEs:
      '## Introducción\n\nLos números reales se clasifican en varios subconjuntos. Empezaremos por los naturales y luego avanzaremos hacia los racionales e irracionales.',
    contentMarkdownEn:
      '## Introduction\n\nReal numbers are classified into several subsets. We will start with the naturals and then move to rationals and irrationals.',
    activities: [
      {
        type: 'multiple_choice',
        promptEs: '¿Cuál de los siguientes es un número irracional?',
        promptEn: 'Which of the following is an irrational number?',
        optionsEs: ['1/2', 'π', '0.75', '-3'],
        optionsEn: ['1/2', 'π', '0.75', '-3'],
        correctIndex: 1,
        explanationEs: 'π no puede expresarse como fracción.',
        explanationEn: 'π cannot be expressed as a fraction.'
      },
      {
        type: 'fill_in_blank',
        promptEs: 'El conjunto de los números naturales se denota con la letra ___.',
        promptEn: 'The set of natural numbers is denoted by the letter ___.',
        acceptedAnswersEs: ['N', 'ℕ'],
        acceptedAnswersEn: ['N', 'ℕ']
      }
    ],
    quiz: {
      questions: [
        {
          type: 'multiple_choice',
          promptEs: '¿Es 0 un número natural en la convención de este curso?',
          promptEn: 'Is 0 a natural number in this course\'s convention?',
          optionsEs: ['Sí', 'No', 'Depende', 'Solo en geometría'],
          optionsEn: ['Yes', 'No', 'It depends', 'Only in geometry'],
          correctIndex: 0
        },
        {
          type: 'short_answer',
          promptEs: 'Da un ejemplo de número irracional y explica brevemente por qué lo es.',
          promptEn: 'Give an example of an irrational number and briefly explain why.',
          rubricKeywordsEs: ['π', 'raíz', 'no fracción'],
          rubricKeywordsEn: ['π', 'root', 'not a fraction']
        },
        {
          type: 'fill_in_blank',
          promptEs: 'Los enteros se denotan con ___.',
          promptEn: 'Integers are denoted by ___.',
          acceptedAnswersEs: ['Z', 'ℤ'],
          acceptedAnswersEn: ['Z', 'ℤ']
        }
      ]
    },
    handsOnSuggestionEs:
      'Clasifica los números que veas en una factura del supermercado.',
    handsOnSuggestionEn:
      'Classify the numbers you see on a grocery receipt.',
    metadata: {
      model: 'gpt-4o',
      promptVersion: 'v1.0',
      generatedAt: '2026-05-22T12:00:00Z',
      tokensUsed: 3200
    }
  };
}

describe('LessonIngestSchema', () => {
  it('acepta una lección válida completa', () => {
    const result = LessonIngestSchema.safeParse(baseLesson());
    expect(result.success).toBe(true);
  });

  it('rechaza slug con caracteres inválidos', () => {
    const bad = { ...baseLesson(), slug: 'Arg_Math_G09' };
    expect(LessonIngestSchema.safeParse(bad).success).toBe(false);
  });

  it('rechaza competencyCode con formato inválido', () => {
    const bad = { ...baseLesson(), competencyCode: 'MATH-9-1' };
    expect(LessonIngestSchema.safeParse(bad).success).toBe(false);
  });

  it('acepta competencyCode con grado combinado (e.g. G09_10)', () => {
    const ok = {
      ...baseLesson(),
      competencyCode: 'ARG-HIS-G09_10-M04-T01-L01'
    };
    expect(LessonIngestSchema.safeParse(ok).success).toBe(true);
  });

  it('rechaza multiple_choice con menos de 4 opciones', () => {
    const bad = baseLesson();
    bad.activities[0].optionsEs = ['A', 'B', 'C'];
    expect(LessonIngestSchema.safeParse(bad).success).toBe(false);
  });

  it('rechaza quiz con step_by_step (solo activities permite ese tipo)', () => {
    const bad = baseLesson() as { quiz: { questions: unknown[] } };
    bad.quiz.questions.push({
      type: 'step_by_step',
      promptEs: 'Ordena los pasos',
      promptEn: 'Order the steps',
      stepsEs: ['Paso 1', 'Paso 2'],
      stepsEn: ['Step 1', 'Step 2']
    });
    expect(LessonIngestSchema.safeParse(bad).success).toBe(false);
  });

  it('acepta step_by_step en activities', () => {
    const ok = baseLesson() as { activities: unknown[] };
    ok.activities.push({
      type: 'step_by_step',
      promptEs: 'Ordena los pasos para resolver 2x+3=7',
      promptEn: 'Order the steps to solve 2x+3=7',
      stepsEs: ['Restar 3', 'Dividir entre 2', 'Resultado: x=2'],
      stepsEn: ['Subtract 3', 'Divide by 2', 'Result: x=2']
    });
    expect(LessonIngestSchema.safeParse(ok).success).toBe(true);
  });

  it('acepta reflectionEs/En cuando están presentes', () => {
    const ok = {
      ...baseLesson(),
      reflectionEs: 'El orden de los números refleja un universo ordenado.',
      reflectionEn: 'The order of numbers reflects an ordered universe.'
    };
    expect(LessonIngestSchema.safeParse(ok).success).toBe(true);
  });

  it('rechaza quiz con menos de 3 preguntas', () => {
    const bad = baseLesson();
    bad.quiz.questions = bad.quiz.questions.slice(0, 2);
    expect(LessonIngestSchema.safeParse(bad).success).toBe(false);
  });
});
