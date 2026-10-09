import { describe, expect, it } from 'vitest';
import {
  buildAdaptiveTimeSlots,
  formatAdaptiveSlotLabel,
  getAdaptiveAxisPosition,
} from '../src/shared/lib/adaptiveTimeGrid';

describe('buildAdaptiveTimeSlots', () => {
  it('skips empty hours and keeps one-hour periods', () => {
    expect(buildAdaptiveTimeSlots([
      { start: 8 * 60 + 30, end: 10 * 60 + 30 },
      { start: 11 * 60, end: 13 * 60 },
      { start: 14 * 60 + 30, end: 16 * 60 + 30 },
    ])).toEqual([
      { start: 8 * 60, end: 9 * 60 },
      { start: 9 * 60, end: 10 * 60 },
      { start: 10 * 60, end: 11 * 60 },
      { start: 11 * 60, end: 12 * 60 },
      { start: 12 * 60, end: 13 * 60 },
      { start: 14 * 60, end: 15 * 60 },
      { start: 15 * 60, end: 16 * 60 },
      { start: 16 * 60, end: 17 * 60 },
    ]);
  });

  it('caps periods at midnight', () => {
    expect(buildAdaptiveTimeSlots([{ start: 23 * 60, end: 25 * 60 }])).toEqual([
      { start: 23 * 60, end: 24 * 60 },
    ]);
  });

  it('keeps a short daytime schedule short', () => {
    expect(buildAdaptiveTimeSlots([{ start: 13 * 60, end: 14 * 60 }])).toEqual([
      { start: 13 * 60, end: 14 * 60 },
    ]);
  });

  it('groups active hours when they exceed the column limit', () => {
    expect(buildAdaptiveTimeSlots([{ start: 8 * 60, end: 18 * 60 }], 8)).toEqual([
      { start: 8 * 60, end: 10 * 60 },
      { start: 10 * 60, end: 12 * 60 },
      { start: 12 * 60, end: 14 * 60 },
      { start: 14 * 60, end: 16 * 60 },
      { start: 16 * 60, end: 18 * 60 },
    ]);
  });

  it('gives a one-hour class its own column inside a grouped period', () => {
    expect(buildAdaptiveTimeSlots([
      { start: 10 * 60, end: 12 * 60 },
      { start: 11 * 60, end: 13 * 60 },
      { start: 14 * 60, end: 15 * 60 },
      { start: 16 * 60, end: 17 * 60 },
      { start: 20 * 60, end: 23 * 60 + 30 },
      { start: 14 * 60, end: 17 * 60 },
    ], 8)).toEqual([
      { start: 10 * 60, end: 12 * 60 },
      { start: 12 * 60, end: 13 * 60 },
      { start: 14 * 60, end: 15 * 60 },
      { start: 15 * 60, end: 16 * 60 },
      { start: 16 * 60, end: 17 * 60 },
      { start: 20 * 60, end: 22 * 60 },
      { start: 22 * 60, end: 24 * 60 },
    ]);
  });
});

describe('getAdaptiveAxisPosition', () => {
  it('compresses gaps and gives each displayed period equal width', () => {
    const slots = [
      { start: 8 * 60, end: 10 * 60 },
      { start: 10 * 60, end: 12 * 60 },
      { start: 22 * 60, end: 23 * 60 },
    ];

    expect(getAdaptiveAxisPosition(9 * 60, slots)).toBe(0.5);
    expect(getAdaptiveAxisPosition(10 * 60, slots)).toBe(1);
    expect(getAdaptiveAxisPosition(11 * 60, slots)).toBe(1.5);
    expect(getAdaptiveAxisPosition(22 * 60 + 30, slots)).toBe(2.5);
    expect(getAdaptiveAxisPosition(23 * 60, slots)).toBe(3);
  });
});

describe('formatAdaptiveSlotLabel', () => {
  it('formats grouped periods without AM/PM and keeps half-hour boundaries precise', () => {
    expect(formatAdaptiveSlotLabel(11 * 60, 13 * 60, '12h')).toBe('11-1');
    expect(formatAdaptiveSlotLabel(14 * 60 + 30, 15 * 60, '24h')).toBe('14:30');
    expect(formatAdaptiveSlotLabel(14 * 60 + 30, 16 * 60 + 30, '24h')).toBe('14:30-16:30');
  });
});
