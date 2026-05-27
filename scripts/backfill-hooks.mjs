#!/usr/bin/env node
/**
 * Backfill del "Activador Mental" (hook) para lecciones existentes (Mejora 8).
 *
 * Para cada Lesson con contenido real (bodyMd != null) y SIN hook
 * (hookEs == null), genera un hook bilingüe breve ("¿Sabías que…?")
 * específico del tema usando su título + resumen + un extracto del cuerpo,
 * y escribe hookEs/hookEn en la DB.
 *
 * Idempotente y resumible: salta las lecciones que ya tienen hook, así se
 * puede cortar y re-correr sin duplicar trabajo ni costo.
 *
 * Uso:
 *   node scripts/backfill-hooks.mjs                    # dev, todas las pendientes
 *   node scripts/backfill-hooks.mjs --limit=3          # solo 3 (prueba)
 *   node scripts/backfill-hooks.mjs --dry-run --limit=2  # llama OpenAI pero NO escribe
 *   node scripts/backfill-hooks.mjs --model=gpt-4o     # modelo distinto
 *   node scripts/backfill-hooks.mjs --target=prod --url=postgresql://...  # prod
 */
import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';
import { loadEnv } from './lib/env.mjs';

const DEFAULT_MODEL = 'gpt-4o-mini';
const MAX_HOOK_CHARS = 300;

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const eq = argv.find((a) => a.startsWith(flag + '='));
    return eq ? eq.split('=')[1] : null;
  };
  return {
    limit: get('--limit') ? Number(get('--limit')) : null,
    model: get('--model') ?? DEFAULT_MODEL,
    target: get('--target'),
    url: get('--url'),
    dryRun: argv.includes('--dry-run')
  };
}

function resolveDbUrl({ target, url }, env) {
  if (url) return url;
  if (target === 'prod') {
    if (!env.DATABASE_URL_PROD) {
      throw new Error('--target=prod requiere DATABASE_URL_PROD');
    }
    return env.DATABASE_URL_PROD;
  }
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL no está en .env.local');
  return env.DATABASE_URL;
}

const SYSTEM = `Eres Angela, educadora de Midsea (homeschooling cristiano bilingüe para secundaria de toda Latinoamérica).
Tu tarea: escribir un "activador mental" (hook) breve que abra una lección y despierte la curiosidad del estudiante ANTES de leer.

Reglas (no negociables):
- Español LATAM neutro: usa "tú" (nunca "vos" ni "vosotros"); sin localismos regionales.
- Tono académico-respetuoso a adolescentes de 13-17 años; nada infantil.
- Es un GANCHO, no un resumen: un dato sorprendente, una pregunta impactante o una situación real. Tono "¿Sabías que…?".
- NO revele la respuesta ni resuma la lección. Específico del tema de ESTA lección.
- PROHIBIDO inventar estadísticas, porcentajes o cifras. Si no es un dato real y verificable, usá una pregunta o un dato conceptual (sin números).
- PROHIBIDO también las generalizaciones cuantitativas vagas y NO verificables sobre la gente o las personas en general (ej. "la mayoría de las personas logran/sienten/no logran…", "uno de cada…", "la gente tiende a…"). Un hecho histórico o científico concreto y verificable SÍ se permite.
- Máximo 300 caracteres por idioma. Una o dos oraciones.
- Cosmovisión cristiana abierta, sin proselitismo.

Respondé SOLO con JSON: {"hookEs": "...", "hookEn": "..."}.`;

function buildUser(lesson) {
  const excerpt = (lesson.bodyMd ?? '').replace(/\s+/g, ' ').trim().slice(0, 800);
  return `Lección a la que pertenece el hook:
Título: ${lesson.titleEs}
Resumen: ${lesson.summaryEs}
Extracto del contenido: ${excerpt}

Generá el hook bilingüe (es + en). Respondé SOLO el JSON.`;
}

