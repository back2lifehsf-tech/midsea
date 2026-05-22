#!/usr/bin/env node
/**
 * Bulk approve de todas las lecciones de un curso (Epic 04 Tarea 4).
 *
 * Es la version masiva de scripts/review-lesson.mjs --approve. Util para
 * el workflow "spot-check + bulk approve" donde el founder lee 2-3
 * lecciones random del curso y, si la calidad es consistente, aprueba
 * el resto en bloque.
 *
 * Uso:
 *   node scripts/bulk-approve.mjs --course <slug> [--reviewed-by Omar]
 *
 *   node scripts/bulk-approve.mjs --course music-grade-9
 *   node scripts/bulk-approve.mjs --all   # los 8 cursos
 *
 * Para cada .json en outputs/gen/<course>/:
 *   1. Valida con LessonIngestSchema (rechaza .invalid.json silenciosamente).
 *   2. Setea metadata.reviewedAt + reviewedBy.
 *   3. Mueve a outputs/curated/<course>/<slug>.json.
 *   4. Borra el origen.
 *
 * Si una leccion no pasa Zod, NO se mueve y se reporta. Permite re-correr
 * sin perder progreso (idempotente: solo procesa los que esten en gen/).
 */
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './lib/env.mjs';
import { LessonIngestSchema } from './lib/lesson-ingest-schema.mjs';
import { listCourseSlugs } from './lib/catalog-map.mjs';

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
    all: argv.includes('--all'),
    reviewedBy: get('--reviewed-by') ?? 'founder'
  };
}

function approveOne(filePath, reviewedBy) {
  const raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const parsed = LessonIngestSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false,
      reason: parsed.error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join('; ')
    };
  }
  const approved = {
    ...parsed.data,
    metadata: {
      ...parsed.data.metadata,
      reviewedAt: new Date().toISOString(),
      reviewedBy
    }
  };
  const destDir = path.join(repoRoot(), 'outputs', 'curated', approved.courseSlug);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `${approved.slug}.json`);
  fs.writeFileSync(destPath, JSON.stringify(approved, null, 2));
  fs.unlinkSync(filePath);
  return { ok: true, slug: approved.slug };
}

function approveCourse(courseSlug, reviewedBy) {
  const genDir = path.join(repoRoot(), 'outputs', 'gen', courseSlug);
  if (!fs.existsSync(genDir)) {
    return { course: courseSlug, total: 0, approved: 0, failed: 0, skipped: 0 };
  }
  const files = fs
    .readdirSync(genDir)
    .filter((f) => f.endsWith('.json') && !f.endsWith('.invalid.json'))
    .map((f) => path.join(genDir, f));

  let approved = 0;
  let failed = 0;
  const failures = [];
  for (const f of files) {
    const result = approveOne(f, reviewedBy);
    if (result.ok) {
      approved += 1;
    } else {
      failed += 1;
      failures.push({ file: path.basename(f), reason: result.reason });
    }
  }
  return { course: courseSlug, total: files.length, approved, failed, failures };
}

function main() {
  const args = parseArgs();
  const courses = args.all ? listCourseSlugs() : args.course ? [args.course] : null;
  if (!courses) {
    console.error('Uso: node scripts/bulk-approve.mjs --course <slug> | --all');
    process.exit(1);
  }
  console.log(`Reviewed by: ${args.reviewedBy}`);
  console.log('');
  let grandTotal = 0;
  let grandApproved = 0;
  let grandFailed = 0;
  for (const c of courses) {
    const r = approveCourse(c, args.reviewedBy);
    grandTotal += r.total;
    grandApproved += r.approved;
    grandFailed += r.failed;
    const tag = r.failed > 0 ? '⚠' : r.approved > 0 ? '✓' : '·';
    console.log(`${tag} ${c}: approved=${r.approved} failed=${r.failed} (de ${r.total})`);
    if (r.failures && r.failures.length) {
      for (const f of r.failures) {
        console.log(`    × ${f.file}: ${f.reason}`);
      }
    }
  }
  console.log('');
  console.log(
    `DONE — total=${grandTotal} approved=${grandApproved} failed=${grandFailed}`
  );
  if (grandFailed > 0) process.exit(2);
}

main();
