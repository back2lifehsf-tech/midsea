#!/usr/bin/env node
/**
 * generate-exam.mjs — Genera exámenes para cursos de Midsea usando Claude.
 *
 * Uso:
 *   node scripts/generate-exam.mjs --course math-grade-9 --type MONTHLY --month 1
 *   node scripts/generate-exam.mjs --course math-grade-9 --type MIDTERM
 *   node scripts/generate-exam.mjs --course math-grade-9 --type FINAL
 *
 * Variables de entorno requeridas:
 *   ANTHROPIC_API_KEY
 *   DATABASE_URL
 */
import { parseArgs } from 'node:util';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// -- CLI args --
const { values: args } = parseArgs({
  options: {
    course: { type: 'string' },
    type: { type: 'string' },    // MONTHLY | MIDTERM | FINAL
    month: { type: 'string' },   // Solo para MONTHLY
    dryRun: { type: 'boolean', default: false }
  }
});

if (!args.course || !args.type) {
  console.error('Uso: node scripts/generate-exam.mjs --course <slug> --type MONTHLY|MIDTERM|FINAL [--month N]');
  process.exit(1);
}

const examType = args.type.toUpperCase();
if (!['MONTHLY', 'MIDTERM', 'FINAL'].includes(examType)) {
  console.error('--type debe ser MONTHLY, MIDTERM o FINAL');
  process.exit(1);
}

const monthIndex = examType === 'MONTHLY' ? Number(args.month) : undefined;
if (examType === 'MONTHLY' && (!monthIndex || isNaN(monthIndex))) {
  console.error('Para MONTHLY necesitás --month N (número del mes)');
  process.exit(1);
}

// -- Parámetros por tipo --
const EXAM_PARAMS = {
  MONTHLY: { questionCount: 15, timeLimitMin: 30, coinReward: 300, consolationCoin: 50, passingPct: 70 },
  MIDTERM: { questionCount: 30, timeLimitMin: 60, coinReward: 800, consolationCoin: 150, passingPct: 70 },
  FINAL:   { questionCount: 50, timeLimitMin: 90, coinReward: 2000, consolationCoin: 300, passingPct: 70 }
};
const params = EXAM_PARAMS[examType];

// -- Cargar el curso --
const course = await prisma.course.findUnique({
  where: { slug: args.course },
  select: { id: true, titleEs: true, titleEn: true, gradeBand: true }
});
if (!course) {
  console.error(`Curso no encontrado: ${args.course}`);
  process.exit(1);
}

// -- Cargar lecciones --
const lessonFilter = examType === 'MONTHLY'
  ? { courseId: course.id, monthIndex }
  : { courseId: course.id };

const lessons = await prisma.lesson.findMany({
  where: lessonFilter,
  orderBy: [{ monthIndex: 'asc' }, { orderIndex: 'asc' }],
  select: { titleEs: true, summaryEs: true, monthIndex: true }
});

if (lessons.length === 0) {
  console.error('No hay lecciones para este curso/mes');
  process.exit(1);
}

console.log(`Curso: ${course.titleEs} (${args.course})`);
console.log(`Tipo: ${examType}${monthIndex ? ` -- Mes ${monthIndex}` : ''}`);
console.log(`Lecciones base: ${lessons.length}`);

// -- Construir prompt --
const lessonSummaries = lessons.map((l, i) =>
  `${i + 1}. ${l.titleEs}${l.summaryEs ? `: ${l.summaryEs.slice(0, 150)}` : ''}`
).join('\n');

const gradeLabel = course.gradeBand === 'CICLO_BASICO' ? '9 degrees-10 degrees' :
                   course.gradeBand === 'CICLO_ORIENTADO' ? '11 degrees-12 degrees' : 'Secundario';

const midtermTitleEn = examType === 'MONTHLY' ? `Month ${monthIndex} Exam` :
                       examType === 'MIDTERM' ? 'Midterm Exam' : 'Final Exam';

