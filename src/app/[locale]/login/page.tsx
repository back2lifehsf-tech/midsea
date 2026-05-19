import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LoginForm } from '@/components/auth/LoginForm';
import { LocaleSwitcher } from '@/components/ui/LocaleSwitcher';
import { getSession, getDemoRole } from '@/lib/auth/session';

const DEVICE_FAMILY_COOKIE = 'midsea_device_family';

/**
 * /login — gateway estilo Time4Learning. Por defecto muestra 2 cards
 * grandes ("Soy padre/madre" / "Soy estudiante"). El padre clickea su
 * card → ?as=parent → renderiza LoginForm. El estudiante clickea su
 * card → /student-login (avatar picker).
 *
 * El gateway visible es la entrada principal a la app. Demo mode UI
 * (dos botones de iterar sin DB) fue removido para producción.
 */
export default async function LoginPage({
  params: { locale },
  searchParams
}: {
  params: { locale: string };
  searchParams?: { as?: string; callbackUrl?: string };
}) {
  const session = await getSession();
  if (session?.user?.parentId) {
    redirect(`/${locale}/parent`);
  }
  const demoRole = getDemoRole();
  if (demoRole === 'parent') redirect(`/${locale}/parent`);
  if (demoRole === 'student') redirect(`/${locale}/student`);

  const callbackUrl = searchParams?.callbackUrl ?? `/${locale}/parent`;
  const showParentForm = searchParams?.as === 'parent';

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
        <LocaleSwitcher />
      </header>

      <div className="flex min-h-[80vh] items-center justify-center py-8">
        {showParentForm ? (
          <ParentLoginView locale={locale} callbackUrl={callbackUrl} />
        ) : (
          <GatewayView locale={locale} />
        )}
      </div>
    </div>
  );
}

async function ParentLoginView({
  locale,
  callbackUrl
}: {
  locale: string;
  callbackUrl: string;
}) {
  const tGateway = await getTranslations({ locale, namespace: 'auth.gateway' });
  return (
    <div className="w-full max-w-md space-y-5">
      <Link
        href={`/${locale}/login`}
        className="inline-block text-sm text-midsea-ocean hover:underline"
      >
        {tGateway('backToGateway')}
      </Link>
      <div className="flex items-center justify-center gap-3">
        <span
          aria-hidden
          className="inline-block h-12 w-12 rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-ocean shadow-wave animate-floatY"
        />
        <span className="font-display text-2xl font-bold text-midsea-deep">MIDSEA Academy</span>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}

async function GatewayView({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: 'auth.gateway' });
  return (
    <div className="w-full max-w-4xl space-y-8">
      <header className="text-center space-y-2">
        <div className="flex items-center justify-center gap-3">
          <span
            aria-hidden
            className="inline-block h-12 w-12 rounded-full bg-gradient-to-br from-midsea-lagoon to-midsea-ocean shadow-wave animate-floatY"
          />
          <span className="font-display text-2xl font-bold text-midsea-deep">MIDSEA Academy</span>
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-extrabold text-midsea-deep">
          {t('title')}
        </h1>
        <p className="text-sm text-midsea-ink/70">{t('subtitle')}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        <GatewayCard
          href={`/${locale}/login?as=parent`}
          emoji="👨‍👩‍👧"
          title={t('parentTitle')}
          body={t('parentBody')}
          cta={t('parentCta')}
          tone="deep"
        />
        <GatewayCard
          href={`/${locale}/student-login`}
          emoji="🎓"
          title={t('studentTitle')}
          body={t('studentBody')}
          cta={t('studentCta')}
          tone="lagoon"
        />
      </div>
    </div>
  );
}

function GatewayCard({
  href,
  emoji,
  title,
  body,
  cta,
  tone
}: {
  href: string;
  emoji: string;
  title: string;
  body: string;
  cta: string;
  tone: 'deep' | 'lagoon';
}) {
  const palette =
    tone === 'deep'
      ? {
          card: 'bg-gradient-to-br from-midsea-deep to-midsea-ocean text-white',
          chip: 'bg-white/20 text-white',
          cta: 'bg-white text-midsea-deep hover:bg-midsea-foam'
        }
      : {
          card: 'bg-gradient-to-br from-midsea-lagoon to-[#0AAFA1] text-white',
          chip: 'bg-white/25 text-white',
          cta: 'bg-white text-midsea-lagoon hover:bg-midsea-foam'
        };

  return (
    <Link
      href={href}
      className={`group flex min-h-[280px] flex-col items-center justify-between rounded-3xl p-8 text-center shadow-wave ring-1 ring-white/10 transition hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-midsea-coral ${palette.card}`}
    >
      <span
        aria-hidden
        className={`grid h-24 w-24 place-items-center rounded-full text-5xl ${palette.chip}`}
      >
        {emoji}
      </span>
      <div className="space-y-2">
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        <p className="text-sm opacity-90">{body}</p>
      </div>
      <span
        className={`inline-flex items-center justify-center rounded-2xl px-6 py-3 text-base font-bold shadow-wave transition group-hover:scale-105 ${palette.cta}`}
      >
        {cta}
      </span>
    </Link>
  );
}
