import { describe, expect, it } from 'vitest';
import { computeAttendancePercent, parseFallbackJadual, parseSafeJsonResponse, selectProfileText } from '../src/services/usas/Api';

describe('usas api fallback timetable parsing', () => {
  it('coerces numeric jadual values safely', () => {
    expect(parseFallbackJadual(12345)).toEqual({ day: 'ISNIN', time: '12345' });
  });

  it('splits day and time for valid fallback values', () => {
    expect(parseFallbackJadual('MON 08:00 AM')).toEqual({ day: 'ISNIN', time: '08:00 AM' });
  });

  it('rejects malformed profile content objects', () => {
    expect(selectProfileText({ bad: 'x' }, 160)).toBeNull();
    expect(selectProfileText(123, 160)).toBe('123');
  });

  it('rejects poison json payloads', () => {
    expect(parseSafeJsonResponse('{"server_response":[{"user_id":"AI210042"}],"__proto__":{"polluted":true}}')).toBeNull();
    expect(parseSafeJsonResponse('{"server_response":[{"user_id":"AI210042"}]}')).toEqual({
      server_response: [{ user_id: 'AI210042' }],
    });
  });
});

describe('computeAttendancePercent', () => {
  it('counts only held sessions and ignores future ones', () => {
    expect(computeAttendancePercent([
      { minggu: '1', tarikh: '05-10-2026', status_hadir: 'Hadir', catatan: '' },
      { minggu: '2', tarikh: '01-01-2099', status_hadir: '', catatan: '' },
    ])).toBe(100);
  });

  it('treats "Tidak Hadir" as absent, not present', () => {
    expect(computeAttendancePercent([
      { tarikh: '01-01-2020', status_hadir: 'Hadir' },
      { tarikh: '02-01-2020', status_hadir: 'Tidak Hadir' },
    ])).toBe(50);
  });

  it('returns null when no session has been held yet', () => {
    expect(computeAttendancePercent([
      { tarikh: '01-01-2099', status_hadir: '' },
    ])).toBeNull();
    expect(computeAttendancePercent([])).toBeNull();
    expect(computeAttendancePercent(null)).toBeNull();
  });
});
