import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { StudentLoginForm } from '@/components/auth/StudentLoginForm';
import { getSession } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { isAvatarKey } from '@/lib/auth/avatars';

const DEVICE_FAMILY_COOKIE = 'midsea_device_family';

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

  // Resolución de familyId — dos fuentes en orden de preferencia:
  //   1) Sesión activa del padre (más fresco)
  //   2) Cookie midsea_device_family (sticky, setteada por middleware en el
  //      primer login del padre — sobrevive al logout para que el estudiante
  //      pueda entrar después)
  const familyIdFromSession = session?.user?.familyId ?? null;
  const familyIdFromCookie = cookies().get(DEVICE_FAMILY_COOKIE)?.value ?? null;
  const familyId = familyIdFromSession ?? familyIdFromCookie;

  // Si el device no fue reclamado todavía, mostramos pantalla amigable
  // en vez de loop hacia /login. (Evita confusión al estudiante.)
  const deviceNotClaimed = !familyId;

  const studentsRaw = familyId
    ? await prisma.student.findMany({
        where: { familyId, pinHash: { not: null } },
        orderBy: { createdAt: 'asc' },
        select: { id: true, displayName: true, avatarKey: true }
      })
    : [];
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
        {deviceNotClaimed ? (
          <div className="mx-auto max-w-md space-y-5 text-center">
            <h1 className="font-display text-2xl font-bold text-midsea-deep">
              {t('deviceNotClaimedTitle')}
            </h1>
            <p className="text-sm text-midsea-ink/70">{t('deviceNotClaimedBody')}</p>
            <Link
              href={`/${locale}/login?as=parent`}
              className="inline-flex rounded-xl bg-midsea-deep px-5 py-2.5 text-sm font-semibold text-white shadow-wave hover:bg-midsea-lagoon"
            >
              {t('deviceNotClaimedCta')}
            </Link>
          </div>
        ) : students.length === 0 ? (
          <div className="mx-auto max-w-md space-y-4 text-center">
            <h1 className="font-display text-2xl font-bold text-midsea-deep">{t('title')}</h1>
            <p className="text-sm text-midsea-ink/70">{t('noStudentsYet')}</p>
            <Link
              href={`/${locale}/parent/students/new`}
              className="inline-flex rounded-xl bg-midsea-deep px-5 py-2.5 text-sm font-semibold text-white shadow-wave hover:bg-midsea-lagoon"
            >
              {t('createFirstStudent')}
            </Link>
          </div>
        ) : (
          <StudentLoginForm students={students} />
        )}
      </main>
    </div>
  );
}
