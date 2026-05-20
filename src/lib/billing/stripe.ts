import 'server-only';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import {
  type SubscriptionStatus,
  type PlanTier,
  type BillingCycle
} from '@prisma/client';

/**
 * Billing service. Epic 03 + ADR-001.
 *
 * Diseño:
 *   - Singleton de Stripe (key viene de env, never client-bundled).
 *   - `ensureCustomer` crea el Customer on-demand al primer cobro y
 *     persiste el `stripeCustomerId` en Parent. Idempotente: si ya
 *     hay id en DB, lo devuelve sin tocar Stripe (asumimos que Stripe
 *     no borra Customers; si algún operador lo hace, manualmente
 *     setear `Parent.stripeCustomerId = null` antes de re-cobrar).
 *   - `createStudentSubscription` aplica el patrón "default_incomplete":
 *     crea la subscription en estado `incomplete`, expande
 *     `latest_invoice.payment_intent` y devuelve el `client_secret`
 *     que el Payment Element del cliente confirma. El webhook
 *     `payment_intent.succeeded` la lleva a ACTIVE.
 *   - `mapStripeStatusToPrisma` traduce el vocabulario de Stripe al
 *     enum de Prisma. Tabla pequeña: 6 estados de Stripe → 6 nuestros.
 */

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY missing on server.');
  }
  // apiVersion: dejamos que el SDK pine la más reciente del package.
  // Si queremos pinear explícitamente, agregar `apiVersion: '2025-XX-YY'`
  // — pero rompería al actualizar el SDK sin coordinar. Para v1, default.
  cached = new Stripe(key);
  return cached;
}

/**
 * Devuelve el Stripe Customer id del Parent, creándolo si no existe.
 * El customer queda persistido en Parent.stripeCustomerId.
 */
export async function ensureCustomer(parent: {
  id: string;
  email: string;
  name: string;
  stripeCustomerId: string | null;
}): Promise<string> {
  if (parent.stripeCustomerId) {
    return parent.stripeCustomerId;
  }
  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email: parent.email,
    name: parent.name,
    metadata: { midseaParentId: parent.id }
  });
  await prisma.parent.update({
    where: { id: parent.id },
    data: { stripeCustomerId: customer.id }
  });
  return customer.id;
}

/**
 * Lee el Price ID del env. Family+ANNUAL no existe en v1 (ADR-001 §3) —
 * tirar antes de pegarle a Stripe.
 */
export function getStripePriceId(plan: PlanTier, cycle: BillingCycle): string {
  if (plan === 'FAMILY' && cycle === 'ANNUAL') {
    throw new Error('Family annual not available in v1 (ADR-001 §3).');
  }
  const key = `STRIPE_PRICE_${plan}_${cycle}`;
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing env: ${key}`);
  }
  return val;
}

export interface CreatedSubscription {
  subscriptionId: string;
  clientSecret: string;
  currentPeriodEnd: Date;
  amountCents: number;
  status: SubscriptionStatus;
}

/**
 * Crea la Subscription para un estudiante. Caller debe haber ya:
 *   - Creado el Student en DB con status PENDING_PAYMENT.
 *   - Llamado a ensureCustomer para tener el customerId.
 *
 * Retorna el client_secret que el cliente entrega al Payment Element.
 * Cuando el usuario confirma, Stripe procesa el cobro y dispara el
 * webhook que actualiza Student.subscriptionStatus.
 */
export async function createStudentSubscription(args: {
  customerId: string;
  plan: PlanTier;
  cycle: BillingCycle;
  studentId: string;
}): Promise<CreatedSubscription> {
  const stripe = getStripe();
  const priceId = getStripePriceId(args.plan, args.cycle);

  const subscription = await stripe.subscriptions.create({
    customer: args.customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: { save_default_payment_method: 'on_subscription' },
    // Stripe API 2025+: confirmation_secret reemplaza al legacy
    // payment_intent en flujos default_incomplete. Expandimos ambos
    // como cinturón y tirantes; usamos lo que llegue primero.
    expand: ['latest_invoice.confirmation_secret', 'latest_invoice.payment_intent'],
    metadata: {
      midseaStudentId: args.studentId,
      midseaPlan: args.plan,
      midseaCycle: args.cycle
    }
  });

  const invoice = subscription.latest_invoice;
  if (!invoice || typeof invoice === 'string') {
    throw new Error('Stripe did not return an expanded invoice.');
  }

  // Pattern 1 (API 2025+): invoice.confirmation_secret.client_secret
  // Pattern 2 (legacy): invoice.payment_intent.client_secret
  const invAny = invoice as Stripe.Invoice & {
    confirmation_secret?: { client_secret?: string | null } | null;
    payment_intent?: Stripe.PaymentIntent | string | null;
  };
  let clientSecret: string | null = invAny.confirmation_secret?.client_secret ?? null;
  if (!clientSecret) {
    const pi = invAny.payment_intent;
    if (pi && typeof pi !== 'string') clientSecret = pi.client_secret ?? null;
  }
  if (!clientSecret) {
    throw new Error(
      'Stripe did not return a client_secret (neither confirmation_secret nor payment_intent expanded).'
    );
  }

  // current_period_end vive en items[0] en API 2025+; fallback al campo
  // legacy del sub para versiones anteriores del SDK.
  const periodEnd =
    (subscription as unknown as { current_period_end?: number }).current_period_end ??
    subscription.items.data[0]?.current_period_end;
  if (!periodEnd) {
    throw new Error('Stripe subscription missing current_period_end.');
  }

  return {
    subscriptionId: subscription.id,
    clientSecret,
    currentPeriodEnd: new Date(periodEnd * 1000),
    amountCents: invoice.amount_due ?? 0,
    status: mapStripeStatusToPrisma(subscription.status)
  };
}

/** Traduce status de Stripe → enum Prisma. Cerrado (no fallback). */
export function mapStripeStatusToPrisma(
  s: Stripe.Subscription.Status
): SubscriptionStatus {
  switch (s) {
    case 'incomplete':
    case 'incomplete_expired':
      return 'PENDING_PAYMENT';
    case 'trialing':
      return 'TRIALING';
    case 'active':
      return 'ACTIVE';
    case 'past_due':
    case 'unpaid':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELED';
    case 'paused':
      return 'PAUSED';
  }
}

/**
 * Verifica firma del webhook + parsea el evento. Llamar desde la route
 * con el rawBody (no JSON.parsed) y el header `stripe-signature`.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signature: string
): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET missing on server.');
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}
