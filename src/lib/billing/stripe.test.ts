import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { customersCreate, parentUpdate } = vi.hoisted(() => ({
  customersCreate: vi.fn(),
  parentUpdate: vi.fn()
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    parent: { update: parentUpdate }
  }
}));

vi.mock('stripe', () => {
  return {
    default: class FakeStripe {
      customers = { create: customersCreate };
      subscriptions = { create: vi.fn() };
      webhooks = { constructEvent: vi.fn() };
    }
  };
});

import {
  ensureCustomer,
  getStripePriceId,
  mapStripeStatusToPrisma
} from './stripe';

describe('ensureCustomer', () => {
  const original = process.env.STRIPE_SECRET_KEY;
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_dummy';
    customersCreate.mockReset();
    parentUpdate.mockReset();
  });
  afterEach(() => {
    if (original === undefined) delete process.env.STRIPE_SECRET_KEY;
    else process.env.STRIPE_SECRET_KEY = original;
  });

  it('returns cached id when Parent already has stripeCustomerId', async () => {
    const id = await ensureCustomer({
      id: 'p1',
      email: 'a@b.com',
      name: 'Ana',
      stripeCustomerId: 'cus_existing'
    });
    expect(id).toBe('cus_existing');
    expect(customersCreate).not.toHaveBeenCalled();
    expect(parentUpdate).not.toHaveBeenCalled();
  });

  it('creates Stripe Customer and persists id when missing', async () => {
    customersCreate.mockResolvedValue({ id: 'cus_new' });
    parentUpdate.mockResolvedValue({});

    const id = await ensureCustomer({
      id: 'p1',
      email: 'a@b.com',
      name: 'Ana',
      stripeCustomerId: null
    });

    expect(id).toBe('cus_new');
    expect(customersCreate).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'Ana',
      metadata: { midseaParentId: 'p1' }
    });
    expect(parentUpdate).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { stripeCustomerId: 'cus_new' }
    });
  });
});

describe('getStripePriceId', () => {
  const snapshot = { ...process.env };
  beforeEach(() => {
    process.env = { ...snapshot };
    process.env.STRIPE_PRICE_CORE_MONTHLY = 'price_core_m';
    process.env.STRIPE_PRICE_CORE_ANNUAL = 'price_core_a';
    process.env.STRIPE_PRICE_PRO_MONTHLY = 'price_pro_m';
    process.env.STRIPE_PRICE_PRO_ANNUAL = 'price_pro_a';
    process.env.STRIPE_PRICE_FAMILY_MONTHLY = 'price_family_m';
  });
  afterEach(() => {
    process.env = { ...snapshot };
  });

  it('returns the env value for valid combinations', () => {
    expect(getStripePriceId('CORE', 'MONTHLY')).toBe('price_core_m');
    expect(getStripePriceId('CORE', 'ANNUAL')).toBe('price_core_a');
    expect(getStripePriceId('PRO', 'MONTHLY')).toBe('price_pro_m');
    expect(getStripePriceId('PRO', 'ANNUAL')).toBe('price_pro_a');
    expect(getStripePriceId('FAMILY', 'MONTHLY')).toBe('price_family_m');
  });

  it('throws on Family + Annual (not offered in v1 per ADR-001)', () => {
    expect(() => getStripePriceId('FAMILY', 'ANNUAL')).toThrow(/Family annual/i);
  });

  it('throws on missing env var', () => {
    delete process.env.STRIPE_PRICE_CORE_MONTHLY;
    expect(() => getStripePriceId('CORE', 'MONTHLY')).toThrow(/Missing env/i);
  });
});

describe('mapStripeStatusToPrisma', () => {
  it('maps Stripe statuses exhaustively', () => {
    expect(mapStripeStatusToPrisma('incomplete')).toBe('PENDING_PAYMENT');
    expect(mapStripeStatusToPrisma('incomplete_expired')).toBe('PENDING_PAYMENT');
    expect(mapStripeStatusToPrisma('trialing')).toBe('TRIALING');
    expect(mapStripeStatusToPrisma('active')).toBe('ACTIVE');
    expect(mapStripeStatusToPrisma('past_due')).toBe('PAST_DUE');
    expect(mapStripeStatusToPrisma('unpaid')).toBe('PAST_DUE');
    expect(mapStripeStatusToPrisma('canceled')).toBe('CANCELED');
    expect(mapStripeStatusToPrisma('paused')).toBe('PAUSED');
  });
});
