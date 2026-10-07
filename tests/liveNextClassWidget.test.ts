import { describe, expect, it } from 'vitest';
import { buildDayScopedNotificationKey } from '../src/shared/lib/notificationKeys';
import { isPrayerNotificationDue, isWithinClassNotificationWindow } from '../src/shared/lib/notificationTiming';

describe('live next class notification key', () => {
  it('includes the local date so weekly reminders can trigger again later', () => {
    const course = {
      course_id: 'CSC2103',
      day: 'ISNIN',
      start_time: '08:30 AM',
    };

    const monday = new Date(2026, 7, 3, 8, 0, 0);
    const nextMonday = new Date(2026, 7, 10, 8, 0, 0);

    expect(buildDayScopedNotificationKey(monday, course.course_id, course.day, course.start_time)).toBe('2026-08-03-CSC2103-ISNIN-08:30 AM');
    expect(buildDayScopedNotificationKey(nextMonday, course.course_id, course.day, course.start_time)).toBe('2026-08-10-CSC2103-ISNIN-08:30 AM');
  });
});

describe('notification timing', () => {
  it('does not fire prayer alerts before prayer time', () => {
    expect(isPrayerNotificationDue(1)).toBe(false);
    expect(isPrayerNotificationDue(0)).toBe(true);
    expect(isPrayerNotificationDue(-60)).toBe(true);
    expect(isPrayerNotificationDue(-61)).toBe(false);
  });

  it('keeps class alerts inside the 15-minute lead window', () => {
    expect(isWithinClassNotificationWindow(15 * 60 * 1000)).toBe(true);
    expect(isWithinClassNotificationWindow(1)).toBe(true);
    expect(isWithinClassNotificationWindow(15 * 60 * 1000 + 1)).toBe(false);
    expect(isWithinClassNotificationWindow(0)).toBe(false);
  });
});
