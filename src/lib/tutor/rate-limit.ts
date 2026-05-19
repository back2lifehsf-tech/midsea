import 'server-only';
import { prisma } from '@/lib/prisma';

/**
 * Rate limit suave por estudiante. Epic 02 §1.7.
 *
 * Modelo: TutorUsageDaily (studentId, date UTC). Una fila por día.
 * Cap default: 50 msg / 24h. Configurable con TUTOR_DAILY_MSG_CAP.
 *
 * Semántica:
 *   - `consumeOneOrThrow` hace upsert atómico que INCREMENTA siempre.
 *     Si tras incrementar el contador > cap, arroja RateLimitedError.
 *   - Es soft rate-limit: los intentos rechazados ya están contados,
 *     así que un estudiante que insiste no resetea su cuota. Acepable
 *     en v1 — Redis con sliding window viene en Epic 03+.
 *
 * Trade-off intencional: dos requests concurrentes en cap-1 pueden
 * ambos completar (la upsert es atómica pero el check post-increment
 * no lo es). Para v1 con 50 msg/día por niño, la prob de race es
 * insignificante.
 */

const DEFAULT_CAP = 50;

export function getDailyMsgCap(): number {
  const raw = process.env.TUTOR_DAILY_MSG_CAP;
  if (raw === undefined) return DEFAULT_CAP;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_CAP;
}

export function todayUtcDate(now = new Date()): Date {
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );
}

export class RateLimitedError extends Error {
  constructor(
    public readonly studentId: string,
    public readonly cap: number,
    public readonly count: number
  ) {
    super(`Rate limit reached for student ${studentId}: ${count}/${cap}`);
    this.name = 'RateLimitedError';
  }
}

export async function consumeOneOrThrow(
  studentId: string
): Promise<{ msgCount: number; cap: number }> {
  const cap = getDailyMsgCap();
  const date = todayUtcDate();

  const row = await prisma.tutorUsageDaily.upsert({
    where: { studentId_date: { studentId, date } },
    create: { studentId, date, msgCount: 1, tokensUsed: 0 },
    update: { msgCount: { increment: 1 } },
    select: { msgCount: true }
  });

  if (row.msgCount > cap) {
    throw new RateLimitedError(studentId, cap, row.msgCount);
  }
  return { msgCount: row.msgCount, cap };
}

export async function recordTokens(
  studentId: string,
  tokens: number
): Promise<void> {
  if (tokens <= 0) return;
  const date = todayUtcDate();
  // No upsert — la fila ya debe existir porque consumeOneOrThrow corrió antes.
  // Si no existe (race extrema), prisma.update arroja P2025; lo ignoro: la
  // métrica de tokens es eventually-consistent, no la usamos para gating.
  try {
    await prisma.tutorUsageDaily.update({
      where: { studentId_date: { studentId, date } },
      data: { tokensUsed: { increment: tokens } }
    });
  } catch {
    /* swallow: telemetry-only */
  }
}
