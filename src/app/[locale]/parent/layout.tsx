import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { UserMenu } from '@/components/auth/UserMenu';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { requireParent } from '@/lib/auth/session';

export default async function ParentLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Guard: si no hay sesion valida con un Parent en DB, redirige a /login.
  await requireParent(locale);
  const t = await getTranslations({ locale, namespace: 'parent.nav' });

  const items: { key: 'overview' | 'students' | 'planner' | 'reports' | 'settings'; href: string }[] = [
    { key: 'overview', href: `/${locale}/parent` },
    { key: 'students', href: `/${locale}/parent/students` },
    { key: 'planner', href: `/${locale}/parent/planner` },
    { key: 'reports', href: `/${locale}/parent/reports` },
    { key: 'settings', href: `/${locale}/parent/settings` }
  ];

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
          <nav aria-label="Parent sections" className="flex flex-wrap items-center gap-1 text-sm">
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
          <LocaleSwitcher />
          <UserMenu callbackUrl={`/${locale}/parent`} />
        </div>
      </div>
      {children}
    </div>
  );
}
