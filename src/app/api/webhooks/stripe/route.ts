import { NextRequest } from 'next/server';
import {
  verifyWebhookSignature,
  mapStripeStatusToPrisma
} from '@/lib/billing/stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type Stripe from 'stripe';

/**
 * POST /api/webhooks/stripe — Epic 03 §8 + ADR-001 §9.
 *
 * Verifica firma con `STRIPE_WEBHOOK_SECRET` (CLI o endpoint real) y
 * persiste el `Event.id` en `StripeWebhookEvent` (PK unique) para
 * idempotencia: si Stripe nos reentrega el mismo evento, el insert
 * falla con P2002 y devolvemos 200 sin re-aplicar el handler.
 *
 * Handlers implementados:
 *   - customer.subscription.updated → sync subscriptionStatus +
 *     currentPeriodEnd. Es el evento que lleva incomplete → ACTIVE
 *     después del pago exitoso.
 *   - customer.subscription.deleted → CANCELED.
 *   - payment_intent.payment_failed → PENDING_PAYMENT (UX immediate).
 *
 * Eventos sin handler explícito (payment_intent.succeeded,
 * invoice.payment_failed, etc.) se persisten para auditoría pero
 * no disparan acciones — el sub.updated los cubre via path indirecto.
 */
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('missing signature', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const raw = await req.text();
    event = verifyWebhookSignature(raw, signature);
  } catch (e) {
    console.error('[stripe-webhook] verify failed:', e);
    return new Response('bad signature', { status: 400 });
  }

  // Idempotencia: insert por id; si ya existe (P2002), no re-aplicamos.
  try {
    await prisma.stripeWebhookEvent.create({
      data: {
        id: event.id,
        type: event.type,
        payload: event as unknown as Prisma.InputJsonValue
      }
    });
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === 'P2002'
    ) {
      return new Response('already processed', { status: 200 });
    }
    console.error('[stripe-webhook] persistence failed:', e);
    // Devolvemos 500 para que Stripe reintente; sin la fila, idempotencia
    // no funciona y no queremos perder el evento.
    return new Response('persistence error', { status: 500 });
  }

  try {
    await handleEvent(event);
  } catch (e) {
    // Loguear pero ACK al 200 — el evento ya está persistido; re-ejecutar
    // el handler no es atómico, mejor que un humano resuelva mirando logs.
    console.error('[stripe-webhook] handler error:', event.type, e);
  }

  return new Response('ok', { status: 200 });
}

async function handleEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case 'customer.subscription.updated':
    case 'customer.subscription.created': {
      const sub = event.data.object as Stripe.Subscription;
      const periodEnd =
        (sub as unknown as { current_period_end?: number }).current_period_end ??
        sub.items.data[0]?.current_period_end;
      await prisma.student.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          subscriptionStatus: mapStripeStatusToPrisma(sub.status),
          ...(periodEnd
            ? { currentPeriodEnd: new Date(periodEnd * 1000) }
            : {})
        }
      });
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      await prisma.student.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: { subscriptionStatus: 'CANCELED' }
      });
      break;
    }
    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      // PaymentIntent en flujo de subscription tiene invoice → subscription.
      const invoiceId =
        (pi as unknown as { invoice?: string | Stripe.Invoice }).invoice;
      if (!invoiceId || typeof invoiceId !== 'string') break;
      // No tenemos forma directa de mapear invoice → subscription sin otro
      // API call. Por ahora marcamos via metadata si está disponible.
      const studentId = pi.metadata?.midseaStudentId;
      if (studentId) {
        await prisma.student.update({
          where: { id: studentId },
          data: { subscriptionStatus: 'PENDING_PAYMENT' }
        });
      }
      break;
    }
    default:
      // Persistido para auditoría; sin acción.
      break;
  }
}
