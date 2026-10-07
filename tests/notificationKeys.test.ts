import { describe, expect, it } from 'vitest';
import { buildDayScopedNotificationKey, pruneDayScopedNotificationKeys } from '../src/shared/lib/notificationKeys';

describe('notification keys', () => {
  it('builds a day scoped key', () => {
    const stamp = new Date(2026, 7, 5, 12, 0, 0);

    expect(buildDayScopedNotificationKey(stamp, 'CSC2103', 'ISNIN', '08:30 AM')).toBe('2026-08-05-CSC2103-ISNIN-08:30 AM');
  });

  it('prunes keys from older days', () => {
    const store = new Set([
      '2026-08-04-CSC2103-ISNIN-08:30 AM',
      '2026-08-05-CSC2103-ISNIN-08:30 AM',
      '2026-08-05-MTH1001-SELASA-09:00 AM',
    ]);

    expect(pruneDayScopedNotificationKeys(store, new Date(2026, 7, 5, 12, 0, 0))).toEqual(new Set([
      '2026-08-05-CSC2103-ISNIN-08:30 AM',
      '2026-08-05-MTH1001-SELASA-09:00 AM',
    ]));
  });
});
