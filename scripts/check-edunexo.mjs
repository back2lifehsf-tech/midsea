#!/usr/bin/env node
// Guarda contra el nombre viejo. CLAUDE.md regla de oro #1.
// Uso: node scripts/check-edunexo.mjs

import { readdir, readFile, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const SKIP_DIRS = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'out',
  'coverage'
]);
// Estos archivos mencionan el nombre viejo para PROHIBIRLO. No son violaciones.
const SKIP_FILES = new Set([
  'check-edunexo.mjs',
  'CLAUDE.md',
  'SKILL.md',
  'setup-guide.md',
  'package.json'
]);
// Subpaths que documentan reglas/protocolos (epic specs, retros) y que pueden
// referenciar el nombre viejo en contexto de prohibición. Match por path
// relativo desde la raíz, no por basename.
const SKIP_PATH_PREFIXES = ['docs/prompts/', 'docs\\prompts\\'];
const PATTERN = /edunexo/i;

let hits = 0;

async function walk(dir) {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full);
      continue;
    }
    if (SKIP_FILES.has(entry.name)) continue;
    const rel = relative(ROOT, full).replace(/\\/g, '/');
    if (SKIP_PATH_PREFIXES.some((p) => rel.startsWith(p.replace(/\\/g, '/')))) continue;
    const info = await stat(full);
    if (info.size > 2_000_000) continue;
    const content = await readFile(full, 'utf8').catch(() => '');
    const lines = content.split(/\r?\n/);
    lines.forEach((line, idx) => {
      if (PATTERN.test(line)) {
        hits += 1;
        console.log(`${relative(ROOT, full)}:${idx + 1}: ${line.trim()}`);
      }
    });
  }
}

await walk(ROOT);

if (hits > 0) {
  console.error(`\nEncontradas ${hits} referencias a EduNexo. CLAUDE.md regla #1 — limpia antes de commitear.`);
  process.exit(1);
} else {
  console.log('OK: cero referencias a EduNexo.');
}
