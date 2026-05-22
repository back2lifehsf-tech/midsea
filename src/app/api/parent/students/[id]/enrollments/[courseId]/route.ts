/**
 * DELETE /api/parent/students/[id]/enrollments/[courseId] — Epic 04 Tarea 6.
 *
 * Deactivate (soft) — pone `active=false` + `deactivatedAt=now`. NO borra
 * la fila ni el progress del estudiante para que si el padre re-activa
 * más tarde, el LessonProgress + Coin ganado se conserva. Esto es
 * conscientemente distinto del DELETE de Student (Epic 03.5) que sí es
 * cascada destructiva.
 *
 * Auth: Parent autenticado debe ser dueño del Student.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; courseId: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parentId) return jsonError(401, 'unauthorized');

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: { id: true, familyId: true }
  });
  if (!parent) return jsonError(401, 'parent_not_found');

  const student = await prisma.student.findFirst({
    where: { id: params.id, familyId: parent.familyId },
    select: { id: true }
  });
  if (!student) return jsonError(404, 'student_not_found');

  const enrollment = await prisma.studentCourseEnrollment.findUnique({
    where: {
      studentId_courseId: { studentId: student.id, courseId: params.courseId }
    }
  });
  if (!enrollment) return jsonError(404, 'enrollment_not_found');
  if (!enrollment.active) return jsonError(409, 'already_inactive');

  await prisma.studentCourseEnrollment.update({
    where: { id: enrollment.id },
    data: {
      active: false,
      deactivatedAt: new Date()
    }
  });

  return NextResponse.json({ ok: true });
}
