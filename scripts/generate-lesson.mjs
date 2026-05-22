#!/usr/bin/env node
/**
 * Generador de UNA lección de Midsea vía GPT-4o (ADR-006 §3).
 *
 * Uso:
 *   node scripts/generate-lesson.mjs \
 *        --course math-grade-9 \
 *        --month 1 --topic 1 --n 1 \
 *        [--total 2]                    # default = course.lessonsPerTopic
 *        [--model gpt-4o]               # default
 *        [--dry-run]                    # no llama OpenAI, prueba parser+prompt
 *
 * Pasos:
 *   1. Lee el outline del curso desde docs/content/source/...md.
 *   2. Lo parsea (parser dual A/B) y localiza el topic objetivo.
 *   3. Inyecta variables en scripts/prompts/lesson-generator-v1.md.
 *   4. Llama a OpenAI con response_format=json_object.
 *   5. Wrappea la respuesta con campos posicionales derivados (slug,
 *      competencyCode, monthIndex, courseSlug, lessonOrderIndex, metadata).
 *   6. Valida contra LessonIngestSchema (Zod).
 *   7. Escribe a outputs/gen/<course-slug>/<lesson-slug>.json.
 *
 * Salida: path del JSON generado. Exit 0 si pasa Zod, 1 si falla.
 */
import fs from 'node:fs';
import path from 'node:path';
import OpenAI from 'openai';
import {
  buildCompetencyCode,
  getCourse
} from './lib/catalog-map.mjs';
import { loadEnv, repoRoot } from './lib/env.mjs';
import { LessonIngestSchema } from './lib/lesson-ingest-schema.mjs';
import { parseOutline } from './parsers/outline-parser.mjs';

const PROMPT_VERSION = 'v1.1';
const DEFAULT_MODEL = 'gpt-4o';

function parseArgs() {
  const out = { course: null, month: null, topic: null, n: null, total: null, model: null, dryRun: false };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--course=')) out.course = a.split('=')[1];
    else if (a === '--course') {
      const i = process.argv.indexOf('--course');
      out.course = process.argv[i + 1];
    } else if (a.startsWith('--month=')) out.month = Number(a.split('=')[1]);
    else if (a === '--month') {
      const i = process.argv.indexOf('--month');
      out.month = Number(process.argv[i + 1]);
    } else if (a.startsWith('--topic=')) out.topic = Number(a.split('=')[1]);
    else if (a === '--topic') {
      const i = process.argv.indexOf('--topic');
      out.topic = Number(process.argv[i + 1]);
    } else if (a.startsWith('--n=')) out.n = Number(a.split('=')[1]);
    else if (a === '--n') {
      const i = process.argv.indexOf('--n');
      out.n = Number(process.argv[i + 1]);
    } else if (a.startsWith('--total=')) out.total = Number(a.split('=')[1]);
    else if (a.startsWith('--model=')) out.model = a.split('=')[1];
    else if (a === '--dry-run') out.dryRun = true;
  }
  return out;
}

function requireArg(value, name) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    throw new Error(`Falta --${name}=<valor>`);
  }
  return value;
}

function injectVars(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    vars[key] === undefined || vars[key] === null ? '' : String(vars[key])
  );
}

function pickTopic(parsed, monthIndex, topicIndex) {
  const month = parsed.months.find((m) => m.monthIndex === monthIndex);
  if (!month) {
    throw new Error(
      `month ${monthIndex} no existe en el outline (meses disponibles: ${parsed.months
        .map((m) => m.monthIndex)
        .join(', ')})`
    );
  }
  const topic = month.topics[topicIndex - 1];
  if (!topic) {
    throw new Error(
      `topic ${topicIndex} no existe en ${month.monthName} (hay ${month.topics.length} temas)`
    );
  }
  return { month, topic };
}

function loadPromptTemplate() {
  return fs.readFileSync(
    path.join(repoRoot(), 'scripts', 'prompts', 'lesson-generator-v1.md'),
    'utf8'
  );
}

