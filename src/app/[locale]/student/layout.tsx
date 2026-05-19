import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { CoinBadge } from '@/components/gamification/CoinBadge';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { UserMenu } from '@/components/auth/UserMenu';
import { AngelaWidget } from '@/components/tutoring/AngelaWidget';
import { requireStudent } from '@/lib/auth/session';
import { prisma } from '@/lib/prisma';
import { DEMO_TOTAL_COIN } from '@/lib/demo/data';

// Memory project-midsea-framing: el AI tutor NO es entrada de nav principal,
// solo boton contextual dentro de una leccion del estudiante.
// Epic 01 §4: role enforcement — solo STUDENT (o demo-student) llega aquí.
// PARENT que intenta /student → redirect a /student-login (selector).

export default async function StudentLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const activeStudent = await requireStudent(locale);

  const t = await getTranslations({ locale, namespace: 'student.nav' });

  const items: { key: 'home' | 'lessons' | 'rewards' | 'profile'; href: string }[] = [
    { key: 'home', href: `/${locale}/student` },
    { key: 'lessons', href: `/${locale}/student/lessons` },
    { key: 'rewards', href: `/${locale}/student/rewards` },
    { key: 'profile', href: `/${locale}/student/profile` }
  ];

  let totalCoin: number;
  if (activeStudent.isDemo) {
    totalCoin = DEMO_TOTAL_COIN;
  } else {
    const agg = await prisma.coinEntry.aggregate({
      where: { studentId: activeStudent.id },
      _sum: { amount: true }
    });
    totalCoin = agg._sum.amount ?? 0;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-midsea-ocean/10 shadow-wave backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
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
          <nav aria-label="Student sections" className="flex flex-wrap items-center gap-1 text-sm">
            {items.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                className="rounded-lg px-3 py-1.5 text-midsea-deep hover:bg-midsea-foam"
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CoinBadge amount={totalCoin} />
          <LocaleSwitcher />
          <UserMenu callbackUrl={`/${locale}/student`} />
        </div>
      </div>
      {children}
      <AngelaWidget />
    </div>
  );
}
