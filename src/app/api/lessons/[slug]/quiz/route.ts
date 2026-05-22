/**
 * POST /api/lessons/[slug]/quiz — Epic 04 Tarea 5.
 *
 * Scoring autoritativo del quiz final de una leccion. Recibe respuestas
 * del estudiante por `questionId`, las compara contra `correctAnswer`
 * almacenado en `QuizQuestion`, computa mastery% y dispara reward de
 * Coin si:
 *   - mastery >=80% (gamification engine MASTERY_THRESHOLD)
 *   - es la primera vez que el estudiante alcanza mastery en esta leccion
 *     (idempotencia: no doble cobro si se reintenta despues de masterear)
 *
 * Side effects:
 *   - Upsert `LessonProgress` (attempts +1, status, masteryPct=max(prev,nueva))
 *   - Insert `CoinEntry` (reason=LESSON_MASTERY, refId=lessonId) si aplica
 *
 * Response:
 *   { correct, total, masteryPct, coinAwarded, newMasteryAchieved, perQuestion }
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { computeLessonReward, MASTERY_THRESHOLD } from '@/lib/gamification/engine';
import {
  scoreQuiz,
  type QuizQuestionShape,
  type StudentAnswer
} from '@/lib/learning/scoring';

const BodySchema = z.object({
  answers: z.record(z.string(), z.union([z.number().int(), z.string()]))
});

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) return jsonError(401, 'unauthorized');
  const studentId = session.user.studentId;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');
  const { answers } = parsed.data;

  // Load lesson + quiz questions.
  const lesson = await prisma.lesson.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      quizQuestions: {
        orderBy: { orderIndex: 'asc' },
        select: { id: true, type: true, correctAnswer: true }
      }
    }
  });
  if (!lesson) return jsonError(404, 'lesson_not_found');
  if (lesson.quizQuestions.length === 0) {
    return jsonError(409, 'no_quiz_questions');
  }

  const questions: QuizQuestionShape[] = lesson.quizQuestions.map((q) => ({
    id: q.id,
    type: q.type as QuizQuestionShape['type'],
    correctAnswer: q.correctAnswer as QuizQuestionShape['correctAnswer']
  }));
  const score = scoreQuiz(questions, answers as Record<string, StudentAnswer>);

  // Current progress
  const prev = await prisma.lessonProgress.findUnique({
    where: { studentId_lessonId: { studentId, lessonId: lesson.id } }
  });
  const prevAttempts = prev?.attempts ?? 0;
  const prevMastery = prev?.masteryPct ?? 0;
  const newAttempts = prevAttempts + 1;
  const newMasteryPct = Math.max(prevMastery, score.masteryPct);
  const newStatus =
    newMasteryPct >= MASTERY_THRESHOLD
      ? 'MASTERED'
      : newMasteryPct > 0
        ? 'IN_PROGRESS'
        : 'AVAILABLE';

  // Streak: por ahora se computa simple — dias consecutivos con
  // actividad. v1.1+ puede refinarse. Para Tarea 5 pasamos 0 a
  // computeLessonReward; el bonus de streak es enhancement futuro.
  const reward = computeLessonReward({
    masteryPct: score.masteryPct,
    attempts: newAttempts,
    streakDays: 0
  });

  // Coin solo se otorga la PRIMERA vez que se alcanza mastery.
  const newMasteryAchieved =
    prevMastery < MASTERY_THRESHOLD && score.masteryPct >= MASTERY_THRESHOLD;
  const coinToAward = newMasteryAchieved ? reward.granted : 0;

  await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { studentId_lessonId: { studentId, lessonId: lesson.id } },
      create: {
        studentId,
        lessonId: lesson.id,
        status: newStatus,
        masteryPct: newMasteryPct,
        attempts: newAttempts
      },
      update: {
        status: newStatus,
        masteryPct: newMasteryPct,
        attempts: newAttempts
      }
    });
    if (coinToAward > 0) {
      await tx.coinEntry.create({
        data: {
          studentId,
          amount: coinToAward,
          reason: 'LESSON_MASTERY',
          refId: lesson.id,
          note: `Quiz mastered ${score.masteryPct}%`
        }
      });
    }
  });

  return NextResponse.json({
    correct: score.correct,
    total: score.total,
    masteryPct: score.masteryPct,
    perQuestion: score.perQuestion,
    coinAwarded: coinToAward,
    newMasteryAchieved
  });
}