const prompt = `Sos un profesor experto en educación secundaria hispanohablante (${gradeLabel}).
Tu tarea: crear un examen formal de tipo ${examType} para el curso "${course.titleEs}".

## Lecciones cubiertas:
${lessonSummaries}

## Parámetros:
- Tipo: ${examType} -> ${params.questionCount} preguntas
- Idioma principal: español LATAM neutro (es-419), también incluir versión en inglés
- Dificultad progresiva: 40% básicas, 40% intermedias, 20% avanzadas
- Incluir: comprensión, aplicación, análisis, síntesis
- NO copiar textualmente el texto de las lecciones
- Mezclar tipos: mayormente MULTIPLE_CHOICE (al menos 70%), algo de TRUE_FALSE, pocas SHORT_ANSWER

## Formato JSON de salida (SIN markdown, solo JSON puro):
{
  "titleEs": "Examen de Mes ${monthIndex ?? ''} -- ${course.titleEs}",
  "titleEn": "${midtermTitleEn} -- ${course.titleEn}",
  "instructionEs": "Tenés ${params.timeLimitMin} minutos para completar este examen. Respondé con calma y revisá tus respuestas antes de enviar.",
  "instructionEn": "You have ${params.timeLimitMin} minutes to complete this exam. Take your time and review your answers before submitting.",
  "questions": [
    {
      "orderIndex": 1,
      "type": "MULTIPLE_CHOICE",
      "stemEs": "¿Cuál es...?",
      "stemEn": "What is...?",
      "options": [
        { "id": "A", "textEs": "Opción A", "textEn": "Option A" },
        { "id": "B", "textEs": "Opción B", "textEn": "Option B" },
        { "id": "C", "textEs": "Opción C", "textEn": "Option C" },
        { "id": "D", "textEs": "Opción D", "textEn": "Option D" }
      ],
      "correctAnswer": "A",
      "explanationEs": "Porque...",
      "explanationEn": "Because...",
      "points": 1
    }
  ]
}
Para TRUE_FALSE: options null, correctAnswer "TRUE" o "FALSE".
Para SHORT_ANSWER: options null, correctAnswer texto exacto esperado.
Generá exactamente ${params.questionCount} preguntas.`;

console.log('\nGenerando examen con Claude...');

// -- Llamar a la API --
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const message = await client.messages.create({
  model: 'claude-opus-4-7',
  max_tokens: 16000,
  messages: [{ role: 'user', content: prompt }]
});

const rawContent = message.content[0].type === 'text' ? message.content[0].text : '';

// Extraer JSON
let jsonStr = rawContent;
const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
if (jsonMatch) jsonStr = jsonMatch[0];

// -- Validar con Zod --
const OptionSchema = z.object({
  id: z.string(),
  textEs: z.string(),
  textEn: z.string()
});

const QuestionSchema = z.object({
  orderIndex: z.number().int(),
  type: z.enum(['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER']),
  stemEs: z.string(),
  stemEn: z.string(),
  options: z.array(OptionSchema).nullable().optional(),
  correctAnswer: z.string(),
  explanationEs: z.string().nullable().optional(),
  explanationEn: z.string().nullable().optional(),
  points: z.number().int().default(1)
});

const ExamSchema = z.object({
  titleEs: z.string(),
  titleEn: z.string(),
  instructionEs: z.string(),
  instructionEn: z.string(),
  questions: z.array(QuestionSchema)
});

let examData;
try {
  examData = ExamSchema.parse(JSON.parse(jsonStr));
} catch (e) {
  console.error('Error validando JSON generado:', e);
  console.error('Raw output:', rawContent.slice(0, 500));
  process.exit(1);
}

console.log(`Generadas ${examData.questions.length} preguntas`);

if (args.dryRun) {
  console.log('\nDRY RUN -- no se guarda en DB');
  console.log(JSON.stringify(examData, null, 2).slice(0, 1000));
  process.exit(0);
}

// -- Upsert en Prisma --
const examRecord = await prisma.exam.upsert({
  where: {
    courseId_type_monthIndex: {
      courseId: course.id,
      type: examType,
      monthIndex: monthIndex ?? null
    }
  },
  create: {
    courseId: course.id,
    type: examType,
    monthIndex: monthIndex ?? null,
    titleEs: examData.titleEs,
    titleEn: examData.titleEn,
    instructionEs: examData.instructionEs,
    instructionEn: examData.instructionEn,
    timeLimitMin: params.timeLimitMin,
    passingPct: params.passingPct,
    coinReward: params.coinReward,
    consolationCoin: params.consolationCoin
  },
  update: {
    titleEs: examData.titleEs,
    titleEn: examData.titleEn,
    instructionEs: examData.instructionEs,
    instructionEn: examData.instructionEn
  }
});

// Borrar preguntas viejas y recrear
await prisma.examQuestion.deleteMany({ where: { examId: examRecord.id } });
await prisma.examQuestion.createMany({
  data: examData.questions.map((q) => ({
    examId: examRecord.id,
    orderIndex: q.orderIndex,
    type: q.type,
    stemEs: q.stemEs,
    stemEn: q.stemEn,
    options: q.options ?? null,
    correctAnswer: q.correctAnswer,
    explanationEs: q.explanationEs ?? null,
    explanationEn: q.explanationEn ?? null,
    points: q.points ?? 1
  }))
});

console.log(`\nExamen guardado: ${examRecord.id}`);
console.log(`   Tipo: ${examRecord.type} | Mes: ${examRecord.monthIndex ?? 'N/A'}`);
console.log(`   Preguntas: ${examData.questions.length}`);
console.log(`\nListo. Verificar en DB o abrir /student/courses/${args.course}/exam/${examRecord.id}`);

await prisma.$disconnect();
