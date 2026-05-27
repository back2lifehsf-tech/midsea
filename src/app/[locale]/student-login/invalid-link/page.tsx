/**
 * /student-login/invalid-link — Mejora 11 (Device Pairing).
 *
 * Pantalla de error cuando el token de vinculación es inválido o expiró.
 * ?reason=expired → token expirado
 * ?reason=not_found → token no existe
 */
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function InvalidLinkPage({
  params: { locale },
  searchParams
}: {
  params: { locale: string };
  searchParams: { reason?: string };
}) {
  const t = await getTranslations({ locale, namespace: 'student.noDevice' });
  const isExpired = searchParams.reason === 'expired';

  return (
    <div className="flex min-h-screen items-center justify-center bg-midsea-sand px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-50 text-5xl">
          🔗
        </div>

        <div className="space-y-2">
          <h1 className="font-display text-xl font-bold text-midsea-deep">
            {isExpired ? 'Este link expiró' : 'Link inválido'}
          </h1>
          <p className="text-sm leading-relaxed text-midsea-ink/70">
            {t('invalidLink')}
          </p>
        </div>

        <Link
          href={`/${locale}/login`}
          className="inline-flex w-full items-center justify-center rounded-xl bg-midsea-deep px-5 py-3 text-sm font-semibold text-white shadow-wave transition hover:bg-midsea-lagoon"
        >
          Entrar como padre para generar uno nuevo
        </Link>
      </div>
    </div>
  );
}
