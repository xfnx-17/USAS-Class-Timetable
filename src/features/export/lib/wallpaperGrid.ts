export type WallpaperTimeRange = { start: number; end: number };
export type WallpaperGridSlot = WallpaperTimeRange;

export const buildWallpaperGridSlots = (ranges: WallpaperTimeRange[], maxColumns = 8): WallpaperGridSlot[] => {
  const validRanges = ranges
    .map(({ start, end }) => ({ start: Math.max(0, start), end: Math.min(24 * 60, end) }))
    .filter(({ start, end }) => Number.isFinite(start) && Number.isFinite(end) && end > start);

  if (validRanges.length === 0) {
    return Array.from({ length: 9 }, (_, index) => ({
      start: (8 + index) * 60,
      end: (9 + index) * 60,
    }));
  }

  const firstHour = Math.floor(Math.min(...validRanges.map(({ start }) => start)) / 60);
  const lastHour = Math.min(24, Math.ceil(Math.max(...validRanges.map(({ end }) => end)) / 60));
  const activeHours = Array.from({ length: lastHour - firstHour }, (_, index) => firstHour + index)
    .filter((hour) => validRanges.some(({ start, end }) => start < (hour + 1) * 60 && end > hour * 60));
  const periodHours = Math.max(1, Math.ceil(activeHours.length / maxColumns));
  const slots: WallpaperGridSlot[] = [];

  for (const hour of activeHours) {
    const previous = slots[slots.length - 1];
    if (previous && hour * 60 === previous.end && (previous.end - previous.start) < periodHours * 60) {
      previous.end += 60;
    } else {
      slots.push({ start: hour * 60, end: (hour + 1) * 60 });
    }
  }

  const shortRanges = [...new Map(validRanges
    .filter(({ start, end }) => end - start <= 60)
    .map((range) => [`${range.start}:${range.end}`, range])).values()];
  const parts = slots.flatMap((slot) => {
    const boundaries = [...new Set([
      slot.start,
      slot.end,
      ...shortRanges.flatMap(({ start, end }) => [start, end])
        .filter((time) => time > slot.start && time < slot.end),
    ])].sort((a, b) => a - b);

    let start = slot.start;
    return boundaries.slice(1).map((end) => {
      const partStart = start;
      start = end;
      const protectedRange = shortRanges.find((range) => partStart >= range.start && end <= range.end);
      return { start: partStart, end, protectedKey: protectedRange ? `${protectedRange.start}:${protectedRange.end}` : undefined };
    });
  });

  const protectedSlots = parts.reduce<typeof parts>((result, part) => {
    const previous = result[result.length - 1];
    if (part.protectedKey && previous?.protectedKey === part.protectedKey && previous.end === part.start) {
      previous.end = part.end;
    } else {
      result.push(part);
    }
    return result;
  }, []);

  const packed = protectedSlots.reduce<typeof protectedSlots>((result, slot) => {
    const previous = result[result.length - 1];
    if (
      !slot.protectedKey && !previous?.protectedKey && previous?.end === slot.start &&
      slot.end - previous.start <= periodHours * 60
    ) {
      previous.end = slot.end;
    } else {
      result.push(slot);
    }
    return result;
  }, []);

  return packed.map(({ start, end }) => ({ start, end }));
};

export const getWallpaperAxisPosition = (time: number, slots: WallpaperGridSlot[]) => {
  let offset = 0;

  for (const slot of slots) {
    if (time <= slot.start) return offset;
    if (time < slot.end) return offset + (time - slot.start) / (slot.end - slot.start);
    offset += 1;
  }

  return offset;
};
