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
 * Comportamiento v1: **cancelación inmediata** vía `stripe.subscriptions.cancel`.
 * Stripe marca el sub como `canceled`, el `mapStripeStatusToPrisma` lo
 * traduce a `CANCELED`, y la tarjeta queda visualmente actualizada al
 * instante. El padre puede luego click "Eliminar" para borrar el
 * registro.
 *
 * Trade-off conocido: el padre pierde los días restantes del período
 * pagado. Aceptable en test mode + pilot beta. Para production real
 * deberíamos restaurar `cancel_at_period_end: true` + columna
 * `cancelAtPeriodEnd` + banner "Se cancela el {date}" + endpoint de
 * reactivar. Punteado a Pendiente Epic 04 (requiere migration).
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
    const canceled = await stripe.subscriptions.cancel(
      student.stripeSubscriptionId
    );
    await prisma.student.update({
      where: { id: student.id },
      data: {
        subscriptionStatus: mapStripeStatusToPrisma(canceled.status)
      }
    });
    return Response.json({ ok: true });
  } catch (e) {
    console.error('[billing] cancel-subscription failed:', e);
    return jsonError(500, 'cancel_failed');
  }
}
