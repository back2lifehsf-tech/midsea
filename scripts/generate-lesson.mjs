#!/usr/bin/env node
/**
 * Generador de UNA lección de Midsea vía GPT-4o (ADR-006 §3).
 *
 * Uso:
 *   node scripts/generate-lesson.mjs \
 *        --course math-grade-9 \
 *        --month 1 --topic 1 --n 1 \
 *        [--total 2]                    # default = course.lessonsPerTopic
 *        [--model claude-sonnet-4-6]    # default (Sonnet); Haiku para materias livianas
 *        [--dry-run]                    # no llama OpenAI, prueba parser+prompt
 *
 * Pasos:
 *   1. Lee el outline del curso desde docs/content/source/...md.
 *   2. Lo parsea (parser dual A/B) y localiza el topic objetivo.
 *   3. Inyecta variables en scripts/prompts/lesson-generator-v1.md.
 *   4. Llama a Anthropic (Claude) con system + user; espera JSON puro.
 *   5. Wrappea la respuesta con campos posicionales derivados (slug,
 *      competencyCode, monthIndex, courseSlug, lessonOrderIndex, metadata).
 *   6. Valida contra LessonIngestSchema (Zod).
 *   7. Escribe a outputs/gen/<course-slug>/<lesson-slug>.json.
 *
 * Salida: path del JSON generado. Exit 0 si pasa Zod, 1 si falla.
 */
import fs from 'node:fs';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import {
  buildCompetencyCode,
  getCourse
} from './lib/catalog-map.mjs';
import { loadEnv, repoRoot } from './lib/env.mjs';
import { LessonIngestSchema } from './lib/lesson-ingest-schema.mjs';
import { parseOutline } from './parsers/outline-parser.mjs';

const PROMPT_VERSION = 'v1.7';
// Default a Sonnet para generación (contenido intelligence-sensitive: mate/
// ciencias con KaTeX, prosa pedagógica, bilingüe). Para materias livianas
// pasá --model=claude-haiku-4-5-20251001 y ahorrás ~3x.
const DEFAULT_MODEL = 'claude-sonnet-4-6';

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

// El prompt pide JSON puro, pero Claude a veces lo envuelve en ```json ... ```
// o agrega prosa. Extraemos el primer objeto {...} balanceado por las dudas.
function extractJsonText(text) {
  let t = (text ?? '').trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) t = fence[1].trim();
  if (t.startsWith('{')) return t;
  const first = t.indexOf('{');
  const last = t.lastIndexOf('}');
  if (first !== -1 && last > first) return t.slice(first, last + 1);
  return t;
}

async function callAnthropic({ system, user, model, apiKey }) {
  // El SDK reintenta 429 / 5xx / 529 (overloaded) automáticamente con backoff.
  const client = new Anthropic({ apiKey, maxRetries: 4 });
  // Anthropic no tiene json_object mode (y structured outputs no compila para
  // este schema tan grande). Validamos el JSON nosotros y, si el modelo lo
  // devuelve inválido (típicamente LaTeX mal escapado) o truncado, reintentamos
  // a temp 0.7 — suele salir bien en otro intento.
  const PARSE_RETRIES = 2;
  let lastErr;
  for (let attempt = 0; attempt <= PARSE_RETRIES; attempt++) {
    let message;
    try {
      message = await client.messages.create({
        model,
        // Una lección bilingüe completa no entra en 4096 tokens; 16k da holgura
        // sin pasar el techo seguro para requests no-stream.
        max_tokens: 16000,
        temperature: 0.7,
        // El system prompt es idéntico en cada lección del bulk → cache server-side.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: user }]
      });
    } catch (e) {
      const msg = e?.message ?? '';
      // Créditos/cuota agotada o sin permiso: reintentar es inútil.
      if (e instanceof Anthropic.PermissionDeniedError || /credit|billing|quota/i.test(msg)) {
        const err = new Error(
          'Anthropic: créditos/cuota insuficientes o sin permiso. Revisá billing en https://console.anthropic.com/ y re-corré con --skip-existing.'
        );
        err.code = 'insufficient_quota';
        throw err;
      }
      throw e;
    }

    const content = message.content
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('');
    const usage = message.usage ?? {};
    const tokensUsed = (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0);

    if (message.stop_reason === 'max_tokens') {
      lastErr = new Error('Respuesta truncada por max_tokens.');
    } else {
      try {
        return { modelJson: JSON.parse(extractJsonText(content)), tokensUsed };
      } catch (e) {
        lastErr = new Error(`JSON inválido (${e.message}). Inicio: ${content.slice(0, 160)}`);
      }
    }
    if (attempt < PARSE_RETRIES) {
      console.warn(`  ⏸ ${lastErr.message.split('\n')[0]} — reintento ${attempt + 1}/${PARSE_RETRIES}`);
    }
  }
  throw lastErr;
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
    console.log('\n(no se llamó a Anthropic)');
    return;
  }

  const env = loadEnv();
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY no está seteada (.env.local o env var)');
  }

  const { modelJson, tokensUsed } = await callAnthropic({
    system,
    user,
    model,
    apiKey: env.ANTHROPIC_API_KEY
  });

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
    hookEs: modelJson.hookEs,
    hookEn: modelJson.hookEn,
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