function splitSystemUser(rendered) {
  // El .md tiene secciones `## SYSTEM` y `## USER`. Split en esos
  // headers. Si no se encuentran, todo va como user.
  const sysMatch = rendered.match(/##\s*SYSTEM\s*\n([\s\S]*?)\n---\s*\n##\s*USER\s*\n([\s\S]*)$/);
  if (sysMatch) {
    return { system: sysMatch[1].trim(), user: sysMatch[2].trim() };
  }
  return { system: '', user: rendered.trim() };
}

// Parsea el mensaje de error 429 buscando "try again in Xs" o "Xms".
// Devuelve segundos a esperar (con piso de 1s y techo de 60s).
function parseRetryAfter(errMessage) {
  if (typeof errMessage !== 'string') return null;
  const msMatch = errMessage.match(/try again in ([\d.]+)ms/i);
  if (msMatch) return Math.max(1, Math.min(60, Math.ceil(parseFloat(msMatch[1]) / 1000)));
  const sMatch = errMessage.match(/try again in ([\d.]+)s/i);
  if (sMatch) return Math.max(1, Math.min(60, Math.ceil(parseFloat(sMatch[1]))));
  return null;
}

async function callOpenAI({ system, user, model, apiKey }) {
  const client = new OpenAI({ apiKey });
  const MAX_RETRIES = 4;
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.7,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user }
        ]
      });
      const content = completion.choices[0]?.message?.content ?? '';
      return { content, tokensUsed: completion.usage?.total_tokens };
    } catch (e) {
      lastError = e;
      const status = e?.status ?? e?.code;
      const msg = e?.message ?? '';
      // OpenAI usa 429 para DOS cosas distintas:
      //   - Rate limit por TPM (temporal): "Rate limit reached on tokens per min".
      //     code: 'rate_limit_exceeded'.
      //   - Quota agotada (billing): "You exceeded your current quota".
      //     code: 'insufficient_quota'.
      // Solo la primera se puede recuperar con retry. La segunda requiere
      // top-up de créditos — reintentar es perder tiempo.
      const isQuotaExhausted =
        e?.code === 'insufficient_quota' ||
        /exceeded your current quota/i.test(msg) ||
        /check your plan and billing/i.test(msg);
      if (isQuotaExhausted) {
        const err = new Error(
          'OpenAI quota agotada. Recargá créditos en https://platform.openai.com/settings/organization/billing y re-corré el bulk con --skip-existing.'
        );
        err.code = 'insufficient_quota';
        throw err;
      }
      const is429 = status === 429 || /rate limit/i.test(msg);
      const is5xx = typeof status === 'number' && status >= 500 && status < 600;
      if (!is429 && !is5xx) throw e;
      if (attempt === MAX_RETRIES) break;
      // Para 429 usamos el wait time del mensaje; para 5xx backoff exponencial.
      const retryAfterSec =
        (is429 ? parseRetryAfter(msg) : null) ?? Math.pow(2, attempt) + 1;
      // Jitter +0-500ms para evitar thundering herd cuando varios subprocesos
      // de generate-course salen del 429 al mismo tiempo.
      const jitterMs = Math.floor(Math.random() * 500);
      const waitMs = retryAfterSec * 1000 + jitterMs;
      console.warn(
        `  ⏸ retry ${attempt + 1}/${MAX_RETRIES} en ${(waitMs / 1000).toFixed(1)}s — ${is429 ? '429' : status}`
      );
      await new Promise((r) => setTimeout(r, waitMs));
    }
  }
  throw lastError;
}

function buildLessonSlug(competencyCode) {
  return competencyCode.toLowerCase();
}

