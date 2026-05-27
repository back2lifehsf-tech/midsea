#!/usr/bin/env node
/**
 * generate-all-pilot-exams.mjs — Genera TODOS los exámenes del pilot HS (8 cursos).
 *
 * Por cada curso: 10 Monthly (meses 1-10) + 1 Midterm + 1 Final = 12 exámenes.
 * Total: 8 cursos × 12 = 96 exámenes.
 *
 * Uso:
 *   node --env-file=.env.local scripts/generate-all-pilot-exams.mjs
 *   node --env-file=.env.local scripts/generate-all-pilot-exams.mjs --dryRun
 *   node --env-file=.env.local scripts/generate-all-pilot-exams.mjs --course math-grade-9
 *   node --env-file=.env.local scripts/generate-all-pilot-exams.mjs --skip-existing
 *
 * El script es idempotente (generate-exam.mjs hace upsert). Re-correrlo es safe.
 */
import { execSync } from 'node:child_process';
import { parseArgs } from 'node:util';
import { PrismaClient } from '@prisma/client';

const { values: args } = parseArgs({
  options: {
    dryRun:        { type: 'boolean', default: false },
    course:        { type: 'string' },       // filtrar un solo curso
    'skip-existing': { type: 'boolean', default: false }  // skip si el exam ya está en DB
  }
});

const PILOT_COURSES = [
  'math-grade-9',
  'math-grade-10',
  'language-grade-9-10',
  'english-esl-grade-9',
  'english-esl-grade-10',
  'history-ancient-civ-2-grade-9-10',
  'science-biology-grade-9-10',
  'music-grade-9',
];

const courses = args.course ? [args.course] : PILOT_COURSES;

// Obtener los meses disponibles por curso de la DB
const prisma = new PrismaClient();
const courseMonths = {};
for (const slug of courses) {
  const course = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
  if (!course) {
    console.warn(`⚠️  Curso no encontrado: ${slug} — saltando`);
    continue;
  }
  const months = await prisma.lesson.findMany({
    where: { courseId: course.id, monthIndex: { not: null } },
    select: { monthIndex: true },
    distinct: ['monthIndex'],
    orderBy: { monthIndex: 'asc' }
  });
  courseMonths[slug] = months.map(m => m.monthIndex);
}

// Obtener exámenes ya existentes en DB (para --skip-existing)
const existingExams = args['skip-existing']
  ? await prisma.exam.findMany({
      select: { course: { select: { slug: true } }, type: true, monthIndex: true }
    })
  : [];
const existingSet = new Set(
  existingExams.map(e => `${e.course.slug}:${e.type}:${e.monthIndex ?? 'null'}`)
);

await prisma.$disconnect();

// Construir lista de jobs
const jobs = [];
for (const slug of courses) {
  if (!courseMonths[slug]) continue;
  const months = courseMonths[slug];

  // 10 Monthly exams
  for (const month of months) {
    if (args['skip-existing'] && existingSet.has(`${slug}:MONTHLY:${month}`)) {
      console.log(`  skip (exists): ${slug} MONTHLY m${month}`);
      continue;
    }
    jobs.push({ course: slug, type: 'MONTHLY', month });
  }

  // Midterm
  if (!args['skip-existing'] || !existingSet.has(`${slug}:MIDTERM:null`)) {
    jobs.push({ course: slug, type: 'MIDTERM' });
  } else {
    console.log(`  skip (exists): ${slug} MIDTERM`);
  }

  // Final
  if (!args['skip-existing'] || !existingSet.has(`${slug}:FINAL:null`)) {
    jobs.push({ course: slug, type: 'FINAL' });
  } else {
    console.log(`  skip (exists): ${slug} FINAL`);
  }
}

console.log(`\n📋 Plan: ${jobs.length} exámenes para ${courses.length} cursos\n`);
if (args.dryRun) {
  console.log(jobs.map(j => `  ${j.course} ${j.type}${j.month ? ' m' + j.month : ''}`).join('\n'));
  console.log('\n(dry run — no se llama al API)');
  process.exit(0);
}

// Ejecutar secuencialmente con reintentos
let ok = 0, failed = 0;
const failures = [];

for (const [i, job] of jobs.entries()) {
  const label = `[${i + 1}/${jobs.length}] ${job.course} ${job.type}${job.month ? ' m' + job.month : ''}`;
  const monthArg = job.month ? `--month ${job.month}` : '';
  const cmd = `node --env-file=.env.local scripts/generate-exam.mjs --course ${job.course} --type ${job.type} ${monthArg}`;

  let attempt = 0;
  let success = false;

  while (attempt < 3 && !success) {
    attempt++;
    try {
      console.log(`\n${label}${attempt > 1 ? ` (intento ${attempt})` : ''}`);
      execSync(cmd, { stdio: 'inherit', cwd: process.cwd() });
      ok++;
      success = true;
    } catch (e) {
      if (attempt < 3) {
        console.log(`  ↻ Reintentando en 5s...`);
        await new Promise(r => setTimeout(r, 5000));
      } else {
        console.error(`  ✗ Falló después de 3 intentos`);
        failed++;
        failures.push(label);
      }
    }
  }
}

console.log(`\n${'═'.repeat(50)}`);
console.log(`✅ Completados: ${ok}/${jobs.length}`);
if (failed > 0) {
  console.log(`❌ Fallidos: ${failed}`);
  console.log(failures.map(f => `   • ${f}`).join('\n'));
  console.log('\nRe-corré con --skip-existing para reanudar desde donde falló.');
}
console.log(`${'═'.repeat(50)}\n`);
