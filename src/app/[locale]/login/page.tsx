import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';
import { DemoLogin } from '@/components/auth/DemoLogin';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { getSession, getDemoRole } from '@/lib/auth/session';

const DEVICE_FAMILY_COOKIE = 'midsea_device_family';

export default async function LoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const session = await getSession();
  if (session?.user?.parentId) {
    redirect(`/${locale}/parent`);
  }

  // Si una sesion demo ya esta activa, saltamos directo al espacio que eligio.
  const demoRole = getDemoRole();
  if (demoRole === 'parent') redirect(`/${locale}/parent`);
  if (demoRole === 'student') redirect(`/${locale}/student`);

  const callbackUrl = `/${locale}/parent`;
  // Si este dispositivo ya fue reclamado por una familia (cookie sticky),
  // mostramos un acceso rápido para estudiante. Si no, no — un dispositivo
  // sin claim no debería poder enumerar estudiantes de nadie.
  const deviceClaimed = Boolean(cookies().get(DEVICE_FAMILY_COOKIE)?.value);
  const t = await getTranslations({ locale, namespace: 'auth.signIn' });

  return (
    <div className="relative mx-auto min-h-screen max-w-6xl px-4 py-6">
      <header className="flex items-center justify-between">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-display text-base font-bold text-midsea-deep"
        >
          <span
            aria-hidden
            className="inline-block h-7 w-7 rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-ocean shadow-wave"
          />
          Midsea
        </Link>
        <LocaleSwitcher />
      </header>

      <div className="flex min-h-[70vh] items-center justify-center py-10">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center justify-center gap-3">
            <span
              aria-hidden
              className="inline-block h-12 w-12 rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-ocean shadow-wave animate-floatY"
            />
            <span className="font-display text-2xl font-bold text-midsea-deep">Midsea</span>
          </div>
          <LoginForm callbackUrl={callbackUrl} />
          {deviceClaimed ? (
            <p className="text-center text-xs text-midsea-ink/60">
              {t('studentEntry')}{' '}
              <Link
                href={`/${locale}/student-login`}
                className="font-semibold text-midsea-deep hover:underline"
              >
                {t('studentEntryLink')}
              </Link>
            </p>
          ) : null}
          <DemoLogin />
        </div>
      </div>
    </div>
  );
}
