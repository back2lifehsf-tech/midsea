import 'server-only';
import { prisma } from '@/lib/prisma';
import type { StudentTutorContext, TutorMessageDto, TutorRole } from './types';

/**
 * Carga el contexto persistente del estudiante para Angela. Epic 02 §1.
 *
 * Devuelve identidad mínima (nombre, grado, locale) + los últimos N mensajes
 * que el estudiante haya tenido con Angela en CUALQUIER sesión previa.
 *
 * El prepend de estos mensajes al historial de la conversación activa es
 * lo que hace que Angela tenga "memoria entre días" — la antítesis de Max
 * AI de Wited (DMP §2.2). Sin embedding/RAG en v1: cargar literal los
 * últimos N basta para grados K-6 con sesiones cortas.
 *
 * Pesos a balancear si crecemos HISTORY_LIMIT:
 *   - Tokens al modelo (cada mensaje ~30-80 tokens promedio).
 *   - Latencia de query (índice (sessionId,createdAt) ya existe pero
 *     filtramos por student → escaneo de la relación).
 *   - Relevancia: mensajes de hace 3 semanas pueden confundir el contexto.
 *     Si llega a doler, agregamos `createdAt: { gte: <14d ago> }` aquí.
 */
export const HISTORY_LIMIT = 20;

export async function loadStudentTutorContext(
  studentId: string
): Promise<StudentTutorContext> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    select: {
      id: true,
      displayName: true,
      gradeLevel: true,
      preferredLocale: true
    }
  });
  if (!student) {
    throw new Error(`Student not found: ${studentId}`);
  }

  const rows = await prisma.tutorMessage.findMany({
    where: { session: { studentId } },
    orderBy: { createdAt: 'desc' },
    take: HISTORY_LIMIT,
    select: { id: true, role: true, content: true, createdAt: true }
  });

  // El query trae desc para tomar los más recientes; lo invierto para que
  // el caller reciba orden cronológico (más viejo → más nuevo), que es lo
  // que OpenAI espera en el array `messages`.
  const recentMessages: TutorMessageDto[] = rows.reverse().map((m) => ({
    id: m.id,
    role: m.role as TutorRole,
    content: m.content,
    createdAt: m.createdAt
  }));

  return {
    student: {
      id: student.id,
      displayName: student.displayName,
      gradeLevel: student.gradeLevel,
      locale: student.preferredLocale
    },
    recentMessages
  };
}
