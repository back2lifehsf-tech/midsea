#!/usr/bin/env node
/**
 * Seed del Catálogo HS Pilot Mínimo. Epic 04 Tarea 1 + ADR-003 §3.
 *
 * Inserta los 8 cursos del pilot en `Course`. Idempotente: upsert por
 * `slug` que ya es @unique. Re-correr no duplica.
 *
 * Uso:
 *   node prisma/seed-catalog.mjs                        # default dev DB via .env.local
 *   node prisma/seed-catalog.mjs --url=postgresql://... # explicit
 *
 * Fuente de verdad de los metadatos: docs/curriculum/midsea-hs-catalog.md.
 * Si cambia la fuente, actualizar este archivo y re-correr — el upsert
 * sobreescribe títulos/descripciones de los slugs ya existentes.
 *
 * Las competencias y lecciones NO se siembran acá. Esas vienen del
 * pipeline de generación (Tarea 2-4) parseando los outlines reales del
 * founder en docs/content/source/.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadDbUrl() {
  for (const a of process.argv.slice(2)) {
    if (a.startsWith('--url=')) return a.split('=')[1];
  }
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    throw new Error('No --url given and .env.local not found.');
  }
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^DATABASE_URL=(.*)$/);
    if (m) return m[1].replace(/^"|"$/g, '').replace(/\r$/, '');
  }
  throw new Error('DATABASE_URL not in .env.local.');
}

const COURSES = [
  {
    slug: 'math-grade-9',
    titleEs: 'Matemática — Grado 9°',
    titleEn: 'Mathematics — Grade 9',
    descriptionEs:
      'Fundamentos del razonamiento matemático de Secundaria: operaciones con números reales, ecuaciones de primer grado, funciones lineales, geometría plana, proporcionalidad. 4 días/semana × 4 horas diarias. Enfoque cristiano, analítico y aplicado.',
    descriptionEn:
      'Foundations of secondary mathematical reasoning: real number operations, first-degree equations, linear functions, plane geometry, proportionality. 4 days/week × 4 hours daily. Christian, analytical and applied approach.',
    subject: 'MATH',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 10
  },
  {
    slug: 'math-grade-10',
    titleEs: 'Matemática — Grado 10°',
    titleEn: 'Mathematics — Grade 10',
    descriptionEs:
      'Profundización: conjuntos y lógica, álgebra avanzada, ecuaciones cuadráticas, funciones cuadráticas y exponenciales, trigonometría, geometría espacial, estadística y probabilidad, modelización. 4 días/semana × 4 horas diarias. Enfoque cristiano, analítico y aplicado.',
    descriptionEn:
      'Deepening: sets and logic, advanced algebra, quadratic equations, quadratic and exponential functions, trigonometry, spatial geometry, statistics and probability, modeling. 4 days/week × 4 hours daily. Christian, analytical and applied approach.',
    subject: 'MATH',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 20
  },
  {
    slug: 'language-grade-9-10',
    titleEs: 'Lengua y Literatura — Grados 9°-10°',
    titleEn: 'Spanish Language and Literature — Grades 9-10',
    descriptionEs:
      'Comprensión lectora, narrativa, gramática avanzada, ortografía y estilo, textos informativos y expositivos, argumentación, ensayo, poesía y figuras retóricas, teatro y diálogo, periodismo, literatura. Lectura crítica de obras clásicas. 4 días/semana × 4 horas diarias. Enfoque cristiano, crítico y académico.',
    descriptionEn:
      'Reading comprehension, narrative, advanced grammar, spelling and style, informative and expository texts, argumentation, essay, poetry and rhetorical figures, theater and dialogue, journalism, literature. Critical reading of classic works. 4 days/week × 4 hours daily. Christian, critical and academic approach.',
    subject: 'LANGUAGE',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 30
  },
  {
    slug: 'english-esl-grade-9',
    titleEs: 'Inglés ESL — Grado 9° (A2)',
    titleEn: 'English ESL — Grade 9 (A2)',
    descriptionEs:
      'Inglés como segunda lengua para nivel A2 según CEFR. Vocabulario, gramática estructural básica, comprensión auditiva, expresión oral guiada, lectura de textos cortos. Día 4 de cada semana incluye reflexión con valores cristianos. 4 días/semana.',
    descriptionEn:
      'English as second language for CEFR A2 level. Vocabulary, basic structural grammar, listening comprehension, guided oral expression, short text reading. Day 4 of each week includes reflection with Christian values. 4 days/week.',
    subject: 'ENGLISH_ESL',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 40
  },
  {
    slug: 'english-esl-grade-10',
    titleEs: 'Inglés ESL — Grado 10° (A2+ / Transición a B1)',
    titleEn: 'English ESL — Grade 10 (A2+ / Transition to B1)',
    descriptionEs:
      'Inglés A2 consolidado con transición a B1. Comunicación académica básica, pasado-presente-futuro, identidad y metas, educación, vida diaria, salud, comunidad, opiniones, experiencias pasadas, planes futuros, lectura y escritura. Aplicación de valores cristianos en decisiones y comunicación. 4 días/semana.',
    descriptionEn:
      'Consolidated A2 with transition to B1. Basic academic communication, past-present-future, identity and goals, education, daily life, health, community, opinions, past experiences, future plans, reading and writing. Christian values applied to decision-making and communication. 4 days/week.',
    subject: 'ENGLISH_ESL',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 50
  },
  {
    slug: 'history-ancient-civ-2-grade-9-10',
    titleEs: 'Civilización Antigua II — Grados 9°-10°',
    titleEn: 'Ancient Civilization II — Grades 9-10',
    descriptionEs:
      'Continuidad histórica desde el mundo clásico hasta la transición medieval: Mundo Helenístico, Roma Antigua (República e Imperio), Cristianismo primitivo, Caída del Imperio Romano, Imperio Bizantino, Mundo Islámico medieval, Europa medieval temprana, Iglesia y cultura medieval. 4 días/semana × 1 hora diaria.',
    descriptionEn:
      'Historical continuity from the classical world to the medieval transition: Hellenistic World, Ancient Rome (Republic and Empire), Early Christianity, Fall of the Roman Empire, Byzantine Empire, Medieval Islamic World, Early Medieval Europe, Church and medieval culture. 4 days/week × 1 hour daily.',
    subject: 'HISTORY',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 60
  },
  {
    slug: 'science-biology-grade-9-10',
    titleEs: 'Biología — Grados 9°-10°',
    titleEn: 'Biology — Grades 9-10',
    descriptionEs:
      'Biología como ciencia, célula y organelos, membrana celular y metabolismo, mitosis y meiosis, genética y ADN, mutaciones y herencia, sistemas del cuerpo, ecología y biodiversidad, biotecnología y ética científica. Incluye experimentos reales (ósmosis, extracción de ADN). 4 días/semana × 4 horas diarias. Enfoque cristiano, científico y ético — integración fe y ciencia.',
    descriptionEn:
      'Biology as science, cell and organelles, cell membrane and metabolism, mitosis and meiosis, genetics and DNA, mutations and inheritance, body systems, ecology and biodiversity, biotechnology and scientific ethics. Includes real experiments (osmosis, DNA extraction). 4 days/week × 4 hours daily. Christian, scientific and ethical approach — faith and science integration.',
    subject: 'SCIENCE',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 70
  },
  {
    slug: 'music-grade-9',
    titleEs: 'Música — Grado 9°',
    titleEn: 'Music — Grade 9',
    descriptionEs:
      'Apreciación musical avanzada e introducción a la teoría: notación, escalas, ritmo y métrica, formas musicales, géneros, instrumentos clásicos y populares, historia de la música, repertorio sagrado y secular. 2 días/semana.',
    descriptionEn:
      'Advanced musical appreciation and introduction to theory: notation, scales, rhythm and meter, musical forms, genres, classical and popular instruments, music history, sacred and secular repertoire. 2 days/week.',
    subject: 'MUSIC',
    gradeBand: 'CICLO_BASICO',
    orderIndex: 80
  }
];

async function main() {
  const url = loadDbUrl();
  const prisma = new PrismaClient({ datasources: { db: { url } } });
  try {
    for (const c of COURSES) {
      const result = await prisma.course.upsert({
        where: { slug: c.slug },
        create: { ...c, published: true },
        update: {
          titleEs: c.titleEs,
          titleEn: c.titleEn,
          descriptionEs: c.descriptionEs,
          descriptionEn: c.descriptionEn,
          subject: c.subject,
          gradeBand: c.gradeBand,
          orderIndex: c.orderIndex,
          published: true
        }
      });
      console.log(`✓ ${c.slug}  (id=${result.id})`);
    }
    const count = await prisma.course.count();
    console.log(`\nDONE — Course count in DB: ${count}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
