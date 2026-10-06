import { describe, expect, it } from 'vitest';
import { buildCourseColorMap, getCourseColorSlot, COURSE_COLOR_SLOTS } from '../src/shared/lib/courseColors';
import type { TimetableItem } from '../src/shared/types/usas';

const makeCourse = (id: string, day = 'ISNIN'): TimetableItem => ({
  id,
  day,
  course_id: id,
  course_name: `Course ${id}`,
  start_time: '08:00 AM',
  end_time: '10:00 AM',
});

describe('courseColors', () => {
  it('assigns a stable slot per distinct course', () => {
    const courses = [makeCourse('RKS6093'), makeCourse('RKS6113'), makeCourse('MKT6043')];
    const map = buildCourseColorMap(courses);

    expect(map.get('RKS6093')).toBe(COURSE_COLOR_SLOTS[0]);
    expect(map.get('RKS6113')).toBe(COURSE_COLOR_SLOTS[1]);
    expect(map.get('MKT6043')).toBe(COURSE_COLOR_SLOTS[2]);
  });

  it('reuses the same slot for duplicate course entries', () => {
    const courses = [makeCourse('RKS6093'), makeCourse('RKS6093', 'SELASA')];
    const map = buildCourseColorMap(courses);

    expect(map.size).toBe(1);
    expect(map.get('RKS6093')).toBe(COURSE_COLOR_SLOTS[0]);
  });

  it('wraps slots when there are more courses than slots', () => {
    const courses = COURSE_COLOR_SLOTS.map((_, i) => makeCourse(`C${i}`));
    const map = buildCourseColorMap(courses);

    expect(map.size).toBe(COURSE_COLOR_SLOTS.length);
    expect(map.get('C0')).toBe(COURSE_COLOR_SLOTS[0]);
  });

  it('handles empty and undefined input', () => {
    expect(buildCourseColorMap([]).size).toBe(0);
    expect(buildCourseColorMap(undefined).size).toBe(0);
  });

  it('ignores courses without an id', () => {
    const courses = [{ id: '', day: 'ISNIN' } as TimetableItem];
    const map = buildCourseColorMap(courses);

    expect(map.size).toBe(0);
  });

  it('is case-insensitive when looking up slots', () => {
    const map = buildCourseColorMap([makeCourse('RKS6093')]);

    expect(getCourseColorSlot(map, 'rks6093')).toBe(COURSE_COLOR_SLOTS[0]);
    expect(getCourseColorSlot(map, 'RKS6093')).toBe(COURSE_COLOR_SLOTS[0]);
  });

  it('returns the first slot for unknown courses', () => {
    const map = buildCourseColorMap([]);

    expect(getCourseColorSlot(map, 'UNKNOWN')).toBe(COURSE_COLOR_SLOTS[0]);
    expect(getCourseColorSlot(map, '')).toBe(COURSE_COLOR_SLOTS[0]);
  });
});
