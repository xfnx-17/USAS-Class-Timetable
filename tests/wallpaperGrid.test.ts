import { describe, expect, it } from 'vitest';
import { buildWallpaperGridSlots, getWallpaperAxisPosition } from '../src/features/export/lib/wallpaperGrid';

describe('buildWallpaperGridSlots', () => {
  it('skips empty hours and keeps one-hour periods', () => {
    expect(buildWallpaperGridSlots([
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
    expect(buildWallpaperGridSlots([{ start: 23 * 60, end: 25 * 60 }])).toEqual([
      { start: 23 * 60, end: 24 * 60 },
    ]);
  });

  it('keeps a short daytime schedule short', () => {
    expect(buildWallpaperGridSlots([{ start: 13 * 60, end: 14 * 60 }])).toEqual([
      { start: 13 * 60, end: 14 * 60 },
    ]);
  });

  it('groups active hours when they exceed the column limit', () => {
    expect(buildWallpaperGridSlots([{ start: 8 * 60, end: 18 * 60 }], 8)).toEqual([
      { start: 8 * 60, end: 10 * 60 },
      { start: 10 * 60, end: 12 * 60 },
      { start: 12 * 60, end: 14 * 60 },
      { start: 14 * 60, end: 16 * 60 },
      { start: 16 * 60, end: 18 * 60 },
    ]);
  });
});

describe('getWallpaperAxisPosition', () => {
  it('compresses gaps and gives each displayed period equal width', () => {
    const slots = [
      { start: 8 * 60, end: 10 * 60 },
      { start: 10 * 60, end: 12 * 60 },
      { start: 22 * 60, end: 23 * 60 },
    ];

    expect(getWallpaperAxisPosition(9 * 60, slots)).toBe(0.5);
    expect(getWallpaperAxisPosition(10 * 60, slots)).toBe(1);
    expect(getWallpaperAxisPosition(11 * 60, slots)).toBe(1.5);
    expect(getWallpaperAxisPosition(22 * 60 + 30, slots)).toBe(2.5);
    expect(getWallpaperAxisPosition(23 * 60, slots)).toBe(3);
  });
});
