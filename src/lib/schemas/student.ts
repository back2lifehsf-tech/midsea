import { z } from 'zod';

/**
 * Schemas Zod compartidos entre form client y endpoints server. Epic 03.
 *
 * `planTier` / `billingCycle` usan los valores UPPER del enum Prisma
 * para evitar `.toUpperCase()` boilerplate al persistir. El landing
 * (Epic 02b) usa lowercase en `?plan=core` — la conversión vive en
 * el cliente del modal (parsea query → upper).
 */

export const PLAN_TIER_VALUES = ['CORE', 'PRO', 'FAMILY'] as const;
export const BILLING_CYCLE_VALUES = ['MONTHLY', 'ANNUAL'] as const;
export const LOCALE_VALUES = ['es', 'en'] as const;
export const AVATAR_KEY_VALUES = [
  'fox',
  'owl',
  'cat',
  'dog',
  'panda',
  'lion',
  'fish',
  'rabbit'
] as const;

const PIN_RE = /^\d{4}$/;

const MIN_BIRTH_DATE = new Date('1990-01-01');

export const studentCreateSchema = z
  .object({
    displayName: z.string().trim().min(1, 'name_required').max(80),
    birthDate: z
      .string()
      .refine((s) => !Number.isNaN(Date.parse(s)), { message: 'birth_invalid' })
      .transform((s) => new Date(s)),
    gradeLevel: z.number().int().min(0).max(12),
    preferredLocale: z.enum(LOCALE_VALUES),
    angelaNotes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((v) => (v && v.length > 0 ? v : undefined)),
    plan: z.enum(PLAN_TIER_VALUES),
    cycle: z.enum(BILLING_CYCLE_VALUES),
    // PIN + avatar: requeridos para que el estudiante pueda entrar via
    // /student-login (que filtra por pinHash !== null). Si los dejamos
    // opcionales el estudiante queda huérfano (creado pero no logueable).
    pin: z
      .string()
      .trim()
      .refine((v) => PIN_RE.test(v), { message: 'pin_invalid' }),
    avatarKey: z.enum(AVATAR_KEY_VALUES, {
      errorMap: () => ({ message: 'avatar_required' })
    })
  })
  .superRefine((data, ctx) => {
    if (data.plan === 'FAMILY' && data.cycle === 'ANNUAL') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['cycle'],
        message: 'family_annual_unavailable'
      });
    }
    const now = new Date();
    if (data.birthDate > now) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthDate'],
        message: 'birth_future'
      });
    }
    if (data.birthDate < MIN_BIRTH_DATE) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['birthDate'],
        message: 'birth_too_old'
      });
    }
  });

export type StudentCreateInput = z.infer<typeof studentCreateSchema>;

export const subscribeRequestSchema = z.object({
  studentId: z.string().trim().min(1)
});

export const reauthRequestSchema = z.object({
  password: z.string().min(1)
});
