/**
 * GET /api/exam/[examId] — Datos del examen para la página take.
 * NO expone correctAnswer ni explanations al cliente.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: { examId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.studentId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const exam = await prisma.exam.findUnique({
    where: { id: params.examId },
    select: {
      id: true,
      titleEs: true,
      titleEn: true,
      timeLimitMin: true,
      passingPct: true,
      coinReward: true,
      type: true,
      monthIndex: true,
      questions: {
        orderBy: { orderIndex: 'asc' },
        select: {
          id: true,
          orderIndex: true,
          type: true,
          stemEs: true,
          stemEn: true,
          options: true,
          points: true
          // NO exponer correctAnswer ni explanations al cliente
        }
      }
    }
  });

  if (!exam) return NextResponse.json({ error: 'exam_not_found' }, { status: 404 });

  return NextResponse.json(exam);
}
