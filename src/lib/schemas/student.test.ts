import { describe, it, expect } from 'vitest';
import { studentCreateSchema } from './student';

const validInput = {
  displayName: 'Sofía',
  birthDate: '2018-04-12',
  gradeLevel: 1,
  preferredLocale: 'es' as const,
  plan: 'CORE' as const,
  cycle: 'MONTHLY' as const
};

describe('studentCreateSchema', () => {
  it('accepts a minimal valid payload', () => {
    const out = studentCreateSchema.parse(validInput);
    expect(out.displayName).toBe('Sofía');
    expect(out.birthDate).toBeInstanceOf(Date);
    expect(out.angelaNotes).toBeUndefined();
  });

  it('strips empty angelaNotes', () => {
    const out = studentCreateSchema.parse({ ...validInput, angelaNotes: '   ' });
    expect(out.angelaNotes).toBeUndefined();
  });

  it('keeps non-empty angelaNotes', () => {
    const out = studentCreateSchema.parse({
      ...validInput,
      angelaNotes: 'TDAH dx, prefiere ejemplos cortos'
    });
    expect(out.angelaNotes).toContain('TDAH');
  });

  it('rejects empty displayName', () => {
    const r = studentCreateSchema.safeParse({ ...validInput, displayName: '' });
    expect(r.success).toBe(false);
  });

  it('rejects out-of-range gradeLevel', () => {
    expect(
      studentCreateSchema.safeParse({ ...validInput, gradeLevel: 13 }).success
    ).toBe(false);
    expect(
      studentCreateSchema.safeParse({ ...validInput, gradeLevel: -1 }).success
    ).toBe(false);
  });

  it('rejects unsupported locale', () => {
    const r = studentCreateSchema.safeParse({
      ...validInput,
      preferredLocale: 'pt'
    });
    expect(r.success).toBe(false);
  });

  it('rejects future birthDate', () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const r = studentCreateSchema.safeParse({ ...validInput, birthDate: future });
    expect(r.success).toBe(false);
  });

  it('rejects birthDate before 1990', () => {
    const r = studentCreateSchema.safeParse({
      ...validInput,
      birthDate: '1988-05-01'
    });
    expect(r.success).toBe(false);
  });

  it('rejects FAMILY + ANNUAL (not offered in v1)', () => {
    const r = studentCreateSchema.safeParse({
      ...validInput,
      plan: 'FAMILY',
      cycle: 'ANNUAL'
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.some((i) => i.message === 'family_annual_unavailable')
      ).toBe(true);
    }
  });
});
