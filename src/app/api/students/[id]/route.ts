import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/students/[id] — Epic 03.5.
 *
 * Borra un estudiante si y solo si:
 *   - El Parent autenticado es dueño (mismo familyId).
 *   - El Student NO tiene una Stripe subscription activa.
 *     Estados borrables: PENDING_PAYMENT sin stripeSubscriptionId,
 *     CANCELED, PAUSED. Si está ACTIVE/TRIALING/PAST_DUE el cliente
 *     debe primero cancelar via /api/billing/cancel-subscription para
 *     que Stripe dispare el webhook que pone CANCELED.
 *
 * Sin soft-delete en v1. Prisma `onDelete: Cascade` propaga a
 * LessonProgress, CoinEntry, EarnedBadge, TutorSession, TutorUsageDaily.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string) {
  return Response.json({ error: code }, { status });
}

const DELETABLE_STATUSES = new Set(['PENDING_PAYMENT', 'CANCELED', 'PAUSED']);

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parentId) return jsonError(401, 'unauthorized');

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: { familyId: true }
  });
  if (!parent) return jsonError(401, 'parent_not_found');

  const student = await prisma.student.findFirst({
    where: { id: params.id, familyId: parent.familyId },
    select: {
      id: true,
      subscriptionStatus: true,
      stripeSubscriptionId: true
    }
  });
  if (!student) return jsonError(404, 'student_not_found');

  if (!DELETABLE_STATUSES.has(student.subscriptionStatus)) {
    return jsonError(409, 'student_active_cancel_first');
  }
  // Defensive check: si CANCELED pero todavía tiene stripeSubscriptionId,
  // permitimos delete (Stripe webhook ya completó el ciclo).
  // PENDING_PAYMENT con stripeSubscriptionId: bloqueamos (significa que
  // hay un cobro pendiente — el padre debe cancelar primero).
  if (
    student.subscriptionStatus === 'PENDING_PAYMENT' &&
    student.stripeSubscriptionId
  ) {
    return jsonError(409, 'student_pending_cancel_first');
  }

  await prisma.student.delete({ where: { id: student.id } });
  return Response.json({ ok: true });
}
