import { describe, expect, it } from 'vitest';
import { translations } from '../src/shared/i18n/translations';

describe('translations', () => {
  const languages = ['ms', 'en', 'zh', 'ta'] as const;
  const dictionaries = Object.values(translations);

  it('has all four languages', () => {
    expect(Object.keys(translations).sort()).toEqual([...languages].sort());
  });

  it('has consistent top-level keys across all languages', () => {
    const reference = dictionaries[0];
    expect(reference).toBeDefined();
    if (!reference) return;
    const referenceKeys = Object.keys(reference).sort();
    for (const dictionary of dictionaries) {
      expect(Object.keys(dictionary).sort()).toEqual(referenceKeys);
    }
  });

  it('has non-empty string values for all top-level keys', () => {
    for (const dictionary of dictionaries) {
      for (const value of Object.values(dictionary)) {
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
    for (const dictionary of dictionaries) {
      for (const day of days) {
        expect(Object.hasOwn(dictionary.days, day)).toBe(true);
        expect(Object.hasOwn(dictionary.shortDays, day)).toBe(true);
      }
    }
  });

  it('has unique day translations per language', () => {
    for (const dictionary of dictionaries) {
      const dayValues = Object.values(dictionary.days);
      expect(new Set(dayValues).size).toBe(7);
    }
  });

  it('has unique shortDays translations per language', () => {
    for (const dictionary of dictionaries) {
      const shortValues = Object.values(dictionary.shortDays);
      expect(new Set(shortValues).size).toBe(7);
    }
  });
});
