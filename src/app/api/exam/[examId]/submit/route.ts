/**
 * POST /api/exam/[examId]/submit — Gradea y cierra un ExamAttempt.
 *
 * Body: { attemptId: string, answers: { questionId: string, answer: string }[] }
 *
 * Side effects:
 *   - Actualiza ExamAttempt: status=GRADED, score, totalPoints, pctScore, passed, submittedAt
 *   - Si passed && !coinAwarded: crea CoinEntry(EXAM_PASS, coinReward)
 *   - Si !passed && !coinAwarded: crea CoinEntry(EXAM_PASS, consolationCoin) — consolación
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

const BodySchema = z.object({
  attemptId: z.string(),
  answers: z.array(z.object({
    questionId: z.string(),
    answer: z.string()
  }))
});

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) return jsonError(401, 'unauthorized');
  const studentId = session.user.studentId;

  let raw: unknown;
  try { raw = await req.json(); } catch { return jsonError(400, 'invalid_json'); }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');
  const { attemptId, answers } = parsed.data;

  // Cargar el examen con preguntas
  const exam = await prisma.exam.findUnique({
    where: { id: params.examId },
    include: {
      questions: {
        orderBy: { orderIndex: 'asc' },
        select: { id: true, correctAnswer: true, points: true, explanationEs: true }
      }
    }
  });
  if (!exam) return jsonError(404, 'exam_not_found');

  // Verificar que el intento pertenece al estudiante
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId } });
  if (!attempt || attempt.studentId !== studentId || attempt.examId !== exam.id) {
    return jsonError(403, 'forbidden');
  }
  if (attempt.status === 'GRADED') {
    return jsonError(409, 'already_graded');
  }

  // Gradear
  const answerMap = new Map(answers.map((a) => [a.questionId, a.answer]));
  let score = 0;
  let totalPoints = 0;
  const perQuestion: { questionId: string; correct: boolean; explanation: string | null }[] = [];

  for (const q of exam.questions) {
    totalPoints += q.points;
    const studentAnswer = (answerMap.get(q.id) ?? '').trim().toUpperCase();
    const correct = studentAnswer === q.correctAnswer.trim().toUpperCase();
    if (correct) score += q.points;
    perQuestion.push({ questionId: q.id, correct, explanation: q.explanationEs });
  }

  const pctScore = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
  const passed = pctScore >= exam.passingPct;

  const coinToAward = passed ? exam.coinReward : exam.consolationCoin;

  await prisma.$transaction(async (tx) => {
    await tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        status: 'GRADED',
        score,
        totalPoints,
        pctScore,
        passed,
        answers: answers as unknown as object[],
        submittedAt: new Date(),
        coinAwarded: true
      }
    });

    if (!attempt.coinAwarded) {
      await tx.coinEntry.create({
        data: {
          studentId,
          amount: coinToAward,
          reason: 'EXAM_PASS',
          refId: exam.id,
          note: `Exam ${exam.type} — ${pctScore}%`
        }
      });
    }
  });

  return NextResponse.json({
    pctScore,
    passed,
    coinEarned: attempt.coinAwarded ? 0 : coinToAward,
    perQuestion,
    attemptId
  });
}
