import 'server-only';
import { prisma } from '@/lib/prisma';
import { Prisma, type Locale } from '@prisma/client';
import type { TutorMessageDto, TutorRole } from './types';

/**
 * Manejo de TutorSession + TutorMessage para la conversación activa.
 * Epic 02 §1, decisión técnica §3:
 *   - Una sesión por día calendario UTC por estudiante.
 *   - Mensajes user y assistant se persisten en orden de llegada.
 *   - El assistant se persiste UNA vez al cerrar el stream, con el texto
 *     completo (no chunk por chunk).
 *
 * UTC vs locale del usuario: usamos UTC para que la frontera de "día"
 * sea consistente entre regiones. Trade-off conocido: un estudiante en
 * Asia que empieza a las 23:30 local puede ver el corte a las 00:00 UTC
 * dentro de su sesión. No es bloqueante en v1; lo revisitamos cuando
 * tengamos métricas reales de uso por timezone.
 */

function todayUtcRange(now = new Date()): { start: Date; end: Date } {
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export async function getOrCreateTodaysSession(
  studentId: string,
  locale: Locale
): Promise<{ id: string; createdAt: Date; locale: Locale }> {
  const { start, end } = todayUtcRange();
  const existing = await prisma.tutorSession.findFirst({
    where: {
      studentId,
      createdAt: { gte: start, lt: end }
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true, createdAt: true, locale: true }
  });
  if (existing) return existing;

  return prisma.tutorSession.create({
    data: { studentId, locale },
    select: { id: true, createdAt: true, locale: true }
  });
}

export async function appendUserMessage(
  sessionId: string,
  content: string
): Promise<TutorMessageDto> {
  const row = await prisma.tutorMessage.create({
    data: { sessionId, role: 'user', content },
    select: { id: true, role: true, content: true, createdAt: true }
  });
  return {
    id: row.id,
    role: row.role as TutorRole,
    content: row.content,
    createdAt: row.createdAt
  };
}

/**
 * Persistir respuesta de Angela. `metadata` (tokens, modelo, latencia)
 * va a la columna JSONB `TutorMessage.metadata` que Epic 02 §3 agregó.
 * Llave libre — extensible sin nueva migration.
 */
export async function appendAssistantMessage(
  sessionId: string,
  content: string,
  metadata?: Record<string, unknown>
): Promise<TutorMessageDto> {
  const row = await prisma.tutorMessage.create({
    data: {
      sessionId,
      role: 'assistant',
      content,
      // Prisma acepta null o InputJsonValue. undefined = no escribe; null borraría.
      // Cast a InputJsonValue: confiamos en el caller para pasar payloads
      // serializables (números, strings, objetos planos).
      metadata: (metadata as Prisma.InputJsonValue | undefined) ?? undefined
    },
    select: { id: true, role: true, content: true, createdAt: true }
  });
  return {
    id: row.id,
    role: row.role as TutorRole,
    content: row.content,
    createdAt: row.createdAt
  };
}

export async function getMessagesForSession(
  sessionId: string
): Promise<TutorMessageDto[]> {
  const rows = await prisma.tutorMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, role: true, content: true, createdAt: true }
  });
  return rows.map((m) => ({
    id: m.id,
    role: m.role as TutorRole,
    content: m.content,
    createdAt: m.createdAt
  }));
}

/** Export interno para tests. */
export const __test = { todayUtcRange };
