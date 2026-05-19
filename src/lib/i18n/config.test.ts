import { describe, it, expect } from 'vitest';
import { locales, defaultLocale, isLocale } from './config';

describe('i18n config', () => {
  it('exposes the v1 locales (es, en) with es as default', () => {
    expect([...locales]).toEqual(['es', 'en']);
    expect(defaultLocale).toBe('es');
    expect((locales as readonly string[]).includes(defaultLocale)).toBe(true);
  });

  it('isLocale accepts supported locales', () => {
    expect(isLocale('es')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('isLocale rejects unsupported values', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('es-ES')).toBe(false); // variantes regionales: v2
    expect(isLocale('')).toBe(false);
    expect(isLocale('EN')).toBe(false); // case sensitive
  });
});
