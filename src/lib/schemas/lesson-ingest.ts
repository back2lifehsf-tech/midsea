/**
 * Zod schema canónico de una lección generada por el pipeline (ADR-006).
 *
 * Es la frontera entre la generación AI (GPT-4o output) y la ingesta a la
 * DB. Un JSON que no pasa este schema NO entra. Las 4 tipos de actividad
 * v1 son: multiple_choice, fill_in_blank, short_answer, step_by_step.
 *
 * Notas de diseño:
 * - `stepsEs/En` en step_by_step van YA en el orden correcto. El UI
 *   client-side las baraja (shuffle determinista por seed = lesson.id)
 *   y el servidor compara el array enviado por el estudiante contra el
 *   array canónico almacenado. No hace falta un campo `correctOrder`
 *   separado.
 * - Quiz usa SOLO 3 tipos (no step_by_step): multiple_choice,
 *   fill_in_blank, short_answer. step_by_step queda reservado para
 *   actividades intercaladas en el cuerpo, no para evaluación final.
 * - Campos bilingües siempre obligatorios (ES + EN). Per CLAUDE.md i18n.
 * - `reflectionEs/En` son opcionales: solo se llenan si el outline
 *   declara enfoque cristiano explícito (ver ADR-007).
 */
import { z } from 'zod';

const MultipleChoiceActivity = z.object({
  type: z.literal('multiple_choice'),
  promptEs: z.string().min(1),
  promptEn: z.string().min(1),
  optionsEs: z.array(z.string().min(1)).length(4),
  optionsEn: z.array(z.string().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanationEs: z.string().optional(),
  explanationEn: z.string().optional()
});

const FillInBlankActivity = z.object({
  type: z.literal('fill_in_blank'),
  promptEs: z.string().min(1),
  promptEn: z.string().min(1),
  acceptedAnswersEs: z.array(z.string().min(1)).min(1).max(6),
  acceptedAnswersEn: z.array(z.string().min(1)).min(1).max(6),
  explanationEs: z.string().optional(),
  explanationEn: z.string().optional()
});

const ShortAnswerActivity = z.object({
  type: z.literal('short_answer'),
  promptEs: z.string().min(1),
  promptEn: z.string().min(1),
  rubricKeywordsEs: z.array(z.string().min(1)).min(1).max(8),
  rubricKeywordsEn: z.array(z.string().min(1)).min(1).max(8),
  sampleAnswerEs: z.string().optional(),
  sampleAnswerEn: z.string().optional()
});

const StepByStepActivity = z.object({
  type: z.literal('step_by_step'),
  promptEs: z.string().min(1),
  promptEn: z.string().min(1),
  stepsEs: z.array(z.string().min(1)).min(2).max(8),
  stepsEn: z.array(z.string().min(1)).min(2).max(8),
  explanationEs: z.string().optional(),
  explanationEn: z.string().optional()
});

export const ActivitySchema = z.discriminatedUnion('type', [
  MultipleChoiceActivity,
  FillInBlankActivity,
  ShortAnswerActivity,
  StepByStepActivity
]);

export const QuizQuestionSchema = z.discriminatedUnion('type', [
  MultipleChoiceActivity,
  FillInBlankActivity,
  ShortAnswerActivity
]);

export const LessonIngestSchema = z.object({
  // Identidad — el slug es único y derivable del competencyCode.
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9-]+$/, 'slug debe ser kebab-case lowercase'),
  courseSlug: z.string().min(1),
  competencyCode: z
    .string()
    .regex(
      /^ARG-[A-Z_]+-G\d{2}(?:_\d{2})?-M\d{2}-T\d{2}-L\d{2}$/,
      'competencyCode formato esperado: ARG-<SUBJ>-G<NN>[_NN]-M<NN>-T<NN>-L<NN>'
    ),
  competencyDescriptionEs: z.string().min(1),
  competencyDescriptionEn: z.string().min(1),

  // Posición curricular.
  monthIndex: z.number().int().min(1).max(10),
  topicTitleEs: z.string().min(1),
  topicTitleEn: z.string().min(1),
  lessonOrderIndex: z.number().int().min(0),

  // Metadata bilingüe de la lección.
  titleEs: z.string().min(1).max(140),
  titleEn: z.string().min(1).max(140),
  summaryEs: z.string().min(20).max(400),
  summaryEn: z.string().min(20).max(400),
  estMinutes: z.number().int().min(3).max(20),

  // Cuerpo de la lección (markdown con KaTeX inline + placeholders de imagen).
  contentMarkdownEs: z.string().min(100),
  contentMarkdownEn: z.string().min(100),

  // Reflexión cristiana opcional (ADR-007). NO presente si el outline no
  // tiene enfoque cristiano declarado.
  reflectionEs: z.string().optional(),
  reflectionEn: z.string().optional(),

  // Actividades intercaladas (2-5) y quiz final (3-8 preguntas).
  activities: z.array(ActivitySchema).min(2).max(5),
  quiz: z.object({
    questions: z.array(QuizQuestionSchema).min(3).max(8)
  }),

  // Cierre conectado al mundo físico (siempre presente, derivado del outline).
  handsOnSuggestionEs: z.string().min(1),
  handsOnSuggestionEn: z.string().min(1),

  // Trazabilidad del pipeline.
  metadata: z.object({
    model: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: z.string().min(1),
    tokensUsed: z.number().int().nonnegative().optional(),
    reviewedAt: z.string().optional(),
    reviewedBy: z.string().optional()
  })
});

export type LessonIngest = z.infer<typeof LessonIngestSchema>;
export type Activity = z.infer<typeof ActivitySchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;
