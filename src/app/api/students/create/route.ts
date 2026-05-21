import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/options';
import { prisma } from '@/lib/prisma';
import { studentCreateSchema } from '@/lib/schemas/student';
import { getDisplayPlan, type Plan } from '@/lib/pricing/plans';

/**
 * POST /api/students/create — Epic 03 §8.
 *
 * Crea el Student en `PENDING_PAYMENT`. No toca Stripe todavía — eso
 * vive en /api/billing/subscribe. Separar las llamadas permite que
 * el padre vea inmediatamente el Student como "pago pendiente" en su
 * dashboard si abandona mid-flow.
 *
 * `monthlyAmountCents` se calcula a partir de plan+cycle aquí mismo
 * para que el Parent Copilot pueda sumar sin recalcular.
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

  const parsed = studentCreateSchema.safeParse(raw);
  if (!parsed.success) {
    return jsonError(400, 'validation_failed', parsed.error.flatten());
  }

  const parent = await prisma.parent.findUnique({
    where: { id: session.user.parentId },
    select: { id: true, familyId: true }
  });
  if (!parent) return jsonError(401, 'parent_not_found');

  const pricingPlan = parsed.data.plan.toLowerCase() as Plan;
  const pricingCycle = parsed.data.cycle.toLowerCase() as 'monthly' | 'annual';
  const display = getDisplayPlan(pricingPlan, pricingCycle);

  const student = await prisma.student.create({
    data: {
      displayName: parsed.data.displayName,
      birthDate: parsed.data.birthDate,
      gradeLevel: parsed.data.gradeLevel,
      preferredLocale: parsed.data.preferredLocale,
      angelaNotes: parsed.data.angelaNotes ?? null,
      familyId: parent.familyId,
      subscriptionStatus: 'PENDING_PAYMENT',
      planTier: parsed.data.plan,
      billingCycle: parsed.data.cycle,
      monthlyAmountCents: display.monthlyDisplayCents
    },
    select: {
      id: true,
      displayName: true,
      planTier: true,
      billingCycle: true,
      monthlyAmountCents: true
    }
  });

  return Response.json({ student }, { status: 201 });
}
