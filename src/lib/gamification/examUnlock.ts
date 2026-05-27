/**
 * examUnlock.ts — Lógica de desbloqueo de exámenes (Mejora 13).
 *
 * Se llama desde el endpoint de quiz (POST /api/lessons/[slug]/quiz)
 * después de que el estudiante alcanza MASTERED en una lección.
 *
 * Retorna el examen desbloqueado si alguno se activó, o null.
 */
import { prisma } from '@/lib/prisma';
import type { Exam } from '@prisma/client';

export async function checkAndUnlockExams(
  studentId: string,
  lessonId: string
): Promise<{ unlockedExam: Exam | null }> {
  // 1. Obtener la lección para saber courseId y monthIndex
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { courseId: true, monthIndex: true }
  });
  if (!lesson?.courseId || !lesson?.monthIndex) return { unlockedExam: null };

  const { courseId, monthIndex } = lesson;

  // 2. ¿El estudiante está enrolled en este curso?
  const enrollment = await prisma.studentCourseEnrollment.findFirst({
    where: { studentId, courseId, active: true }
  });
  if (!enrollment) return { unlockedExam: null };

  // 3. Contar total de lecciones del mes en el curso
  const totalInMonth = await prisma.lesson.count({
    where: { courseId, monthIndex }
  });

  // 4. Contar cuántas tiene MASTERED el estudiante en ese mes
  const masteredInMonth = await prisma.lessonProgress.count({
    where: {
      studentId,
      status: 'MASTERED',
      lesson: { courseId, monthIndex }
    }
  });

  if (masteredInMonth < totalInMonth) return { unlockedExam: null };

  // 5. Buscar el Examen Mensual para ese mes
  const monthlyExam = await prisma.exam.findUnique({
    where: {
      courseId_type_monthIndex: { courseId, type: 'MONTHLY', monthIndex }
    }
  });
  if (!monthlyExam) return { unlockedExam: null };

  // 6. Verificar si ya tiene intento (ya estaba desbloqueado)
  const existingAttempt = await prisma.examAttempt.findFirst({
    where: { examId: monthlyExam.id, studentId }
  });
  if (existingAttempt) return { unlockedExam: null };

  // 7. Verificar si deberíamos también desbloquear MIDTERM o FINAL
  // (se evalúan por separado — aquí solo retornamos el MONTHLY)
  return { unlockedExam: monthlyExam };
}

/**
 * Verificar si el MIDTERM se desbloquea para un estudiante en un curso.
 * Condición: los ExamAttempts MONTHLY de los primeros 5 meses están PASSED.
 */
export async function checkMidtermUnlock(
  studentId: string,
  courseId: string
): Promise<{ unlockedExam: Exam | null }> {
  const midterm = await prisma.exam.findFirst({
    where: { courseId, type: 'MIDTERM', monthIndex: null }
  });
  if (!midterm) return { unlockedExam: null };

  const existingAttempt = await prisma.examAttempt.findFirst({
    where: { examId: midterm.id, studentId }
  });
  if (existingAttempt) return { unlockedExam: null };

  // Buscar los monthly exams de meses 1-5
  const monthlyExams = await prisma.exam.findMany({
    where: { courseId, type: 'MONTHLY', monthIndex: { gte: 1, lte: 5 } }
  });
  if (monthlyExams.length < 5) return { unlockedExam: null };

  const passedMonthlyIds = await Promise.all(
    monthlyExams.map(async (exam) => {
      const attempt = await prisma.examAttempt.findFirst({
        where: { examId: exam.id, studentId, passed: true }
      });
      return attempt ? exam.id : null;
    })
  );

  if (passedMonthlyIds.some((id) => id === null)) return { unlockedExam: null };

  return { unlockedExam: midterm };
}

/**
 * Verificar si el FINAL se desbloquea.
 * Condición: todos los monthly exams + midterm passed.
 */
export async function checkFinalUnlock(
  studentId: string,
  courseId: string
): Promise<{ unlockedExam: Exam | null }> {
  const finalExam = await prisma.exam.findFirst({
    where: { courseId, type: 'FINAL' }
  });
  if (!finalExam) return { unlockedExam: null };

  const existingAttempt = await prisma.examAttempt.findFirst({
    where: { examId: finalExam.id, studentId }
  });
  if (existingAttempt) return { unlockedExam: null };

  const allMonthlyExams = await prisma.exam.findMany({
    where: { courseId, type: 'MONTHLY' }
  });
  const midtermExam = await prisma.exam.findFirst({
    where: { courseId, type: 'MIDTERM' }
  });

  const examsToCheck = midtermExam
    ? [...allMonthlyExams, midtermExam]
    : allMonthlyExams;

  const allPassed = await Promise.all(
    examsToCheck.map(async (exam) => {
      const attempt = await prisma.examAttempt.findFirst({
        where: { examId: exam.id, studentId, passed: true }
      });
      return !!attempt;
    })
  );

  if (allPassed.some((p) => !p)) return { unlockedExam: null };

  return { unlockedExam: finalExam };
}
