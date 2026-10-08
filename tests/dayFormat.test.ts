import { describe, expect, it } from 'vitest';
import {
  extractDatePart,
  extractDayName,
  formatDayDisplay,
  isSameDay,
  normalizeDayLabel,
  sortDayLabels,
  stripDayPrefix,
} from '../src/shared/lib/dayFormat';

const enDays = new Map([
  ['days.ISNIN', 'MONDAY'],
  ['days.SELASA', 'TUESDAY'],
  ['shortDays.ISNIN', 'Mon'],
  ['shortDays.SELASA', 'Tue'],
]);
const t = (key: string) => enDays.get(key) ?? key;

describe('day formatting', () => {
  it('strips the raw USAS localization prefix but keeps the date', () => {
    expect(stripDayPrefix('days.05-10-2026 (ISNIN)')).toBe('05-10-2026 (ISNIN)');
    expect(stripDayPrefix('shortdays.06-10-2026 (SELASA)')).toBe('06-10-2026 (SELASA)');
  });

  it('normalizes labels to uppercase day keys', () => {
    expect(normalizeDayLabel('days.05-10-2026 (isnin)')).toBe('05-10-2026 (ISNIN)');
  });

  it('extracts the weekday from dated, truncated, and plain labels', () => {
    expect(extractDayName('days.05-10-2026 (ISNIN)')).toBe('ISNIN');
    expect(extractDayName('06-10-2026 (SELA)')).toBe('SELASA');
    expect(extractDayName('WEDNESDAY')).toBe('RABU');
  });

  it('extracts the embedded date', () => {
    expect(extractDatePart('days.05-10-2026 (ISNIN)')).toBe('05-10-2026');
    expect(extractDatePart('ISNIN')).toBeNull();
  });

  it('renders only the translated weekday by default and never leaks the prefix', () => {
    expect(formatDayDisplay('days.05-10-2026 (ISNIN)', t)).toBe('MONDAY');
    expect(formatDayDisplay('days.05-10-2026 (ISNIN)', t, { short: true })).toBe('Mon');
    expect(formatDayDisplay('days.05-10-2026 (ISNIN)')).toBe('ISNIN');
  });

  it('includes the embedded date only when withDate is requested', () => {
    expect(formatDayDisplay('days.05-10-2026 (ISNIN)', t, { withDate: true })).toBe('05-10-2026 (MONDAY)');
    expect(formatDayDisplay('days.05-10-2026 (ISNI)', t, { withDate: true })).toBe('05-10-2026 (MONDAY)');
  });

  it('compares day labels regardless of the embedded date', () => {
    expect(isSameDay('days.05-10-2026 (ISNIN)', 'ISNIN')).toBe(true);
    expect(isSameDay('days.05-10-2026 (ISNIN)', 'days.06-10-2026 (SELASA)')).toBe(false);
  });

  it('sorts day labels into Monday-first order', () => {
    expect(sortDayLabels([
      '06-10-2026 (SELASA)',
      '07-10-2026 (RABU)',
      'RABU',
      '08-10-2026 (KHAMIS)',
      '12-10-2026 (ISNIN)',
    ])).toEqual([
      '12-10-2026 (ISNIN)',
      '06-10-2026 (SELASA)',
      '07-10-2026 (RABU)',
      '08-10-2026 (KHAMIS)',
    ]);
  });
});
