import { describe, expect, it } from 'vitest';
import type { TimetableItem } from '../src/shared/types/usas';
import {
  buildHourlyTimeSlots,
  getActiveCourseHighlights,
  getCourseHighlightKey,
  getDayKeyFromDate,
  getShortTimeRange,
  formatHourSlot,
  getTimeRangePosition,
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

  it('builds grid slots through late evening classes', () => {
    expect(buildHourlyTimeSlots(13, 13)).toEqual(['13:00']);
    expect(buildHourlyTimeSlots(22, 22)).toEqual(['22:00']);
    expect(buildHourlyTimeSlots(20, 22)).toEqual(['20:00', '21:00', '22:00']);
    expect(buildHourlyTimeSlots(17, 22)).toEqual([
      '17:00', '18:00', '19:00', '20:00', '21:00', '22:00',
    ]);
  });

  it('positions classes accurately to each minute, not only half hours', () => {
    expect(getTimeRangePosition(8 * 60 + 10, 9 * 60 + 10, 8 * 60, 2 * 60)).toMatchObject({ width: 50 });
    expect(getTimeRangePosition(8 * 60 + 10, 9 * 60 + 10, 8 * 60, 2 * 60).left).toBeCloseTo(100 / 12);
    expect(getTimeRangePosition(8 * 60 + 20, 9 * 60 + 20, 8 * 60, 2 * 60).left).toBeCloseTo(100 / 6);
    expect(getTimeRangePosition(8 * 60 + 30, 9 * 60 + 30, 8 * 60, 2 * 60).left).toBe(25);
  });

  it('rejects text that only contains a time-like number', () => {
    expect(parseTimeToMinutes('course starts around 8 somewhere')).toBeNull();
  });

  it('formats short time ranges', () => {
    expect(getShortTimeRange('08:00 AM', '10:00 AM')).toBe('8:00-10:00');
    expect(getShortTimeRange('01:00 PM', '03:00 PM')).toBe('13:00-15:00');
    expect(getShortTimeRange('08:10 AM', '09:10 AM')).toBe('8:10-9:10');
    expect(getShortTimeRange('08:20 AM', '09:20 AM')).toBe('8:20-9:20');
    expect(getShortTimeRange('08:30 AM', '10:30 AM')).toBe('8:30-10:30');
    expect(getShortTimeRange('08:50 AM', '09:50 AM')).toBe('8:50-9:50');
    expect(getShortTimeRange('08:30 AM', '10:30 AM', '12h')).toBe('8:30 AM-10:30 AM');
    expect(getShortTimeRange('01:00 PM', '03:30 PM', '12h')).toBe('1:00 PM-3:30 PM');
    expect(getShortTimeRange('11:30 PM', '12:30 AM', '12h')).toBe('11:30 PM-12:30 AM');
    expect(formatHourSlot(8, 9, '12h')).toBe('8-9 AM');
    expect(formatHourSlot(12, 13, '12h')).toBe('12-1 PM');
    expect(formatHourSlot(23, 24, '12h')).toBe('11 PM-12 AM');
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
