import { describe, it, expect, afterEach } from 'vitest';
import {
  computeAnnualTotalCents,
  computeMonthlyDisplayFromAnnual,
  getAnnualDiscountPct,
  getDisplayPlan,
  formatUsd,
  PLAN_MONTHLY_CENTS
} from './plans';

describe('pricing.computeAnnualTotalCents', () => {
  it('matches the ADR-001 anchor numbers', () => {
    // $29 * 12 = $348 → 30% off → $243.60
    expect(computeAnnualTotalCents(2900, 30)).toBe(24360);
    // $45 * 12 = $540 → 30% off → $378.00
    expect(computeAnnualTotalCents(4500, 30)).toBe(37800);
  });

  it('returns full year price when discount is 0', () => {
    expect(computeAnnualTotalCents(2900, 0)).toBe(34800);
  });

  it('returns 0 when discount is 100', () => {
    expect(computeAnnualTotalCents(2900, 100)).toBe(0);
  });

  it('rounds half-up on non-exact division', () => {
    // 2999 * 12 * 0.7 = 25191.6 → 25192
    expect(computeAnnualTotalCents(2999, 30)).toBe(25192);
  });

  it('throws on invalid input', () => {
    expect(() => computeAnnualTotalCents(-1, 30)).toThrow();
    expect(() => computeAnnualTotalCents(100, -5)).toThrow();
    expect(() => computeAnnualTotalCents(100, 101)).toThrow();
  });
});

describe('pricing.computeMonthlyDisplayFromAnnual', () => {
  it('matches ADR-001 anchor display numbers', () => {
    expect(computeMonthlyDisplayFromAnnual(24360)).toBe(2030); // $20.30
    expect(computeMonthlyDisplayFromAnnual(37800)).toBe(3150); // $31.50
  });
});

describe('pricing.getAnnualDiscountPct', () => {
  const original = process.env.ANNUAL_DISCOUNT_PCT;
  afterEach(() => {
    if (original === undefined) delete process.env.ANNUAL_DISCOUNT_PCT;
    else process.env.ANNUAL_DISCOUNT_PCT = original;
  });

  it('defaults to 30 when unset', () => {
    delete process.env.ANNUAL_DISCOUNT_PCT;
    expect(getAnnualDiscountPct()).toBe(30);
  });

  it('reads valid integers from env', () => {
    process.env.ANNUAL_DISCOUNT_PCT = '40';
    expect(getAnnualDiscountPct()).toBe(40);
  });

  it('falls back to default on garbage', () => {
    process.env.ANNUAL_DISCOUNT_PCT = 'abc';
    expect(getAnnualDiscountPct()).toBe(30);
    process.env.ANNUAL_DISCOUNT_PCT = '-5';
    expect(getAnnualDiscountPct()).toBe(30);
    process.env.ANNUAL_DISCOUNT_PCT = '101';
    expect(getAnnualDiscountPct()).toBe(30);
  });
});

describe('pricing.getDisplayPlan', () => {
  it('core monthly returns $29 with no savings', () => {
    const d = getDisplayPlan('core', 'monthly');
    expect(d.monthlyDisplayCents).toBe(2900);
    expect(d.annualTotalCents).toBeNull();
    expect(d.annualSavingsCents).toBe(0);
  });

  it('core annual returns $20.30/mo equiv with $104.40 savings', () => {
    const d = getDisplayPlan('core', 'annual');
    expect(d.monthlyDisplayCents).toBe(2030);
    expect(d.annualTotalCents).toBe(24360);
    expect(d.annualSavingsCents).toBe(2900 * 12 - 24360); // 10440 = $104.40
  });

  it('pro annual returns $31.50/mo equiv with $162 savings', () => {
    const d = getDisplayPlan('pro', 'annual');
    expect(d.monthlyDisplayCents).toBe(3150);
    expect(d.annualTotalCents).toBe(37800);
    expect(d.annualSavingsCents).toBe(4500 * 12 - 37800); // 16200 = $162.00
  });

  it('family ignores annual cycle (no annual offered in v1)', () => {
    const annual = getDisplayPlan('family', 'annual');
    expect(annual.cycle).toBe('monthly');
    expect(annual.monthlyDisplayCents).toBe(PLAN_MONTHLY_CENTS.family);
    expect(annual.annualTotalCents).toBeNull();

    const monthly = getDisplayPlan('family', 'monthly');
    expect(monthly).toEqual(annual);
  });
});

describe('pricing.formatUsd', () => {
  it('formats whole dollars', () => {
    expect(formatUsd(2900)).toBe('$29.00');
  });
  it('formats cents-precision', () => {
    expect(formatUsd(2030)).toBe('$20.30');
    expect(formatUsd(31500)).toBe('$315.00');
  });
  it('handles zero', () => {
    expect(formatUsd(0)).toBe('$0.00');
  });
});
