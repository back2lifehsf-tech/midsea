import createMiddleware from 'next-intl/middleware';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n';

/**
 * Middleware: i18n routing + device-claim cookie.
 *
 * Epic 01 §4 — *role enforcement* sigue viviendo en layouts (ver session.ts).
 *
 * Adicional v1: cookie persistente `midsea_device_family` que recuerda la
 * familyId del padre que firmó en este dispositivo. Permite que
 * /student-login liste `family.students` aún después de logout del padre
 * (el caso del flow estudiante: padre se va, hijo entra en el mismo iPad).
 *
 * Sin esta cookie, sin parent session no hay manera de saber qué familia
 * mostrar — y exponer todos los estudiantes del mundo en una pantalla
 * pública es inaceptable.
 *
 * Política:
 *   - Cookie se setea cuando una request lleva un JWT con familyId
 *     (parent logueado) y la cookie está ausente o difiere.
 *   - Cookie NO se borra en logout — el dispositivo queda "claimed".
 *   - Para cambiar de familia: otro padre firma → cookie se sobreescribe.
 *   - JWT parse solo en surfaces autenticadas (parent + student-login +
 *     student) para evitar gastar ciclos en landing/login/signup.
 */

const intl = createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always'
});

const DEVICE_FAMILY_COOKIE = 'midsea_device_family';
const ONE_YEAR_SECONDS = 60 * 60 * 24 * 365;
const AUTH_SURFACE_RE = /^\/(?:es|en)\/(?:parent|student-login|student)(?:\/|$)/;

export default async function middleware(req: NextRequest) {
  const response = intl(req);

  // Solo gastamos JWT parse en rutas que podrían setear o necesitar la cookie.
  if (!AUTH_SURFACE_RE.test(req.nextUrl.pathname)) return response;

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const familyIdFromToken = typeof token?.familyId === 'string' ? token.familyId : null;
    const cookieValue = req.cookies.get(DEVICE_FAMILY_COOKIE)?.value;

    if (familyIdFromToken && familyIdFromToken !== cookieValue) {
      response.cookies.set(DEVICE_FAMILY_COOKIE, familyIdFromToken, {
        maxAge: ONE_YEAR_SECONDS,
        path: '/',
        sameSite: 'lax',
        httpOnly: true
      });
    }
  } catch {
    // JWT corrupto o secret missing — no rompemos la nav.
  }
  return response;
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
