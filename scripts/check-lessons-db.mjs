import { loadEnv } from './lib/env.mjs';
const env = loadEnv();
for (const [k, v] of Object.entries(env)) {
  if (process.env[k] === undefined) process.env[k] = v;
}

import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const total = await p.lesson.count();
console.log('Total lessons en DB:', total);

// Math-grade-9 Month 1: slug pattern arg-math-g09-m01-*
const m1 = await p.lesson.findMany({
  where: { slug: { startsWith: 'arg-math-g09-m01-' } },
  orderBy: { orderIndex: 'asc' },
  select: { slug: true, titleEs: true, hookEs: true }
});
console.log(`\nmath-grade-9 Mes 1: ${m1.length} lecciones`);
m1.forEach(l => {
  const hook = l.hookEs ? '✓hook' : '✗hook';
  console.log(`  ${hook} | ${l.slug} | ${l.titleEs?.slice(0, 55)}`);
});

await p.$disconnect();
