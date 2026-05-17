/**
 * Configuracion central de i18n. CLAUDE.md: "i18n primero".
 * El plugin de next-intl re-exporta desde src/i18n.ts; aqui viven las constantes
 * compartidas entre middleware, layout y componentes.
 */

export const locales = ['es', 'en'] as const;
export const defaultLocale = 'es' as const;

export type Locale = (typeof locales)[number];

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
