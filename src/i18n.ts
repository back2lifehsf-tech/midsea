import { getRequestConfig } from 'next-intl/server';
import { isLocale, locales, defaultLocale, type Locale } from './lib/i18n/config';

export { locales, defaultLocale };
export type { Locale };

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = requested && isLocale(requested) ? requested : defaultLocale;

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    timeZone: 'America/Santo_Domingo',
    now: new Date()
  };
});
