/**
 * Lectura de variables desde .env.local sin levantar Next.
 *
 * No usa dotenv para mantenerse zero-dep. Lee .env.local del repo root
 * y fusiona con process.env (process.env gana).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function loadEnv() {
  const out = { ...process.env };
  const p = path.join(__dirname, '..', '..', '.env.local');
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    const key = m[1];
    const value = m[2].replace(/^"|"$/g, '').replace(/\r$/, '');
    // process.env wins (lo definido en shell sobreescribe .env.local).
    if (out[key] === undefined) out[key] = value;
  }
  return out;
}

export function repoRoot() {
  return path.resolve(__dirname, '..', '..');
}
