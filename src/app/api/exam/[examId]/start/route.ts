/**
 * POST /api/exam/[examId]/start — Inicia un ExamAttempt.
 * Crea el registro IN_PROGRESS. Si ya hay un intento IN_PROGRESS, lo retorna.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) return jsonError(401, 'unauthorized');
  const studentId = session.user.studentId;

  const exam = await prisma.exam.findUnique({
    where: { id: params.examId },
    include: { questions: { select: { id: true } } }
  });
  if (!exam) return jsonError(404, 'exam_not_found');

  // Reusar intento IN_PROGRESS si existe
  const existing = await prisma.examAttempt.findFirst({
    where: { examId: exam.id, studentId, status: 'IN_PROGRESS' }
  });
  if (existing) {
    return NextResponse.json({ attemptId: existing.id });
  }

  const attempt = await prisma.examAttempt.create({
    data: {
      examId: exam.id,
      studentId,
      status: 'IN_PROGRESS',
      answers: []
    }
  });

  return NextResponse.json({ attemptId: attempt.id });
}
