import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n';
import { SessionProvider } from '@/components/auth/SessionProvider';
import '../globals.css';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'meta' });
  return {
    title: t('title'),
    description: t('description')
  };
}

// El layout raiz solo monta html/body + providers. Cada espacio (landing,
// parent, student, login) gestiona su propio chrome — la landing tiene
// LandingNav, parent/student tienen su nav role-specific, login centra
// su propia identidad.
export default async function LocaleLayout({
  children,
  params: { locale }
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  if (!locales.includes(locale as Locale)) notFound();

  const messages = await getMessages();

  return (
    <html lang={locale} className="scroll-smooth">
      <body className="midsea-gradient">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SessionProvider>{children}</SessionProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
