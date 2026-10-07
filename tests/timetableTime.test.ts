import { describe, expect, it } from 'vitest';
import type { TimetableItem } from '../src/shared/types/usas';
import {
  getActiveCourseHighlights,
  getCourseHighlightKey,
  getDayKeyFromDate,
  getShortTimeRange,
  parseTimeToMinutes,
  parseTo24hHour,
} from '../src/shared/lib/timetableTime';

describe('timetableTime', () => {
  it('parses 12 hour and 24 hour times', () => {
    expect(parseTo24hHour('08:00 AM')).toBe(8);
    expect(parseTo24hHour('01:00 PM')).toBe(13);
    expect(parseTimeToMinutes('08:30 AM')).toBe(510);
    expect(parseTimeToMinutes('14:15')).toBe(855);
    expect(parseTimeToMinutes('12:00 AM')).toBe(0);
  });

  it('rejects text that only contains a time-like number', () => {
    expect(parseTimeToMinutes('course starts around 8 somewhere')).toBeNull();
  });

  it('formats short time ranges', () => {
    expect(getShortTimeRange('08:00 AM', '10:00 AM')).toBe('8-10');
    expect(getShortTimeRange('01:00 PM', '03:00 PM')).toBe('13-15');
  });

  it('builds stable highlight keys', () => {
    const course = {
      course_id: 'CSC2103',
      day: 'ISNIN',
      start_time: '08:00 AM',
      end_time: '10:00 AM',
    } as TimetableItem;

    expect(getCourseHighlightKey(course)).toBe('CSC2103|ISNIN|08:00 AM|10:00 AM');
  });

  it('detects the current and next class only for the active day', () => {
    const timetable = [
      {
        course_id: 'MATH101',
        day: 'ISNIN',
        start_time: '08:00 AM',
        end_time: '09:00 AM',
      },
      {
        course_id: 'CSC2103',
        day: 'ISNIN',
        start_time: '09:00 AM',
        end_time: '10:00 AM',
      },
      {
        course_id: 'MKT2001',
        day: 'SELASA',
        start_time: '09:00 AM',
        end_time: '10:00 AM',
      },
    ] as TimetableItem[];

    const now = new Date('2026-08-03T08:30:00');
    const highlights = getActiveCourseHighlights(timetable, now);

    expect(getDayKeyFromDate(now)).toBe('ISNIN');
    expect(highlights.ongoingKey).toBe('MATH101|ISNIN|08:00 AM|09:00 AM');
    expect(highlights.upcomingKey).toBe('CSC2103|ISNIN|09:00 AM|10:00 AM');
  });

  it('treats missing end time as a one hour fallback slot', () => {
    const timetable = [
      {
        course_id: 'CSC3001',
        day: 'ISNIN',
        start_time: '08:00 AM',
      },
      {
        course_id: 'CSC3002',
        day: 'ISNIN',
        start_time: '09:00 AM',
      },
    ] as TimetableItem[];

    const now = new Date('2026-08-03T08:30:00');
    const highlights = getActiveCourseHighlights(timetable, now);

    expect(highlights.ongoingKey).toBe('CSC3001|ISNIN|08:00 AM|');
    expect(highlights.upcomingKey).toBe('CSC3002|ISNIN|09:00 AM|');
  });
});
