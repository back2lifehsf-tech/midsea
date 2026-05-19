// Seed idempotente para desarrollo local. Corre con:
//   npx prisma db seed
// (requiere DATABASE_URL en .env y schema aplicado).
//
// Epic 01 §5 — credenciales determinísticas:
//   parent  → email demo@midsea.test  password demo1234
//   student → Sofía (gr3, PIN 1234, avatar fox)
//   student → Mateo (gr5, PIN 5678, avatar owl)

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

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

  // 3) Family + Parent demo. Credenciales fijas para dev (Epic 01 §5):
  //    email: demo@midsea.test · password: demo1234
  const demoParentEmail = 'demo@midsea.test';
  const demoParentPasswordHash = await bcrypt.hash('demo1234', SALT_ROUNDS);
  let demoParent = await prisma.parent.findUnique({ where: { email: demoParentEmail } });
  if (!demoParent) {
    const family = await prisma.family.create({
      data: { name: 'Familia Demo', locale: 'es' }
    });
    demoParent = await prisma.parent.create({
      data: {
        email: demoParentEmail,
        name: 'Demo Parent',
        passwordHash: demoParentPasswordHash,
        familyId: family.id
      }
    });
  } else {
    // Asegurar que el passwordHash esté actualizado (si el seed corrió antes de
    // Epic 01 sin password).
    if (!demoParent.passwordHash) {
      await prisma.parent.update({
        where: { id: demoParent.id },
        data: { passwordHash: demoParentPasswordHash }
      });
    }
  }

  // 4) Students con PIN + avatar. Epic 01 DoD:
  //    Sofía (gr3, PIN 1234, fox) y Mateo (gr5, PIN 5678, owl).
  const sofiaPinHash = await bcrypt.hash('1234', SALT_ROUNDS);
  const mateoPinHash = await bcrypt.hash('5678', SALT_ROUNDS);

  const sofia = await upsertStudent(demoParent.familyId, {
    displayName: 'Sofía',
    birthDate: new Date('2017-06-15'),
    gradeLevel: 3,
    preferredLocale: 'es',
    pinHash: sofiaPinHash,
    avatarKey: 'fox'
  });
  await upsertStudent(demoParent.familyId, {
    displayName: 'Mateo',
    birthDate: new Date('2015-03-10'),
    gradeLevel: 5,
    preferredLocale: 'es',
    pinHash: mateoPinHash,
    avatarKey: 'owl'
  });

  // 5) LessonProgress de Sofía — replica el estado del shell.
  const sofiaProgress = [
    { slug: 'improper-fractions', status: 'IN_PROGRESS', masteryPct: 45, attempts: 1 },
    { slug: 'addition-with-carrying', status: 'MASTERED', masteryPct: 92, attempts: 2 },
    { slug: 'treasure-island-ch-3', status: 'AVAILABLE', masteryPct: 0, attempts: 0 },
    { slug: 'water-cycle', status: 'AVAILABLE', masteryPct: 0, attempts: 0 }
  ];
  for (const p of sofiaProgress) {
    const lesson = await prisma.lesson.findUnique({ where: { slug: p.slug } });
    if (!lesson) continue;
    await prisma.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId: sofia.id, lessonId: lesson.id } },
      create: {
        studentId: sofia.id,
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
    where: { studentId: sofia.id }
  });
  if (existingEntries === 0) {
    const masteredLesson = await prisma.lesson.findUnique({
      where: { slug: 'addition-with-carrying' }
    });
    await prisma.nexosEntry.create({
      data: {
        studentId: sofia.id,
        amount: 100,
        reason: 'LESSON_MASTERY',
        refId: masteredLesson?.id,
        note: 'Sumas con llevadas — mastery 92%'
      }
    });
    for (let i = 0; i < 11; i++) {
      await prisma.nexosEntry.create({
        data: {
          studentId: sofia.id,
          amount: 100,
          reason: 'LESSON_MASTERY',
          note: `Lección histórica #${i + 1}`
        }
      });
    }
    await prisma.nexosEntry.create({
      data: {
        studentId: sofia.id,
        amount: 40,
        reason: 'STREAK',
        note: 'Racha de 5 días'
      }
    });
  }

  // 7) EarnedBadge — Sofía gana "first-lesson".
  const firstLessonBadge = await prisma.badge.findUnique({
    where: { code: 'first-lesson' }
  });
  if (firstLessonBadge) {
    await prisma.earnedBadge.upsert({
      where: {
        studentId_badgeId: { studentId: sofia.id, badgeId: firstLessonBadge.id }
      },
      create: { studentId: sofia.id, badgeId: firstLessonBadge.id },
      update: {}
    });
  }

  console.log('Seed completo:');
  console.log(`  ${lessons.length} lessons (upsert por slug)`);
  console.log(`  ${badges.length} badges (upsert por code)`);
  console.log(`  1 family "Familia Demo" + 1 parent ${demoParentEmail} (pwd: demo1234)`);
  console.log(`  Sofía  (gr3, PIN 1234, avatar fox)`);
  console.log(`  Mateo  (gr5, PIN 5678, avatar owl)`);
  console.log(`  Sofía: 4 LessonProgress, ~13 NexosEntry (total 1240), 1 EarnedBadge`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
