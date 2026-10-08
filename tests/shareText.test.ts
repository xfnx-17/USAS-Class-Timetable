import { describe, expect, it } from 'vitest';
import { buildCompactShareText, buildFullShareText } from '../src/features/export/lib/shareText';

describe('share text builders', () => {
  const timetable = [
    {
      day: 'isnin',
      start_time: '08:00 AM',
      end_time: '10:00 AM',
      course_id: 'CSC2103\nINJECT',
      course_name: 'Data Structures\nSecond line',
      group: 'GRP01',
      location: 'Lab 1\r\nBlock A',
    },
  ] as never;

  it('sanitizes full share text', () => {
    const text = buildFullShareText(timetable, 'Aiman\nAdmin', 'AI210042\r\nX');
    expect(text).toContain('Aiman Admin');
    expect(text).toContain('AI210042 X');
    expect(text).not.toContain('\nINJECT');
    expect(text).toContain('Data Structures Second line');
    expect(text).toContain('Lab 1 Block A');
  });

  it('sanitizes compact share text', () => {
    const text = buildCompactShareText(timetable, 'AI210042\nX');
    expect(text).toContain('AI210042 X');
    expect(text).not.toContain('\nINJECT');
  });

  it('uses the selected time format in shared schedules', () => {
    expect(buildFullShareText(timetable, '', '', '12h')).toContain('8:00 AM - 10:00 AM');
    expect(buildCompactShareText(timetable, '', '12h')).toContain('8:00 AM-10:00 AM');
  });
});