function parseRetryAfter(msg) {
  if (typeof msg !== 'string') return null;
  const ms = msg.match(/try again in ([\d.]+)ms/i);
  if (ms) return Math.max(1, Math.min(60, Math.ceil(parseFloat(ms[1]) / 1000)));
  const s = msg.match(/try again in ([\d.]+)s/i);
  if (s) return Math.max(1, Math.min(60, Math.ceil(parseFloat(s[1]))));
  return null;
}

async function generateHook(client, model, lesson) {
  const MAX_RETRIES = 4;
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        temperature: 0.8,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: buildUser(lesson) }
        ]
      });
      const content = completion.choices[0]?.message?.content ?? '';
      const json = JSON.parse(content);
      let hookEs = (json.hookEs ?? '').trim();
      let hookEn = (json.hookEn ?? '').trim();
      if (!hookEs || !hookEn) throw new Error('respuesta sin hookEs/hookEn');
      if (hookEs.length > MAX_HOOK_CHARS) hookEs = hookEs.slice(0, MAX_HOOK_CHARS).trim();
      if (hookEn.length > MAX_HOOK_CHARS) hookEn = hookEn.slice(0, MAX_HOOK_CHARS).trim();
      return { hookEs, hookEn };
    } catch (e) {
      lastError = e;
      const msg = e?.message ?? '';
      const status = e?.status ?? e?.code;
      const isQuota =
        e?.code === 'insufficient_quota' || /exceeded your current quota/i.test(msg);
      if (isQuota) {
        const err = new Error('OpenAI quota agotada — recargá créditos y re-corré (es idempotente).');
        err.code = 'insufficient_quota';
        throw err;
      }
      const is429 = status === 429 || /rate limit/i.test(msg);
      const is5xx = typeof status === 'number' && status >= 500 && status < 600;
      const isBadJson = e instanceof SyntaxError;
      if (!is429 && !is5xx && !isBadJson) throw e;
      if (attempt === MAX_RETRIES) break;
      const waitSec = (is429 ? parseRetryAfter(msg) : null) ?? Math.pow(2, attempt) + 1;
      await new Promise((r) => setTimeout(r, waitSec * 1000 + Math.floor(Math.random() * 400)));
    }
  }
  throw lastError;
}

async function main() {
  const args = parseArgs();
  const env = loadEnv();
  if (!env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY no está en .env.local');

  const prisma = new PrismaClient({ datasources: { db: { url: resolveDbUrl(args, env) } } });
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  try {
    const pending = await prisma.lesson.findMany({
      where: { bodyMd: { not: null }, hookEs: null },
      select: { id: true, slug: true, titleEs: true, summaryEs: true, bodyMd: true },
      orderBy: { slug: 'asc' },
      ...(args.limit ? { take: args.limit } : {})
    });

    console.log(
      `Pendientes: ${pending.length} | modelo: ${args.model}${args.dryRun ? ' | DRY-RUN (no escribe)' : ''}`
    );

    let ok = 0;
    let fail = 0;
    for (let i = 0; i < pending.length; i++) {
      const lesson = pending[i];
      const tag = `[${i + 1}/${pending.length}] ${lesson.slug}`;
      try {
        const { hookEs, hookEn } = await generateHook(client, args.model, lesson);
        if (args.dryRun) {
          console.log(`${tag}\n  ES: ${hookEs}\n  EN: ${hookEn}`);
        } else {
          await prisma.lesson.update({
            where: { id: lesson.id },
            data: { hookEs, hookEn }
          });
          console.log(`${tag} ✓`);
        }
        ok++;
      } catch (e) {
        fail++;
        console.error(`${tag} ✗ ${e.message}`);
        if (e.code === 'insufficient_quota') break;
      }
    }

    console.log(`\nDONE. ok=${ok} fail=${fail}${args.dryRun ? ' (dry-run)' : ''}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('FAIL:', e.message);
  process.exit(1);
});
