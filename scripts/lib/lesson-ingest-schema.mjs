/**
 * Mirror runtime del schema TypeScript en
 *   src/lib/schemas/lesson-ingest.ts
 *
 * Existe porque los scripts CLI (generate-lesson, ingest-lesson, etc.) son
 * .mjs puros y no hay build step para scripts. La fuente de verdad es la
 * versión .ts (usada por código de la app + tests). Si modificas una,
 * modifica la otra en el mismo PR.
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
  // Permitimos `_` además de `-` y alfanuméricos porque los cursos del
  // catálogo con grado combinado (e.g. `G09_10` en history/language/
  // science-biology) producen slugs tipo `arg-his-g09_10-m04-t01-l01`.
  slug: z
    .string()
    .min(3)
    .regex(/^[a-z0-9_-]+$/, 'slug debe ser kebab-case lowercase'),
  courseSlug: z.string().min(1),
  competencyCode: z
    .string()
    .regex(
      /^ARG-[A-Z_]+-G\d{2}(?:_\d{2})?-M\d{2}-T\d{2}-L\d{2}$/,
      'competencyCode formato: ARG-<SUBJ>-G<NN>[_NN]-M<NN>-T<NN>-L<NN>'
    ),
  competencyDescriptionEs: z.string().min(1),
  competencyDescriptionEn: z.string().min(1),
  monthIndex: z.number().int().min(1).max(10),
  topicTitleEs: z.string().min(1),
  topicTitleEn: z.string().min(1),
  lessonOrderIndex: z.number().int().min(0),
  titleEs: z.string().min(1).max(140),
  titleEn: z.string().min(1).max(140),
  summaryEs: z.string().min(20).max(400),
  summaryEn: z.string().min(20).max(400),
  estMinutes: z.number().int().min(3).max(35),
  contentMarkdownEs: z.string().min(100),
  contentMarkdownEn: z.string().min(100),
  reflectionEs: z.string().optional(),
  reflectionEn: z.string().optional(),
  hookEs: z.string().max(300).optional(),
  hookEn: z.string().max(300).optional(),
  videoUrl: z.string().url().optional(),
  videoDuration: z.number().int().min(60).max(900).optional(),
  activities: z.array(ActivitySchema).min(2).max(5),
  quiz: z.object({
    questions: z.array(QuizQuestionSchema).length(5)
  }),
  handsOnSuggestionEs: z.string().min(1),
  handsOnSuggestionEn: z.string().min(1),
  metadata: z.object({
    model: z.string().min(1),
    promptVersion: z.string().min(1),
    generatedAt: z.string().min(1),
    tokensUsed: z.number().int().nonnegative().optional(),
    reviewedAt: z.string().optional(),
    reviewedBy: z.string().optional()
  })
});
