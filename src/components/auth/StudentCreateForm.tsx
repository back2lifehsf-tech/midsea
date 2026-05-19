'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AVATARS, AvatarSvg, type AvatarKey } from '@/lib/auth/avatars';

type ErrorKey =
  | 'nameRequired'
  | 'birthDateRequired'
  | 'gradeInvalid'
  | 'pinInvalid'
  | 'avatarRequired'
  | 'unauthorized'
  | 'generic';

const SERVER_ERROR_MAP: Record<string, ErrorKey> = {
  name_required: 'nameRequired',
  birth_date_required: 'birthDateRequired',
  grade_invalid: 'gradeInvalid',
  pin_invalid: 'pinInvalid',
  avatar_required: 'avatarRequired',
  unauthorized: 'unauthorized',
  generic: 'generic'
};

const GRADE_OPTIONS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] as const;

export function StudentCreateForm() {
  const t = useTranslations('parentStudents.new');
  const tErr = useTranslations('parentStudents.new.errors');
  const locale = useLocale();
  const router = useRouter();

  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gradeLevel, setGradeLevel] = useState<number>(3);
  const [pin, setPin] = useState('');
  const [avatar, setAvatar] = useState<AvatarKey | ''>('');
  const [error, setError] = useState<ErrorKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function clientValidate(): ErrorKey | null {
    if (!name.trim()) return 'nameRequired';
    if (!birthDate) return 'birthDateRequired';
    if (!Number.isInteger(gradeLevel) || gradeLevel < 0 || gradeLevel > 12) return 'gradeInvalid';
    if (!/^\d{4}$/.test(pin)) return 'pinInvalid';
    if (!avatar) return 'avatarRequired';
    return null;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting) return;
    const clientErr = clientValidate();
    if (clientErr) {
      setError(clientErr);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch('/api/parent/students', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          birthDate,
          gradeLevel,
          pin,
          avatarKey: avatar,
          preferredLocale: locale === 'en' ? 'en' : 'es'
        })
      });
      if (!res.ok) {
        let code = 'generic';
        try {
          const data = (await res.json()) as { error?: string };
          code = data.error ?? 'generic';
        } catch {}
        setError(SERVER_ERROR_MAP[code] ?? 'generic');
        setSubmitting(false);
        return;
      }
      router.push(`/${locale}/parent`);
      router.refresh();
    } catch {
      setError('generic');
      setSubmitting(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl space-y-6" aria-labelledby="student-create-title">
      <header className="space-y-2">
        <Link
          href={`/${locale}/parent`}
          className="inline-block text-sm text-midsea-ocean hover:underline"
        >
          ← {t('backToOverview')}
        </Link>
        <h1 id="student-create-title" className="font-display text-3xl font-bold text-midsea-deep">
          {t('title')}
        </h1>
        <p className="text-sm text-midsea-ink/70">{t('subtitle')}</p>
      </header>

      <form onSubmit={onSubmit} className="midsea-card space-y-5" noValidate>
        <div className="space-y-1">
          <label htmlFor="student-name" className="block text-sm font-medium text-midsea-deep">
            {t('nameLabel')}
          </label>
          <input
            id="student-name"
            type="text"
            placeholder={t('namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={submitting}
            className="w-full rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <label htmlFor="student-birth" className="block text-sm font-medium text-midsea-deep">
              {t('birthDateLabel')}
            </label>
            <input
              id="student-birth"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={submitting}
              className="w-full rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="student-grade" className="block text-sm font-medium text-midsea-deep">
              {t('gradeLabel')}
            </label>
            <select
              id="student-grade"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
              disabled={submitting}
              className="w-full rounded-xl bg-white px-4 py-2 text-sm ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
            >
              {GRADE_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g === 0 ? t('gradePreK') : t('gradeNumbered', { n: g })}
                </option>
              ))}
            </select>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-midsea-deep">{t('avatarLabel')}</legend>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {AVATARS.map((a) => {
              const active = avatar === a;
              return (
                <button
                  key={a}
                  type="button"
                  onClick={() => setAvatar(a)}
                  aria-pressed={active}
                  disabled={submitting}
                  className={`grid place-items-center rounded-2xl p-2 ring-2 transition focus-visible:outline-none focus-visible:ring-midsea-lagoon ${
                    active ? 'ring-midsea-deep bg-midsea-foam' : 'ring-transparent hover:bg-midsea-foam'
                  }`}
                >
                  <AvatarSvg avatar={a} size={56} label={a} />
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-1">
          <label htmlFor="student-pin" className="block text-sm font-medium text-midsea-deep">
            {t('pinLabel')}
          </label>
          <input
            id="student-pin"
            type="text"
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
            disabled={submitting}
            autoComplete="off"
            className="w-32 rounded-xl bg-white px-4 py-2 text-center font-display text-xl tracking-[0.5em] ring-1 ring-midsea-ocean/20 focus:outline-none focus:ring-2 focus:ring-midsea-lagoon disabled:opacity-60"
          />
          <p className="text-xs text-midsea-ink/60">{t('pinHint')}</p>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg bg-midsea-coral/10 px-3 py-2 text-xs text-midsea-coral">
            {tErr(error)}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-xl bg-midsea-deep px-5 py-2.5 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          {submitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </section>
  );
}
