// Seed idempotente para desarrollo local. Corre con:
//   npx prisma db seed
// (requiere DATABASE_URL en .env y migraciones aplicadas).
//
// Source of truth para slugs/titulos: src/lib/demo/lessons.ts.
// Mantenemos esto en sync para que el shell del estudiante siga renderizando
// los mismos contenidos cuando lo cableemos a DB.

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const lessons = [
  {
    slug: 'addition-with-carrying',
    subject: 'MATH',
    gradeLevel: 3,
    titleEs: 'Sumas con llevadas',
    titleEn: 'Addition with carrying',
    summaryEs: 'Suma de números de dos y tres dígitos llevando al siguiente lugar.',
    summaryEn: 'Add two- and three-digit numbers carrying to the next place.',
    estMinutes: 10,
    rewardNexos: 100,
    orderIndex: 0
  },
  {
    slug: 'improper-fractions',
    subject: 'MATH',
    gradeLevel: 3,
    titleEs: 'Fracciones impropias',
    titleEn: 'Improper fractions',
    summaryEs: 'Identifica fracciones impropias y conviértelas a números mixtos.',
    summaryEn: 'Identify improper fractions and convert them to mixed numbers.',
    estMinutes: 15,
    rewardNexos: 100,
    orderIndex: 1
  },
  {
    slug: 'treasure-island-ch-3',
    subject: 'LANGUAGE_ARTS',
    gradeLevel: 3,
    titleEs: 'Lectura: La isla del tesoro (cap. 3)',
    titleEn: 'Reading: Treasure Island (ch. 3)',
    summaryEs: 'Capítulo 3 con preguntas de comprensión y vocabulario.',
    summaryEn: 'Chapter 3 with comprehension questions and vocabulary.',
    estMinutes: 20,
    rewardNexos: 100,
    orderIndex: 2
  },
  {
    slug: 'water-cycle',
    subject: 'SCIENCE',
    gradeLevel: 3,
    titleEs: 'El ciclo del agua',
    titleEn: 'The water cycle',
    summaryEs: 'Evaporación, condensación, precipitación y colección.',
    summaryEn: 'Evaporation, condensation, precipitation and collection.',
    estMinutes: 12,
    rewardNexos: 100,
    orderIndex: 3
  }
];

const badges = [
  {
    code: 'first-lesson',
    nameEs: 'Primera lección',
    nameEn: 'First lesson',
    descriptionEs: '¡Dominaste tu primera lección!',
    descriptionEn: 'You mastered your first lesson!',
    iconKey: 'spark',
    rewardNexos: 50
  },
  {
    code: 'math-rookie',
    nameEs: 'Aprendiz de mates',
    nameEn: 'Math rookie',
    descriptionEs: 'Tres lecciones de matemáticas con dominio.',
    descriptionEn: 'Three math lessons mastered.',
    iconKey: 'compass',
    rewardNexos: 100
  }
];

async function upsertStudent(familyId, data) {
  // Student no tiene un unique natural; filtramos por familia+nombre para idempotencia.
  const existing = await prisma.student.findFirst({
    where: { familyId, displayName: data.displayName }
  });
  if (existing) {
    return prisma.student.update({
      where: { id: existing.id },
      data
    });
  }
  return prisma.student.create({ data: { ...data, familyId } });
}

