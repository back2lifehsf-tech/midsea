'use client';
import { useForm } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import {
  studentCreateSchema,
  type StudentCreateInput,
  PLAN_TIER_VALUES,
  BILLING_CYCLE_VALUES,
  LOCALE_VALUES,
  AVATAR_KEY_VALUES
} from '@/lib/schemas/student';
import { AvatarSvg, type AvatarKey } from '@/lib/auth/avatars';

/**
 * Step A del NewStudentDialog. Epic 03 §1 Step A.
 *
 * RHF para estado del form; validación Zod manual en `onValid` para no
 * agregar @hookform/resolvers (deps mínimas). Cuando Zod falla,
 * mapeamos issues → setError por campo.
 *
 * Plan + cycle vienen del query param del landing (`?plan=core&cycle=annual`)
 * vía `defaultPlan` / `defaultCycle`. Si el usuario llegó directo al
 * dashboard, default CORE + MONTHLY.
 */

type PlanTier = (typeof PLAN_TIER_VALUES)[number];
type BillingCycle = (typeof BILLING_CYCLE_VALUES)[number];

interface RawForm {
  displayName: string;
  birthDate: string;
  gradeLevel: number | string; // RHF select returns string
  preferredLocale: (typeof LOCALE_VALUES)[number];
  angelaNotes: string;
  plan: PlanTier;
  cycle: BillingCycle;
  pin: string;
  avatarKey: (typeof AVATAR_KEY_VALUES)[number] | '';
}

interface StudentFormProps {
  defaultPlan?: PlanTier;
  defaultCycle?: BillingCycle;
  onSubmit(data: StudentCreateInput): void | Promise<void>;
}

export function StudentForm({ defaultPlan, defaultCycle, onSubmit }: StudentFormProps) {
  const t = useTranslations('parent.students.form');
  const tErr = useTranslations('parent.errors');

  const {
    register,
    handleSubmit,
    setError,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<RawForm>({
    defaultValues: {
      displayName: '',
      birthDate: '',
      gradeLevel: 1,
      preferredLocale: 'es',
      angelaNotes: '',
      plan: defaultPlan ?? 'CORE',
      cycle: defaultCycle ?? 'MONTHLY',
      pin: '',
      avatarKey: ''
    }
  });
  const selectedAvatar = watch('avatarKey');

  async function onValid(raw: RawForm) {
    const result = studentCreateSchema.safeParse({
      ...raw,
      gradeLevel: Number(raw.gradeLevel)
    });
    if (!result.success) {
      for (const issue of result.error.issues) {
        const path = issue.path[0] as keyof RawForm;
        setError(path, { type: 'manual', message: issue.message });
      }
      return;
    }
    await onSubmit(result.data);
  }

  return (
    <form onSubmit={handleSubmit(onValid)} className="space-y-4" noValidate>
      <Field
        label={t('nameLabel')}
        error={errors.displayName?.message ? tErr(errors.displayName.message) : undefined}
      >
        <input
          {...register('displayName')}
          type="text"
          placeholder={t('namePlaceholder')}
          className={inputClass}
          autoComplete="off"
        />
      </Field>

      <Field
        label={t('birthDateLabel')}
        error={errors.birthDate?.message ? tErr(errors.birthDate.message) : undefined}
      >
        <input
          {...register('birthDate')}
          type="date"
          className={inputClass}
          max={new Date().toISOString().slice(0, 10)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field
          label={t('gradeLabel')}
          error={errors.gradeLevel?.message ? tErr(errors.gradeLevel.message) : undefined}
        >
          <select {...register('gradeLevel')} className={inputClass}>
            <option value={0}>{t('gradePreK')}</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {t('gradeNumbered', { n })}
              </option>
            ))}
          </select>
        </Field>

        <Field label={t('localeLabel')}>
          <select {...register('preferredLocale')} className={inputClass}>
            <option value="es">{t('localeEs')}</option>
            <option value="en">{t('localeEn')}</option>
          </select>
        </Field>
      </div>

      <Field label={t('angelaNotesLabel')}>
        <textarea
          {...register('angelaNotes')}
          placeholder={t('angelaNotesPlaceholder')}
          rows={3}
          maxLength={500}
          className={`${inputClass} resize-none`}
        />
      </Field>

      <Field
        label={t('avatarLabel')}
        error={errors.avatarKey?.message ? tErr(errors.avatarKey.message) : undefined}
      >
        <p className="text-xs text-midsea-ink/60">{t('avatarHint')}</p>
        <div
          role="radiogroup"
          aria-label={t('avatarLabel')}
          className="mt-2 grid grid-cols-4 gap-2"
        >
          {AVATAR_KEY_VALUES.map((key) => {
            const checked = selectedAvatar === key;
            return (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() =>
                  setValue('avatarKey', key, {
                    shouldDirty: true,
                    shouldValidate: false
                  })
                }
                className={[
                  'grid h-14 w-full place-items-center rounded-xl transition-shadow',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon',
                  checked
                    ? 'ring-2 ring-midsea-lagoon shadow-wave bg-midsea-foam'
                    : 'ring-1 ring-midsea-ocean/15 bg-white hover:ring-midsea-ocean/30'
                ].join(' ')}
              >
                <AvatarSvg avatar={key as AvatarKey} size={36} />
              </button>
            );
          })}
        </div>
      </Field>

      <Field
        label={t('pinLabel')}
        error={errors.pin?.message ? tErr(errors.pin.message) : undefined}
      >
        <p className="text-xs text-midsea-ink/60">{t('pinHint')}</p>
        <input
          {...register('pin')}
          type="text"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          placeholder="1234"
          className={`${inputClass} mt-2 tracking-widest text-center text-lg`}
        />
      </Field>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-xl bg-midsea-lagoon px-4 py-3 font-medium text-white shadow-sm transition-colors hover:bg-midsea-ocean disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-2"
      >
        {isSubmitting ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}

const inputClass =
  'block w-full rounded-xl border border-midsea-ocean/15 bg-white px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon focus-visible:ring-offset-1 placeholder:text-midsea-ink/30';

function Field({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5 text-sm">
      <span className="block font-medium text-midsea-deep">{label}</span>
      {children}
      {error ? (
        <span role="alert" className="block text-xs text-rose-700">
          {error}
        </span>
      ) : null}
    </label>
  );
}
