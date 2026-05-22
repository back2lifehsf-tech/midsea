#!/usr/bin/env node
/**
 * Bulk ingest de todos los JSON curated de un curso (ADR-006 §5).
 *
 * Uso:
 *   node scripts/ingest-course.mjs --course math-grade-9
 *        [--target=dev|prod] [--url=postgresql://...]
 *        [--dir=outputs/curated/<slug>]   # default = outputs/curated/<course>
 *
 * Procesa secuencialmente (no paralelo — el orden de orderIndex importa
 * para el lesson player y evita race conditions en Prisma writes). Si
 * una lección falla, sigue con la siguiente y reporta al final.
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { getCourse } from './lib/catalog-map.mjs';
import { loadEnv, repoRoot } from './lib/env.mjs';
import { LessonIngestSchema } from './lib/lesson-ingest-schema.mjs';
import { ingestLesson } from './ingest-lesson.mjs';

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const eq = argv.find((a) => a.startsWith(flag + '='));
    if (eq) return eq.split('=')[1];
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : null;
  };
  return {
    course: get('--course'),
    target: get('--target'),
    url: get('--url'),
    dir: get('--dir')
  };
}

function resolveDbUrl({ target, url }, env) {
  if (url) return url;
  if (target === 'prod') {
    if (!env.DATABASE_URL_PROD) {
      throw new Error('--target=prod requires DATABASE_URL_PROD');
    }
    return env.DATABASE_URL_PROD;
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL not in env');
  return env.DATABASE_URL;
}

async function main() {
  const args = parseArgs();
  if (!args.course) {
    console.error('Falta --course=<slug>');
    process.exit(1);
  }
  const course = getCourse(args.course);
  const dir = path.isAbsolute(args.dir ?? '')
    ? args.dir
    : args.dir
      ? path.join(repoRoot(), args.dir)
      : path.join(repoRoot(), 'outputs', 'curated', args.course);

  if (!fs.existsSync(dir)) {
    console.error(`Directorio no existe: ${dir}`);
    process.exit(1);
  }
  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.invalid.json'))
    .map((f) => path.join(dir, f))
    .sort();

  if (files.length === 0) {
    console.log(`No hay JSONs curated en ${path.relative(repoRoot(), dir)}.`);
    return;
  }

  const env = loadEnv();
  const dbUrl = resolveDbUrl(args, env);
  const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

  console.log(`Curso: ${args.course} (${course.titleEs})`);
  console.log(`Lecciones a ingestar: ${files.length}`);
  const ok = [];
  const fail = [];

  try {
    for (const f of files) {
      const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
      const parsed = LessonIngestSchema.safeParse(raw);
      if (!parsed.success) {
        fail.push({ file: f, errors: parsed.error.errors });
        console.error(`  ✗ ${path.basename(f)}: Zod fail`);
        continue;
      }
      try {
        const { lessonId } = await ingestLesson(prisma, parsed.data, course);
        ok.push({ file: f, lessonId });
        console.log(`  ✓ ${parsed.data.slug}`);
      } catch (e) {
        fail.push({ file: f, error: e.message });
        console.error(`  ✗ ${parsed.data.slug}: ${e.message}`);
      }
    }
  } finally {
    await prisma.$disconnect();
  }

  console.log(`\nDONE — ok=${ok.length} fail=${fail.length}`);
  if (fail.length) process.exit(2);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
