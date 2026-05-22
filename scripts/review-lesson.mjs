#!/usr/bin/env node
/**
 * Helper de review humano (ADR-006 §4).
 *
 * Uso:
 *   node scripts/review-lesson.mjs <path-a-outputs/gen/.../xxx.json>
 *
 * Imprime la lección formateada legible en stdout (markdown crudo, no
 * renderizado — el founder lee en terminal o en VSCode).
 * Hace checklist de review impreso al final.
 *
 * Cuando el founder está conforme:
 *   node scripts/review-lesson.mjs <path> --approve [--reviewed-by Omar]
 *
 * Eso:
 *   1. Re-valida contra Zod.
 *   2. Setea metadata.reviewedAt + metadata.reviewedBy.
 *   3. Mueve el JSON a outputs/curated/<course-slug>/.
 *
 * Edits del JSON: el founder edita el archivo origen en outputs/gen/ a
 * mano (VSCode). Este script NO abre editor — solo aprueba/mueve.
 */
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './lib/env.mjs';
import { LessonIngestSchema } from './lib/lesson-ingest-schema.mjs';

function parseArgs() {
  const argv = process.argv.slice(2);
  const file = argv.find((a) => !a.startsWith('--'));
  const approve = argv.includes('--approve');
  const reviewedByArg = argv.find((a) => a.startsWith('--reviewed-by='));
  const reviewedBy = reviewedByArg ? reviewedByArg.split('=')[1] : 'founder';
  return { file, approve, reviewedBy };
}

function printLesson(lesson) {
  const banner = '═'.repeat(70);
  console.log(banner);
  console.log(`  ${lesson.slug}  (${lesson.courseSlug})`);
  console.log(banner);
  console.log(`Title ES: ${lesson.titleEs}`);
  console.log(`Title EN: ${lesson.titleEn}`);
  console.log(`Competencia ES: ${lesson.competencyDescriptionEs}`);
  console.log(`Competencia EN: ${lesson.competencyDescriptionEn}`);
  console.log(`Estimado: ${lesson.estMinutes} min · Mes ${lesson.monthIndex}`);
  console.log(`Topic: ${lesson.topicTitleEs}`);
  console.log('-'.repeat(70));
  console.log('Summary ES:\n  ' + lesson.summaryEs);
  console.log('\nSummary EN:\n  ' + lesson.summaryEn);
  console.log('-'.repeat(70));
  console.log('Contenido ES:');
  console.log(lesson.contentMarkdownEs);
  console.log('-'.repeat(70));
  if (lesson.reflectionEs) {
    console.log('Reflexión ES: ' + lesson.reflectionEs);
    console.log('Reflexión EN: ' + lesson.reflectionEn);
    console.log('-'.repeat(70));
  }
  console.log(`Actividades (${lesson.activities.length}):`);
  lesson.activities.forEach((a, i) => {
    console.log(`  ${i + 1}. [${a.type}] ${a.promptEs}`);
  });
  console.log('-'.repeat(70));
  console.log(`Quiz (${lesson.quiz.questions.length} preguntas):`);
  lesson.quiz.questions.forEach((q, i) => {
    console.log(`  ${i + 1}. [${q.type}] ${q.promptEs}`);
  });
  console.log('-'.repeat(70));
  console.log(`Hands-on ES: ${lesson.handsOnSuggestionEs}`);
  console.log(`Hands-on EN: ${lesson.handsOnSuggestionEn}`);
  console.log(banner);
}

function printChecklist() {
  console.log('\nCHECKLIST DE REVIEW (ADR-006 §4):');
  console.log('  [ ] Contenido correcto (sin errores conceptuales/de hechos)');
  console.log('  [ ] Tono español LATAM neutro (sin voseo, sin "vosotros")');
  console.log('  [ ] Sin proselitismo ni declaración doctrinal sectaria');
  console.log('  [ ] 3 actividades intercaladas demostrables (no decorativas)');
  console.log('  [ ] Quiz tiene respuestas correctas inequívocas');
  console.log('  [ ] Hands-on realista (sin material costoso)');
  console.log('  [ ] KaTeX renderiza (sintaxis válida)');
  console.log('  [ ] Imágenes placeholder con descripción suficiente');
  console.log('  [ ] Traducción EN culturalmente correcta (no calque literal)');
  console.log('\nSi todo OK, re-correr con --approve para mover a outputs/curated/.');
}

function approve(filePath, lesson, reviewedBy) {
  const parsed = LessonIngestSchema.safeParse(lesson);
  if (!parsed.success) {
    console.error('No pasa Zod — corregí antes de aprobar:');
    for (const err of parsed.error.errors) {
      console.error(`  - ${err.path.join('.')}: ${err.message}`);
    }
    process.exit(1);
  }
  const approved = {
    ...parsed.data,
    metadata: {
      ...parsed.data.metadata,
      reviewedAt: new Date().toISOString(),
      reviewedBy
    }
  };
  // Destino: outputs/curated/<courseSlug>/<slug>.json
  const destDir = path.join(repoRoot(), 'outputs', 'curated', approved.courseSlug);
  fs.mkdirSync(destDir, { recursive: true });
  const destPath = path.join(destDir, `${approved.slug}.json`);
  fs.writeFileSync(destPath, JSON.stringify(approved, null, 2));
  // Borrar el gen/ source para no confundir.
  fs.unlinkSync(filePath);
  console.log(`✓ approved → ${path.relative(repoRoot(), destPath)}`);
  console.log(`  reviewedBy=${reviewedBy} at ${approved.metadata.reviewedAt}`);
}

function main() {
  const { file, approve: doApprove, reviewedBy } = parseArgs();
  if (!file) {
    console.error('Uso: node scripts/review-lesson.mjs <path-json> [--approve]');
    process.exit(1);
  }
  const filePath = path.isAbsolute(file) ? file : path.join(process.cwd(), file);
  if (!fs.existsSync(filePath)) {
    console.error(`No existe: ${filePath}`);
    process.exit(1);
  }
  const lesson = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  if (doApprove) {
    approve(filePath, lesson, reviewedBy);
  } else {
    printLesson(lesson);
    printChecklist();
  }
}

main();
