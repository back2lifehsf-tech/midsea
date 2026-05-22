#!/usr/bin/env node
/**
 * Bulk generation de un curso entero (todas las lecciones de todos
 * los topics del outline). ADR-006 §3.
 *
 * Uso:
 *   node scripts/generate-course.mjs --course math-grade-9
 *        [--from-month 1] [--to-month 10]
 *        [--lessons-per-topic 2]        # default = course.lessonsPerTopic
 *        [--concurrency 3]
 *        [--skip-existing]              # no re-generar si el JSON ya está
 *        [--dry-run]
 *
 * Reuso del runtime de generate-lesson.mjs vía spawn — cada lección es un
 * subproceso aislado (resiliente a fallas individuales, paraleliza
 * naturalmente). Fallas se loggean pero no detienen el bulk.
 *
 * Resultado: outputs/gen/<course-slug>/*.json + un summary en stdout.
 */
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { getCourse } from './lib/catalog-map.mjs';
import { repoRoot } from './lib/env.mjs';
import { parseOutline } from './parsers/outline-parser.mjs';

const __filename = fileURLToPath(import.meta.url);

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
    fromMonth: Number(get('--from-month') ?? 1),
    toMonth: Number(get('--to-month') ?? 10),
    lessonsPerTopic: get('--lessons-per-topic') ? Number(get('--lessons-per-topic')) : null,
    concurrency: Number(get('--concurrency') ?? 3),
    skipExisting: argv.includes('--skip-existing'),
    dryRun: argv.includes('--dry-run')
  };
}

function buildJobs(course, parsed, args) {
  const total = args.lessonsPerTopic ?? course.lessonsPerTopic;
  const jobs = [];
  for (const month of parsed.months) {
    if (month.monthIndex < args.fromMonth || month.monthIndex > args.toMonth) continue;
    for (let topicIdx = 0; topicIdx < month.topics.length; topicIdx++) {
      for (let n = 1; n <= total; n++) {
        jobs.push({
          month: month.monthIndex,
          topic: topicIdx + 1,
          n,
          total
        });
      }
    }
  }
  return jobs;
}

function jobOutputPath(course, courseSlug, job) {
  // El slug es el competencyCode lowercase.
  const pad = (x) => String(x).padStart(2, '0');
  const code = `arg-${course.subjectCode}-${course.gradeCode}-m${pad(job.month)}-t${pad(
    job.topic
  )}-l${pad(job.n)}`.toLowerCase();
  return path.join(repoRoot(), 'outputs', 'gen', courseSlug, `${code}.json`);
}

function runJob(courseSlug, job) {
  return new Promise((resolve) => {
    const args = [
      path.join(repoRoot(), 'scripts', 'generate-lesson.mjs'),
      `--course=${courseSlug}`,
      `--month=${job.month}`,
      `--topic=${job.topic}`,
      `--n=${job.n}`,
      `--total=${job.total}`
    ];
    const child = spawn(process.execPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => {
      stdout += d.toString();
    });
    child.stderr.on('data', (d) => {
      stderr += d.toString();
    });
    child.on('close', (code) => {
      resolve({ job, code, stdout: stdout.trim(), stderr: stderr.trim() });
    });
  });
}

async function withConcurrency(items, n, worker) {
  const results = [];
  let i = 0;
  const runners = Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  });
  await Promise.all(runners);
  return results;
}

async function main() {
  const args = parseArgs();
  if (!args.course) {
    console.error('Falta --course=<slug>');
    process.exit(1);
  }
  const course = getCourse(args.course);
  const outlinePath = path.join(repoRoot(), course.outlinePath);
  const parsed = parseOutline(fs.readFileSync(outlinePath, 'utf8'));

  let jobs = buildJobs(course, parsed, args);
  if (args.skipExisting) {
    jobs = jobs.filter((j) => !fs.existsSync(jobOutputPath(course, args.course, j)));
  }

  console.log(`Curso: ${args.course} (${course.titleEs})`);
  console.log(`Outline format detectado: ${parsed.format}`);
  console.log(`Meses: ${args.fromMonth}-${args.toMonth}`);
  console.log(`Jobs a procesar: ${jobs.length}`);
  console.log(`Concurrency: ${args.concurrency}`);

  if (args.dryRun) {
    for (const j of jobs.slice(0, 8)) {
      console.log(`  - mes=${j.month} topic=${j.topic} n=${j.n}/${j.total}`);
    }
    if (jobs.length > 8) console.log(`  ... ${jobs.length - 8} más`);
    return;
  }

  const ok = [];
  const fail = [];
  const results = await withConcurrency(jobs, args.concurrency, (j) => runJob(args.course, j));
  for (const r of results) {
    if (r.code === 0) {
      ok.push(r);
      console.log(`  ✓ m${r.job.month}-t${r.job.topic}-l${r.job.n}`);
    } else {
      fail.push(r);
      console.error(
        `  ✗ m${r.job.month}-t${r.job.topic}-l${r.job.n}: ${r.stderr.split('\n').pop() || 'unknown'}`
      );
    }
  }
  console.log(`\nDONE — ok=${ok.length} fail=${fail.length}`);
  if (fail.length) process.exit(2);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
