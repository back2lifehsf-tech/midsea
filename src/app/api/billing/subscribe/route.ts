import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import {
  ensureCustomer,
  createStudentSubscription
} from '@/lib/billing/stripe';
import { subscribeRequestSchema } from '@/lib/schemas/student';

/**
 * POST /api/billing/subscribe — Epic 03 §8.
 *
 * Body: `{ studentId }`. Asume que `/api/students/create` ya corrió y
 * el Student existe en `PENDING_PAYMENT` con planTier + billingCycle
 * seteados.
 *
 * Flow:
 *   1. Verifica que el Student pertenece al Parent de la sesión.
 *   2. ensureCustomer(parent) → stripeCustomerId.
 *   3. createStudentSubscription → subscription en `incomplete` +
 *      client_secret del PaymentIntent del invoice.
 *   4. Persiste stripeSubscriptionId + currentPeriodEnd en Student.
 *   5. Devuelve client_secret al cliente para que confirme con
 *      Stripe Payment Element.
 *
 * Si createStudentSubscription tira (ej. Family+annual o env missing),
 * dejamos el Student como PENDING_PAYMENT sin stripeSubscriptionId;
 * el padre puede reintentar más tarde.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonError(status: number, code: string, details?: unknown) {
  return Response.json(
    { error: code, ...(details ? { details } : {}) },
    { status }
  );
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
  const parsed = subscribeRequestSchema.safeParse(raw);
  if (!parsed.success) return jsonError(400, 'invalid_body');

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: {
      id: true,
      email: true,
      name: true,
      familyId: true,
      stripeCustomerId: true
    }
  });
  if (!parent) return jsonError(401, 'parent_not_found');

  const student = await prisma.student.findFirst({
    where: { id: parsed.data.studentId, familyId: parent.familyId },
    select: {
      id: true,
      planTier: true,
      billingCycle: true,
      stripeSubscriptionId: true
    }
  });
  if (!student) return jsonError(404, 'student_not_found');
  if (!student.planTier || !student.billingCycle) {
    return jsonError(400, 'student_missing_plan');
  }
  if (student.stripeSubscriptionId) {
    // Idempotencia simple: si ya hay sub, no duplicamos. El cliente
    // debería re-leer el clientSecret previo si lo perdió — punt UX
    // a Epic 04 (retry button).
    return jsonError(409, 'subscription_exists');
  }

  let customerId: string;
  try {
    customerId = await ensureCustomer(parent);
  } catch (e) {
    console.error('[billing] ensureCustomer failed:', e);
    return jsonError(500, 'customer_setup_failed');
  }

  let sub;
  try {
    sub = await createStudentSubscription({
      customerId,
      plan: student.planTier,
      cycle: student.billingCycle,
      studentId: student.id
    });
  } catch (e) {
    console.error('[billing] createStudentSubscription failed:', e);
    return jsonError(500, 'subscription_create_failed');
  }

  await prisma.student.update({
    where: { id: student.id },
    data: {
      stripeSubscriptionId: sub.subscriptionId,
      currentPeriodEnd: sub.currentPeriodEnd,
      subscriptionStatus: sub.status
    }
  });

  return Response.json({
    subscriptionId: sub.subscriptionId,
    clientSecret: sub.clientSecret,
    amountCents: sub.amountCents
  });
}
