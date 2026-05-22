import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { getStripe, mapStripeStatusToPrisma } from '@/lib/billing/stripe';

/**
 * POST /api/billing/cancel-subscription — Epic 03.5.
 *
 * Body: `{ studentId }`. El Parent autenticado debe ser dueño del Student.
 *
 * Comportamiento: `cancel_at_period_end: true`. El estudiante mantiene
 * acceso hasta `currentPeriodEnd`; en ese momento Stripe dispara
 * `customer.subscription.deleted` y el webhook actualiza
 * `subscriptionStatus = CANCELED`.
 *
 * Decisión de UX: NO hacemos cancelación inmediata. Si el padre pagó
 * por el mes corriente, el estudiante tiene derecho a ese período.
 * "Cancelar" significa "no me cobres el próximo mes".
 *
 * Reactivar (uncancel antes de period_end) queda como Pendiente Epic 04
 * — requiere otro endpoint + UI state distinto (CANCELED-pending vs
 * CANCELED-final).
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bodySchema = z.object({ studentId: z.string().min(1) });

function jsonError(status: number, code: string) {
  return Response.json({ error: code }, { status });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.parentId) return jsonError(401, 'unauthorized');

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return jsonError(400, 'invalid_json');
  }
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: { id: true, familyId: true }
  });
  if (!parent) return jsonError(401, 'parent_not_found');

  const student = await prisma.student.findFirst({
    where: { id: parsed.data.studentId, familyId: parent.familyId },
    select: { id: true, stripeSubscriptionId: true, subscriptionStatus: true }
  });
  if (!student) return jsonError(404, 'student_not_found');
  if (!student.stripeSubscriptionId) {
    return jsonError(400, 'no_active_subscription');
  }

  try {
    const stripe = getStripe();
    const updated = await stripe.subscriptions.update(
      student.stripeSubscriptionId,
      { cancel_at_period_end: true }
    );
    await prisma.student.update({
      where: { id: student.id },
      data: {
        subscriptionStatus: mapStripeStatusToPrisma(updated.status)
      }
    });
    return Response.json({
      ok: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd:
        (updated as unknown as { current_period_end?: number }).current_period_end ??
        updated.items.data[0]?.current_period_end ??
        null
    });
  } catch (e) {
    console.error('[billing] cancel-subscription failed:', e);
    return jsonError(500, 'cancel_failed');
  }
}
