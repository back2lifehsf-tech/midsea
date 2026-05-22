/**
 * POST /api/parent/students/[id]/enrollments — Epic 04 Tarea 6.
 *
 * El Parent activa un Course para un Student suyo. Crea
 * StudentCourseEnrollment (active=true). Si ya existe (active=false por
 * deactivate previo), reactiva.
 *
 * Body: `{ courseId: string }`.
 *
 * Auth: Parent autenticado debe ser dueño del Student (same familyId).
 * Course debe existir + `published=true`.
 *
 * No cobra. El plan Core incluye acceso ilimitado al catálogo (ADR-005 §4).
 * El padre decide qué cursos activar por hijo sin costo adicional.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { z } from 'zod';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

const BodySchema = z.object({
  courseId: z.string().min(1)
});

function jsonError(status: number, code: string) {
  return NextResponse.json({ error: code }, { status });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parentId) return jsonError(401, 'unauthorized');

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');
  const { courseId } = parsed.data;

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: { id: true, familyId: true }
  });
  if (!parent) return jsonError(401, 'parent_not_found');

  // Verifica ownership: estudiante existe + pertenece a misma familia.
  const student = await prisma.student.findFirst({
    where: { id: params.id, familyId: parent.familyId },
    select: { id: true }
  });
  if (!student) return jsonError(404, 'student_not_found');

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, published: true, slug: true }
  });
  if (!course) return jsonError(404, 'course_not_found');
  if (!course.published) return jsonError(409, 'course_not_published');

  // Upsert: si existe enrollment inactivo lo reactiva; si no existe lo crea.
  const enrollment = await prisma.studentCourseEnrollment.upsert({
    where: {
      studentId_courseId: { studentId: student.id, courseId: course.id }
    },
    create: {
      studentId: student.id,
      courseId: course.id,
      activatedByParentId: parent.id,
      active: true
    },
    update: {
      active: true,
      activatedAt: new Date(),
      activatedByParentId: parent.id,
      deactivatedAt: null
    }
  });

  return NextResponse.json({
    id: enrollment.id,
    courseId: enrollment.courseId,
    courseSlug: course.slug,
    active: enrollment.active,
    activatedAt: enrollment.activatedAt.toISOString()
  });
}
