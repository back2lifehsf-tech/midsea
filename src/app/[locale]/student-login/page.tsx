import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { isAvatarKey } from '@/lib/auth/avatars';

/**
 * Login de estudiante por PIN. Epic 01 §3b.
 *
 * Prerequisito: el padre del dispositivo ya está autenticado. Sólo así
 * podemos listar `family.students` con privacidad (no exponemos todos los
 * estudiantes del mundo en una pantalla pública).
 *
 * Flow:
 *   no session → redirect a /login (padre debe firmar primero)
 *   student session ya activa → redirect a /student
 *   parent session → render avatar grid + PIN keypad
 */
export default async function StudentLoginPage({
  params: { locale }
}: {
  params: { locale: string };
}) {
  const session = await getSession();
  const t = await getTranslations({ locale, namespace: 'auth.studentLogin' });

  if (session?.user?.role === 'STUDENT') {
    redirect(`/${locale}/student`);
  }

  if (!session?.user?.parentId || !session.user.familyId) {
    // Sin sesión de padre, no podemos saber qué estudiantes mostrar.
    redirect(`/${locale}/login?callbackUrl=${encodeURIComponent(`/${locale}/student-login`)}`);
  }

  const studentsRaw = await prisma.student.findMany({
    where: { familyId: session.user.familyId, pinHash: { not: null } },
    orderBy: { createdAt: 'asc' },
    select: { id: true, displayName: true, avatarKey: true }
  });
  const students = studentsRaw.map((s) => ({
    id: s.id,
    displayName: s.displayName,
    avatarKey: isAvatarKey(s.avatarKey) ? s.avatarKey : null
  }));

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
          MIDSEA Academy
        </Link>
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <SignOutButton callbackUrl={`/${locale}/login`} />
        </div>
      </header>

      <main className="py-10">
        {students.length === 0 ? (
          <div className="mx-auto max-w-md space-y-4 text-center">
            <h1 className="font-display text-2xl font-bold text-midsea-deep">{t('title')}</h1>
            <p className="text-sm text-midsea-ink/70">{t('noStudentsYet')}</p>
            <Link
              href={`/${locale}/parent/students/new`}
              className="inline-flex rounded-xl bg-midsea-deep px-5 py-2.5 text-sm font-semibold text-white shadow-wave hover:bg-midsea-lagoon"
            >
              {t('switchAccount')}
            </Link>
          </div>
        ) : (
          <StudentLoginForm students={students} />
        )}
      </main>
    </div>
  );
}
