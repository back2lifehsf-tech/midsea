import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n';

/**
 * Middleware: solo i18n routing (next-intl).
 *
 * Epic 01 §4 — role enforcement NO está aquí. Razones:
 *   - El check de rol requiere leer + verificar el JWT de NextAuth en cada
 *     request, lo que duplica latencia para rutas que ya hacen el guard en
 *     server-component layout (`requireParent`, `requireStudent`).
 *   - El enforcement layout-side es la fuente de verdad y suficiente para
 *     los criterios del epic (parent→/student redirige a /student-login,
 *     student→/parent redirige a /student).
 *   - Si en Epic 02 queremos defense-in-depth con redirects en milliseconds,
 *     reintroducimos el check aquí con `getToken` de next-auth/jwt.
 */
export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always'
});

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
