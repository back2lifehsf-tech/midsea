import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/LoginForm';
import { DemoLogin } from '@/components/auth/DemoLogin';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { getSession, getDemoRole } from '@/lib/auth/session';

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
          <DemoLogin />
        </div>
      </div>
    </div>
  );
}
