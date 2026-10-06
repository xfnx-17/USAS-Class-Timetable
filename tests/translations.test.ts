import { describe, expect, it } from 'vitest';
import { translations } from '../src/shared/i18n/translations';

describe('translations', () => {
  const languages = ['ms', 'en', 'zh', 'ta'] as const;

  it('has all four languages', () => {
    for (const lang of languages) {
      expect(translations[lang]).toBeDefined();
    }
  });

  it('has consistent top-level keys across all languages', () => {
    const msKeys = Object.keys(translations.ms).sort();
    for (const lang of languages) {
      const langKeys = Object.keys(translations[lang]).sort();
      expect(langKeys).toEqual(msKeys);
    }
  });

  it('has non-empty string values for all top-level keys', () => {
    for (const lang of languages) {
      for (const [key, value] of Object.entries(translations[lang])) {
        if (typeof value === 'object' && value !== null) {
          expect(Object.keys(value).length).toBeGreaterThan(0);
        } else {
          expect(typeof value).toBe('string');
          expect((value as string).length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has day and shortDays sub-objects with all 7 days', () => {
    const days = ['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'];
    for (const lang of languages) {
      for (const day of days) {
        expect(translations[lang].days[day]).toBeDefined();
        expect(translations[lang].shortDays[day]).toBeDefined();
      }
    }
  });

  it('has unique day translations per language', () => {
    for (const lang of languages) {
      const dayValues = Object.values(translations[lang].days);
      expect(new Set(dayValues).size).toBe(7);
    }
  });

  it('has unique shortDays translations per language', () => {
    for (const lang of languages) {
      const shortValues = Object.values(translations[lang].shortDays);
      expect(new Set(shortValues).size).toBe(7);
    }
  });
});