async function main() {
  const args = parseArgs();
  const courseSlug = requireArg(args.course, 'course');
  const monthIndex = requireArg(args.month, 'month');
  const topicIndex = requireArg(args.topic, 'topic');
  const n = requireArg(args.n, 'n');

  const course = getCourse(courseSlug);
  const totalForTopic = args.total ?? course.lessonsPerTopic;
  const model = args.model ?? DEFAULT_MODEL;

  const outlinePath = path.join(repoRoot(), course.outlinePath);
  if (!fs.existsSync(outlinePath)) {
    throw new Error(`Outline no encontrado: ${course.outlinePath}`);
  }
  const outlineMd = fs.readFileSync(outlinePath, 'utf8');
  const parsed = parseOutline(outlineMd);
  if (parsed.format !== course.outlineFormat) {
    console.warn(
      `⚠ formato detectado=${parsed.format} pero catalog-map dice ${course.outlineFormat}. Continuando con detectado.`
    );
  }

  const { month, topic } = pickTopic(parsed, monthIndex, topicIndex);
  const competencyCode = buildCompetencyCode(course, monthIndex, topicIndex, n);
  const lessonSlug = buildLessonSlug(competencyCode);
  const christianFocusDeclared =
    parsed.metadata.declaresChristianFocus || topic.christianFocus || course.christianFocus;

  const promptTemplate = loadPromptTemplate();
  const rendered = injectVars(promptTemplate, {
    courseTitleEs: course.titleEs,
    courseTitleEn: course.titleEn,
    gradeBand: course.gradeBand,
    subject: course.subject,
    monthName: month.monthName,
    monthIndex,
    topicTitleEs: topic.title,
    n,
    totalForTopic,
    outlineHandsOn: (topic.handsOn ?? []).map((h) => `- ${h}`).join('\n') || '(ninguna)',
    outlineProduct: topic.product ?? '(no aplica)',
    outlineEnfoque: parsed.metadata.enfoque ?? '(no declarado)',
    outlineContents: topic.contents ?? topic.esl?.vocabulario ?? '(ninguno)',
    christianFocusDeclared: christianFocusDeclared ? 'true' : 'false'
  });
  const { system, user } = splitSystemUser(rendered);

  console.log(`▶ Generando lección ${competencyCode}`);
  console.log(`  curso=${courseSlug} mes=${month.monthName} tema="${topic.title}" n=${n}/${totalForTopic}`);
  console.log(`  christianFocusDeclared=${christianFocusDeclared}`);

  if (args.dryRun) {
    console.log('\n--- DRY RUN: prompt rendered ---');
    console.log('SYSTEM:\n' + system.slice(0, 400) + (system.length > 400 ? '...' : ''));
    console.log('\nUSER:\n' + user.slice(0, 800) + (user.length > 800 ? '...' : ''));
    console.log('\n(no se llamó a OpenAI)');
    return;
  }

  const env = loadEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY no está seteada (.env.local o env var)');
  }

  const { content, tokensUsed } = await callOpenAI({
    system,
    user,
    model,
    apiKey: env.OPENAI_API_KEY
  });

  let modelJson;
  try {
    modelJson = JSON.parse(content);
  } catch (e) {
    throw new Error(
      `OpenAI devolvió contenido no-JSON. Primeros 300 chars:\n${content.slice(0, 300)}`
    );
  }
  if (modelJson._error) {
    throw new Error(`Modelo se negó/falló: ${modelJson._error}`);
  }

  const lesson = {
    slug: lessonSlug,
    courseSlug,
    competencyCode,
    competencyDescriptionEs: modelJson.competencyDescriptionEs,
    competencyDescriptionEn: modelJson.competencyDescriptionEn,
    monthIndex,
    topicTitleEs: topic.title,
    topicTitleEn: modelJson.topicTitleEn ?? topic.title,
    lessonOrderIndex: (topicIndex - 1) * (totalForTopic ?? 1) + (n - 1),
    titleEs: modelJson.titleEs,
    titleEn: modelJson.titleEn,
    summaryEs: modelJson.summaryEs,
    summaryEn: modelJson.summaryEn,
    estMinutes: modelJson.estMinutes,
    contentMarkdownEs: modelJson.contentMarkdownEs,
    contentMarkdownEn: modelJson.contentMarkdownEn,
    reflectionEs: modelJson.reflectionEs,
    reflectionEn: modelJson.reflectionEn,
    activities: modelJson.activities,
    quiz: modelJson.quiz,
    handsOnSuggestionEs: modelJson.handsOnSuggestionEs,
    handsOnSuggestionEn: modelJson.handsOnSuggestionEn,
    metadata: {
      model,
      promptVersion: PROMPT_VERSION,
      generatedAt: new Date().toISOString(),
      tokensUsed
    }
  };

  const validation = LessonIngestSchema.safeParse(lesson);
  if (!validation.success) {
    const outDir = path.join(repoRoot(), 'outputs', 'gen', courseSlug);
    fs.mkdirSync(outDir, { recursive: true });
    const errorPath = path.join(outDir, `${lessonSlug}.invalid.json`);
    fs.writeFileSync(
      errorPath,
      JSON.stringify({ lesson, errors: validation.error.errors }, null, 2)
    );
    throw new Error(
      `Lección no pasa Zod. JSON crudo + errores escritos a ${path.relative(
        repoRoot(),
        errorPath
      )}.\n` +
        validation.error.errors
          .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
          .join('\n')
    );
  }

  const outDir = path.join(repoRoot(), 'outputs', 'gen', courseSlug);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${lessonSlug}.json`);
  fs.writeFileSync(outPath, JSON.stringify(validation.data, null, 2));
  console.log(`✓ ${path.relative(repoRoot(), outPath)} (${tokensUsed ?? '?'} tokens)`);
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