async function main() {
  // 1) Lessons (upsert por slug)
  for (const l of lessons) {
    await prisma.lesson.upsert({
      where: { slug: l.slug },
      create: l,
      update: l
    });
  }

  // 2) Badges (upsert por code)
  for (const b of badges) {
    await prisma.badge.upsert({
      where: { code: b.code },
      create: b,
      update: b
    });
  }

  // 3) Family + Parent demo. Email placeholder para no chocar con cuentas Google
  // reales. El flujo de NextAuth.signIn crea Familys/Parents propios al iniciar
  // sesion con Google; este es solo el dataset de desarrollo local.
  const demoParentEmail = 'demo@midsea.local';
  let demoParent = await prisma.parent.findUnique({ where: { email: demoParentEmail } });
  if (!demoParent) {
    const family = await prisma.family.create({
      data: { name: 'Familia demo', locale: 'es' }
    });
    demoParent = await prisma.parent.create({
      data: {
        email: demoParentEmail,
        name: 'Padre Demo',
        familyId: family.id
      }
    });
  }

  // 4) Students — mismos nombres que el shell del parent overview.
  const lucia = await upsertStudent(demoParent.familyId, {
    displayName: 'Lucía',
    birthDate: new Date('2017-06-15'),
    gradeLevel: 3,
    preferredLocale: 'es'
  });
  await upsertStudent(demoParent.familyId, {
    displayName: 'Mateo',
    birthDate: new Date('2015-03-10'),
    gradeLevel: 5,
    preferredLocale: 'es'
  });

  // 5) LessonProgress de Lucía — replica el estado del shell.
  const luciaProgress = [
    { slug: 'improper-fractions', status: 'IN_PROGRESS', masteryPct: 45, attempts: 1 },
    { slug: 'addition-with-carrying', status: 'MASTERED', masteryPct: 92, attempts: 2 },
    { slug: 'treasure-island-ch-3', status: 'AVAILABLE', masteryPct: 0, attempts: 0 },
    { slug: 'water-cycle', status: 'AVAILABLE', masteryPct: 0, attempts: 0 }
  ];
  for (const p of luciaProgress) {
    const lesson = await prisma.lesson.findUnique({ where: { slug: p.slug } });
    if (!lesson) continue;
    await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId: lucia.id, lessonId: lesson.id } },
      create: {
        studentId: lucia.id,
        lessonId: lesson.id,
        status: p.status,
        masteryPct: p.masteryPct,
        attempts: p.attempts,
        lastAttempt: p.attempts > 0 ? new Date() : null
      },
      update: {
        status: p.status,
        masteryPct: p.masteryPct,
        attempts: p.attempts
      }
    });
  }

  // 6) NexosEntry — total 1240 para que coincida con el NexosBadge del shell.
  // 12 mastery x 100 + 1 streak x 40. Idempotente: solo si no hay entries.
  const existingEntries = await prisma.nexosEntry.count({
    where: { studentId: lucia.id }
  });
  if (existingEntries === 0) {
    const masteredLesson = await prisma.lesson.findUnique({
      where: { slug: 'addition-with-carrying' }
    });
    await prisma.nexosEntry.create({
      data: {
        studentId: lucia.id,
        amount: 100,
        reason: 'LESSON_MASTERY',
        refId: masteredLesson?.id,
        note: 'Sumas con llevadas — mastery 92%'
      }
    });
    for (let i = 0; i < 11; i++) {
      await prisma.nexosEntry.create({
        data: {
          studentId: lucia.id,
          amount: 100,
          reason: 'LESSON_MASTERY',
          note: `Lección histórica #${i + 1}`
        }
      });
    }
    await prisma.nexosEntry.create({
      data: {
        studentId: lucia.id,
        amount: 40,
        reason: 'STREAK',
        note: 'Racha de 5 días'
      }
    });
  }

  // 7) EarnedBadge — Lucía gana "first-lesson".
  const firstLessonBadge = await prisma.badge.findUnique({
    where: { code: 'first-lesson' }
  });
  if (firstLessonBadge) {
    await prisma.earnedBadge.upsert({
      where: {
        studentId_badgeId: { studentId: lucia.id, badgeId: firstLessonBadge.id }
      },
      create: { studentId: lucia.id, badgeId: firstLessonBadge.id },
      update: {}
    });
  }

  console.log('Seed completo:');
  console.log(`  ${lessons.length} lessons (upsert por slug)`);
  console.log(`  ${badges.length} badges (upsert por code)`);
  console.log(`  1 family + 1 parent (${demoParentEmail}) + 2 students (Lucía gr3, Mateo gr5)`);
  console.log(`  Lucía: 4 LessonProgress, ~13 NexosEntry (total 1240), 1 EarnedBadge`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
