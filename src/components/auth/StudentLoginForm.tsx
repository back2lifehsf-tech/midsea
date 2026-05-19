'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { useLocale, useTranslations } from 'next-intl';
import { AvatarSvg, type AvatarKey } from '@/lib/auth/avatars';

interface StudentOption {
  id: string;
  displayName: string;
  avatarKey: AvatarKey | null;
}

export function StudentLoginForm({ students }: { students: StudentOption[] }) {
  const t = useTranslations('auth.studentLogin');
  const locale = useLocale();
  const router = useRouter();
  const target = `/${locale}/student`;

  const [active, setActive] = useState<StudentOption | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function press(d: string) {
    if (pin.length >= 4) return;
    setPin(pin + d);
    setError(null);
  }
  function clearPin() {
    setPin('');
    setError(null);
  }
  function back() {
    setActive(null);
    setPin('');
    setError(null);
  }

  async function submit() {
    if (!active || pin.length !== 4 || submitting) return;
    setSubmitting(true);
    const result = await signIn('student-pin', {
      studentId: active.id,
      pin,
      redirect: false,
      callbackUrl: target
    });
    if (!result || result.error) {
      setError(t('pinError'));
      setSubmitting(false);
      setPin('');
      return;
    }
    router.push(result.url ?? target);
    router.refresh();
  }

  if (active) {
    return (
      <section className="mx-auto max-w-md space-y-5">
        <header className="flex flex-col items-center gap-3 text-center">
          {active.avatarKey ? (
            <AvatarSvg avatar={active.avatarKey} size={96} label={active.displayName} />
          ) : (
            <div
              aria-hidden
              className="grid h-24 w-24 place-items-center rounded-full bg-midsea-foam text-3xl font-display font-bold text-midsea-deep"
            >
              {active.displayName[0]}
            </div>
          )}
          <h1 className="font-display text-2xl font-bold text-midsea-deep">
            {t('pinPrompt', { name: active.displayName })}
          </h1>
        </header>

        <div
          aria-label={t('pinPrompt', { name: active.displayName })}
          className="flex items-center justify-center gap-3"
        >
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              aria-hidden
              className={`h-12 w-12 rounded-full ring-2 ${
                pin[i] !== undefined
                  ? 'bg-midsea-deep ring-midsea-deep'
                  : 'bg-white ring-midsea-ocean/20'
              }`}
            />
          ))}
        </div>

        {error ? (
          <p role="alert" className="text-center text-sm text-midsea-coral">
            {error}
          </p>
        ) : null}

        <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <Keypad key={d} digit={d} onPress={press} disabled={submitting} />
          ))}
          <button
            type="button"
            onClick={back}
            disabled={submitting}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam disabled:opacity-50"
          >
            {t('back')}
          </button>
          <Keypad digit="0" onPress={press} disabled={submitting} />
          <button
            type="button"
            onClick={clearPin}
            disabled={submitting}
            className="rounded-2xl bg-white px-4 py-3 text-sm font-medium text-midsea-deep ring-1 ring-midsea-ocean/20 hover:bg-midsea-foam disabled:opacity-50"
          >
            {t('pinClear')}
          </button>
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={pin.length !== 4 || submitting}
          className="mx-auto block rounded-xl bg-midsea-deep px-6 py-3 text-base font-semibold text-white shadow-wave hover:bg-midsea-lagoon disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
        >
          {submitting ? t('pinSubmitting') : t('pinSubmit')}
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6 text-center">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold text-midsea-deep">{t('title')}</h1>
        <p className="text-sm text-midsea-ink/70">{t('subtitle')}</p>
      </header>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {students.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setActive(s)}
            className="midsea-card flex flex-col items-center gap-2 transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
          >
            {s.avatarKey ? (
              <AvatarSvg avatar={s.avatarKey} size={84} label={s.displayName} />
            ) : (
              <div
                aria-hidden
                className="grid h-20 w-20 place-items-center rounded-full bg-midsea-foam text-2xl font-display font-bold text-midsea-deep"
              >
                {s.displayName[0]}
              </div>
            )}
            <span className="font-display text-base font-bold text-midsea-deep">
              {s.displayName}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Keypad({
  digit,
  onPress,
  disabled
}: {
  digit: string;
  onPress: (d: string) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={() => onPress(digit)}
      disabled={disabled}
      className="rounded-2xl bg-white py-3 text-2xl font-display font-bold text-midsea-deep shadow-wave ring-1 ring-midsea-ocean/15 hover:bg-midsea-foam disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-midsea-lagoon"
    >
      {digit}
    </button>
  );
}
