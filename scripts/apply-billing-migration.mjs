#!/usr/bin/env node
/**
 * Aplica la migration billing (Epic 03) a la DB target.
 *
 * Uso:
 *   node scripts/apply-billing-migration.mjs --target=dev
 *   node scripts/apply-billing-migration.mjs --target=prod
 *   node scripts/apply-billing-migration.mjs --url=postgresql://...
 *
 * Razón de existir: el proyecto no usa Prisma migrations versionadas
 * (decisión Epic 01 pendiente formalizar). Para mantener DEV alineado
 * con código y permitir aplicar a PROD en el momento del merge a main,
 * tenemos un .sql versionado + este runner. Es idempotente (IF NOT
 * EXISTS / DO blocks), seguro de re-correr.
 *
 * URLs leídas:
 *   --target=dev  → .env.local DATABASE_URL (debe apuntar al pooler dev)
 *   --target=prod → user debe pasar --url=...  o setear DATABASE_URL_PROD
 *   --url=...     → override directo
 */
import fs from 'node:fs';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseArgs() {
  const out = { target: null, url: null, file: null };
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--target=')) out.target = a.split('=')[1];
    else if (a.startsWith('--url=')) out.url = a.split('=')[1];
    else if (a.startsWith('--file=')) out.file = a.split('=')[1];
  }
  return out;
}

function loadEnvLocal() {
  const p = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(p)) return {};
  const out = {};
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (m) out[m[1]] = m[2].replace(/^"|"$/g, '').replace(/\r$/, '');
  }
  return out;
}

function resolveUrl({ target, url }) {
  if (url) return url;
  if (target === 'dev') {
    const env = loadEnvLocal();
    if (!env.DATABASE_URL) {
      throw new Error(
        '--target=dev requires DATABASE_URL in .env.local (must point to dev pooler)'
      );
    }
    return env.DATABASE_URL;
  }
  if (target === 'prod') {
    const url = process.env.DATABASE_URL_PROD;
    if (!url) {
      throw new Error(
        '--target=prod requires DATABASE_URL_PROD env var (pass the prod pooler URL inline)'
      );
    }
    return url;
  }
  throw new Error('Pass --target=dev|prod or --url=...');
}

async function main() {
  const args = parseArgs();
  const url = resolveUrl(args);

  // Por compat con Epic 03, default al SQL del billing si --file no se
  // pasa. Para migrations posteriores (Epic 04+): --file=<path-rel-o-abs>.
  const fileArg =
    args.file ?? 'prisma/migrations/manual/0003-billing-tables.sql';
  const sqlPath = path.isAbsolute(fileArg)
    ? fileArg
    : path.join(__dirname, '..', fileArg);
  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('SQL file:', path.relative(path.join(__dirname, '..'), sqlPath));

  // Split en statements separados por `;` al final de línea, ignorando los
  // que están dentro de `DO $$ ... $$;` (Postgres dollar-quoted).
  // Comentarios mezclados con SQL: se mantienen — Postgres los ignora.
  // Sólo skipear statements 100% comentario/blanco.
  const isCommentOnly = (s) =>
    s.split('\n').every((l) => l.trim() === '' || l.trim().startsWith('--'));

  const statements = [];
  let buf = '';
  let inDollar = false;
  for (const line of sql.split(/\r?\n/)) {
    if (/\$\$/.test(line)) inDollar = !inDollar;
    buf += line + '\n';
    if (!inDollar && /;\s*(--.*)?$/.test(line.trim())) {
      const s = buf.trim();
      if (s && !isCommentOnly(s)) statements.push(s);
      buf = '';
    }
  }
  if (buf.trim() && !isCommentOnly(buf.trim())) statements.push(buf.trim());

  const targetLabel = args.target ?? '(explicit url)';
  console.log(`Applying ${statements.length} statements to ${targetLabel}...`);

  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    for (const stmt of statements) {
      const head = stmt.split('\n')[0].slice(0, 80);
      try {
        await prisma.$executeRawUnsafe(stmt);
        console.log(' ok:', head);
      } catch (e) {
        console.error(' FAIL:', head, '\n  ', (e.message || '').slice(0, 200));
        throw e;
      }
    }
    // Verify
    const r = await prisma.$queryRaw`select count(*)::int as n from "StripeWebhookEvent"`;
    console.log('Verify StripeWebhookEvent count:', r);
    console.log('\nDONE.');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
