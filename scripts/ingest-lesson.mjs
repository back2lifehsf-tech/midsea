#!/usr/bin/env node
/**
 * Ingesta de UN JSON curated a la DB (ADR-006 §5).
 *
 * Uso:
 *   node scripts/ingest-lesson.mjs <path-curated.json>
 *        [--target=dev|prod] [--url=postgresql://...]
 *
 * Operaciones (idempotente — re-correr es safe):
 *   1. Valida con LessonIngestSchema (Zod).
 *   2. Encuentra Course por slug (debe existir, seeded en Tarea 1).
 *   3. Upsert Competency por (courseId, code).
 *   4. Upsert Lesson por slug — setea courseId, monthIndex, bodyMd,
 *      activities (JSON), reflection*, title, subject (legacy enum),
 *      gradeLevel (Int), estMinutes.
 *   5. Upsert LessonCompetency (lessonId, competencyId, weight=100).
 *   6. Borra QuizQuestion existentes de esta lesson + reinserta.
 *
 * El mapeo SubjectArea (catálogo) → Subject (enum legacy de Lesson) y
 * gradeCode → gradeLevel Int están hardcoded — el schema legacy de
 * Lesson sigue requiriendo estos campos. Hasta que removamos esos
 * campos (post-pilot), esta función los rellena por compat.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { loadEnv } from './lib/env.mjs';
import { LessonIngestSchema } from './lib/lesson-ingest-schema.mjs';

// SubjectArea (catálogo nuevo) → Subject (enum legacy de Lesson).
// Necesario hasta que el schema deprecate Lesson.subject (Epic 06+).
const SUBJECT_AREA_TO_LEGACY = Object.freeze({
  MATH: 'MATH',
  LANGUAGE: 'LANGUAGE_ARTS',
  ENGLISH_ESL: 'FOREIGN_LANGUAGE',
  HISTORY: 'SOCIAL_STUDIES',
  SCIENCE: 'SCIENCE',
  MUSIC: 'ELECTIVE',
  ELECTIVE_OTHER: 'ELECTIVE'
});

function parseArgs() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith('--'));
  const get = (flag) => {
    const eq = argv.find((a) => a.startsWith(flag + '='));
    return eq ? eq.split('=')[1] : null;
  };
  return { file, target: get('--target'), url: get('--url') };
}

function resolveDbUrl({ target, url }, env) {
  if (url) return url;
  if (target === 'prod') {
    if (!env.DATABASE_URL_PROD) {
      throw new Error('--target=prod requires DATABASE_URL_PROD env var');
    }
    return env.DATABASE_URL_PROD;
  }
  // default: dev
  if (!env.DATABASE_URL) {
    throw new Error('DATABASE_URL not in env (.env.local o shell)');
  }
  return env.DATABASE_URL;
}

function gradeLevelFromCode(gradeCode) {
  // 'G09' → 9, 'G10' → 10, 'G09_10' → 9 (toma el menor).
  const m = gradeCode.match(/^G(\d{2})/);
  if (!m) throw new Error(`gradeCode inválido: ${gradeCode}`);
  return parseInt(m[1], 10);
}

function buildQuizPayload(q) {
  if (q.type === 'multiple_choice') {
    return {
      type: q.type,
      promptEs: q.promptEs,
      promptEn: q.promptEn,
      options: { es: q.optionsEs, en: q.optionsEn },
      correctAnswer: { index: q.correctIndex },
      explanationEs: q.explanationEs ?? null,
      explanationEn: q.explanationEn ?? null
    };
  }
  if (q.type === 'fill_in_blank') {
    return {
      type: q.type,
      promptEs: q.promptEs,
      promptEn: q.promptEn,
      options: null,
      correctAnswer: { es: q.acceptedAnswersEs, en: q.acceptedAnswersEn },
      explanationEs: q.explanationEs ?? null,
      explanationEn: q.explanationEn ?? null
    };
  }
  // short_answer
  return {
    type: q.type,
    promptEs: q.promptEs,
    promptEn: q.promptEn,
    options: null,
    correctAnswer: { keywordsEs: q.rubricKeywordsEs, keywordsEn: q.rubricKeywordsEn },
    explanationEs: null,
    explanationEn: null
  };
}

export async function ingestLesson(prisma, lesson, courseMeta) {
  // 2. Course
  const course = await prisma.course.findUnique({ where: { slug: lesson.courseSlug } });
  if (!course) {
    throw new Error(
      `Course slug "${lesson.courseSlug}" no existe en DB. Corré prisma/seed-catalog.mjs primero.`
    );
  }

  // 3. Competency upsert
  const competency = await prisma.competency.upsert({
    where: {
      courseId_code: { courseId: course.id, code: lesson.competencyCode }
    },
    create: {
      courseId: course.id,
      code: lesson.competencyCode,
      descriptionEs: lesson.competencyDescriptionEs,
      descriptionEn: lesson.competencyDescriptionEn,
      orderIndex: lesson.lessonOrderIndex
    },
    update: {
      descriptionEs: lesson.competencyDescriptionEs,
      descriptionEn: lesson.competencyDescriptionEn,
      orderIndex: lesson.lessonOrderIndex
    }
  });

  // 4. Lesson upsert (slug es @unique)
  const subjectLegacy = SUBJECT_AREA_TO_LEGACY[courseMeta.subject];
  const gradeLevel = gradeLevelFromCode(courseMeta.gradeCode);
  const lessonRow = await prisma.lesson.upsert({
    where: { slug: lesson.slug },
    create: {
      slug: lesson.slug,
      title: lesson.titleEs,
      estMinutes: lesson.estMinutes,
      subject: subjectLegacy,
      gradeLevel,
      orderIndex: lesson.lessonOrderIndex,
      courseId: course.id,
      monthIndex: lesson.monthIndex,
      bodyMd: lesson.contentMarkdownEs,
      activities: lesson.activities,
      reflectionEs: lesson.reflectionEs ?? null,
      reflectionEn: lesson.reflectionEn ?? null
    },
    update: {
      title: lesson.titleEs,
      estMinutes: lesson.estMinutes,
      subject: subjectLegacy,
      gradeLevel,
      orderIndex: lesson.lessonOrderIndex,
      courseId: course.id,
      monthIndex: lesson.monthIndex,
      bodyMd: lesson.contentMarkdownEs,
      activities: lesson.activities,
      reflectionEs: lesson.reflectionEs ?? null,
      reflectionEn: lesson.reflectionEn ?? null
    }
  });

  // 5. LessonCompetency upsert
  await prisma.lessonCompetency.upsert({
    where: {
      lessonId_competencyId: {
        lessonId: lessonRow.id,
        competencyId: competency.id
      }
    },
    create: {
      lessonId: lessonRow.id,
      competencyId: competency.id,
      weight: 100
    },
    update: { weight: 100 }
  });

  // 6. QuizQuestion: replace strategy — delete + insert
  await prisma.quizQuestion.deleteMany({ where: { lessonId: lessonRow.id } });
  if (lesson.quiz?.questions?.length) {
    await prisma.quizQuestion.createMany({
      data: lesson.quiz.questions.map((q, i) => ({
        lessonId: lessonRow.id,
        orderIndex: i,
        ...buildQuizPayload(q)
      }))
    });
  }

  return { lessonId: lessonRow.id, competencyId: competency.id };
}

async function main() {
  const args = parseArgs();
  if (!args.file) {
    console.error('Uso: node scripts/ingest-lesson.mjs <path-curated.json> [--target=dev|prod]');
    process.exit(1);
  }
  const filePath = path.isAbsolute(args.file) ? args.file : path.join(process.cwd(), args.file);
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const parsed = LessonIngestSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('No pasa Zod:');
    for (const err of parsed.error.errors) {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    }
    process.exit(2);
  }
  const lesson = parsed.data;

  const env = loadEnv();
  const dbUrl = resolveDbUrl(args, env);
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  // Necesitamos courseMeta para SubjectArea→subject legacy + gradeCode.
  // Lo leemos desde el catalog-map (más confiable que inferir de DB).
  const { getCourse } = await import('./lib/catalog-map.mjs');
  const courseMeta = getCourse(lesson.courseSlug);

  try {
    const { lessonId, competencyId } = await ingestLesson(prisma, lesson, courseMeta);
    console.log(`✓ ${lesson.slug} → lesson=${lessonId} competency=${competencyId}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Solo ejecutar main si se invoca directo (no si se importa como módulo).
const isMain = import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`;
if (isMain || process.argv[1]?.endsWith('ingest-lesson.mjs')) {
  main().catch((e) => {
    console.error('FAIL:', e.message);
    process.exit(1);
  });
}
