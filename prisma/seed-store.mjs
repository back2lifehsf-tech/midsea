#!/usr/bin/env node
/**
 * Seed de StoreItems de ejemplo para la Tienda Coin (Mejora 9 / ADR-004).
 *
 * Idempotente: upsert por `id` estable. Re-correr no duplica.
 *
 * Uso:
 *   node prisma/seed-store.mjs            // usa DATABASE_URL de .env.local
 *   node prisma/seed-store.mjs --url=...  // override explícito
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveUrl() {
  const arg = process.argv.find((a) => a.startsWith('--url='));
  if (arg) return arg.split('=')[1];
  const envPath = path.join(__dirname, '..', '.env.local');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.*)$/);
    if (m) return m[1].replace(/^"|"$/g, '').replace(/\r$/, '');
  }
  throw new Error('DATABASE_URL no encontrado en .env.local (o pasá --url=)');
}

const ITEMS = [
  {
    id: 'store-masterclass-essay',
    titleEs: 'Masterclass: Escritura de Ensayos',
    titleEn: 'Masterclass: Essay Writing',
    descriptionEs:
      'Técnicas avanzadas para estructurar, argumentar y pulir ensayos académicos con claridad y voz propia.',
    descriptionEn:
      'Advanced techniques to structure, argue and polish academic essays with clarity and your own voice.',
    coinPrice: 800,
    type: 'MASTERCLASS',
    courseSlug: null,
    imageUrl: null
  },
  {
    id: 'store-elective-astronomy',
    titleEs: 'Electivo: Astronomía',
    titleEn: 'Elective: Astronomy',
    descriptionEs:
      'Un recorrido por el cosmos: estrellas, galaxias y el lugar del ser humano frente a la inmensidad de la creación.',
    descriptionEn:
      'A journey through the cosmos: stars, galaxies and humanity’s place before the vastness of creation.',
    coinPrice: 1200,
    type: 'ELECTIVE',
    courseSlug: null,
    imageUrl: null
  },
  {
    id: 'store-course-art-history',
    titleEs: 'Historia del Arte',
    titleEn: 'Art History',
    descriptionEs:
      'Exploración visual de los grandes movimientos artísticos, de los íconos bizantinos al arte contemporáneo.',
    descriptionEn:
      'A visual exploration of the great artistic movements, from Byzantine icons to contemporary art.',
    coinPrice: 1500,
    type: 'COURSE',
    courseSlug: null,
    imageUrl: null
  }
];

async function main() {
  const prisma = new PrismaClient({ datasources: { db: { url: resolveUrl() } } });
  try {
    for (const item of ITEMS) {
      const { id, ...data } = item;
      await prisma.storeItem.upsert({
        where: { id },
        create: { id, ...data },
        update: data
      });
      console.log(' ok:', id, `(${data.coinPrice} Coins)`);
    }
    const total = await prisma.storeItem.count();
    console.log(`\nDONE. StoreItem count: ${total}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
