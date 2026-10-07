export type WallpaperTimeRange = { start: number; end: number };
export type WallpaperGridSlot = WallpaperTimeRange & { weight: number };

export const buildWallpaperGridSlots = (ranges: WallpaperTimeRange[]): WallpaperGridSlot[] => {
  const validRanges = ranges
    .map(({ start, end }) => ({ start: Math.max(0, start), end: Math.min(24 * 60, end) }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start);

  if (validRanges.length === 0) {
    return Array.from({ length: 9 }, (_, index) => ({
      start: (8 + index) * 60,
      end: (9 + index) * 60,
      weight: 1,
    }));
  }

  const boundaries = [...new Set(validRanges.flatMap(({ start, end }) => [start, end]))]
    .sort((left, right) => left - right);

  return boundaries.slice(0, -1).map((start, index) => {
    const end = boundaries[index + 1];
    const occupied = validRanges.some((range) => range.start <= start && range.end >= end);
    return { start, end, weight: occupied ? (end - start) / 60 : 1 };
  });
};
