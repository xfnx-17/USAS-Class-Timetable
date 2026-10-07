import { describe, expect, it } from 'vitest';
import { buildWallpaperGridSlots, getWallpaperAxisOffset } from '../src/features/export/lib/wallpaperGrid';

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

describe('getWallpaperAxisOffset', () => {
  it('compresses empty time gaps but preserves class duration', () => {
    const slots = [
      { start: 8 * 60, end: 9 * 60 },
      { start: 10 * 60, end: 11 * 60 },
    ];

    expect(getWallpaperAxisOffset(8 * 60 + 30, slots)).toBe(30);
    expect(getWallpaperAxisOffset(9 * 60, slots)).toBe(60);
    expect(getWallpaperAxisOffset(10 * 60, slots)).toBe(60);
    expect(getWallpaperAxisOffset(10 * 60 + 30, slots)).toBe(90);
    expect(getWallpaperAxisOffset(11 * 60, slots)).toBe(120);
  });
});
