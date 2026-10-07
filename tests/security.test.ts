import { describe, expect, it, vi } from 'vitest';
import {
  copyTextToClipboard,
  evaluateLoginThrottle,
  getEmptyThrottleState,
  getOwnRecordValue,
  isValidLoginUserId,
  recordLoginFailure,
  recordLoginSuccess,
  sanitizeLoginUserId,
  sanitizeSingleLine,
  sanitizeTimetableItem,
} from '../src/shared/lib/security';

describe('security helpers', () => {
  it('reads own data properties only', () => {
    const record = Object.create({ inherited: 'unsafe' }) as Record<string, unknown>;
    record.own = 'safe';
    Object.defineProperty(record, 'accessor', { get: () => 'unsafe' });

    expect(getOwnRecordValue<string>(record, 'own')).toBe('safe');
    expect(getOwnRecordValue(record, 'inherited')).toBeUndefined();
    expect(getOwnRecordValue(record, 'accessor')).toBeUndefined();
  });

  it('sanitizes single line text', () => {
    expect(sanitizeSingleLine('  Hello\nWorld\t<script>  ', 20)).toBe('Hello World <script>');
  });

  it('validates matric ids defensively', () => {
    expect(isValidLoginUserId('AI210042')).toBe(true);
    expect(isValidLoginUserId('ai210042')).toBe(true);
    expect(isValidLoginUserId('AI 210042')).toBe(false);
    expect(isValidLoginUserId('__proto__')).toBe(false);
    expect(isValidLoginUserId('constructor')).toBe(false);
    expect(sanitizeLoginUserId('__proto__')).toBe('');
  });

  it('throttles repeated login failures', () => {
    let state = getEmptyThrottleState();
    const now = 1_700_000_000_000;

    for (let i = 0; i < 5; i += 1) {
      state = recordLoginFailure(state, now + i);
    }

    const blocked = evaluateLoginThrottle(state, now + 10);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAt).toBeGreaterThan(now);

    state = recordLoginSuccess(state, now + 11);
    const allowed = evaluateLoginThrottle(state, now + 12);
    expect(allowed.allowed).toBe(true);
    expect(allowed.remainingAttempts).toBe(5);
  });

  it('sanitizes timetable items before rendering', () => {
    const item = sanitizeTimetableItem({
      id: '1<script>',
      day: 'isnin',
      course_id: 'CSC2103\n',
      course_name: 'Data Structures <b>and</b> Algorithms',
      group: 'grp01',
      location: 'Lab 3<script>',
      lecturer: 'Dr. Example\nName',
      kehadiran: '100%',
      catatan: 'Line one\nLine two<script>',
    });

    expect(item.id).toBe('1<script>');
    expect(item.day).toBe('ISNIN');
    expect(item.course_name).toBe('Data Structures <b>and</b> Algorithms');
    expect(item.location).toBe('Lab 3<script>');
    expect(item.lecturer).toBe('Dr. Example Name');
    expect(item.catatan).toBe('Line one Line two<script>');
  });

  it('keeps the embedded date when stripping the raw USAS day prefix', () => {
    const item = sanitizeTimetableItem({
      id: '1',
      day: 'days.05-10-2026 (ISNIN)',
      course_id: 'RKS6093',
    });

    expect(item.day).toBe('05-10-2026 (ISNIN)');
  });

  it('removes the clipboard fallback textarea even when copy fails', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('clipboard unavailable'));
    const select = vi.fn(() => {
      throw new Error('copy command blocked');
    });
    const appendChild = vi.fn();
    const removeChild = vi.fn();
    const execCommand = vi.fn(() => {
      throw new Error('copy command blocked');
    });

    vi.stubGlobal('navigator', {
      clipboard: { writeText },
    });
    vi.stubGlobal('document', {
      createElement: vi.fn(() => ({
        value: '',
        style: {},
        setAttribute: vi.fn(),
        select,
      })),
      body: {
        appendChild,
        removeChild,
      },
      execCommand,
    });

    await expect(copyTextToClipboard('hello')).resolves.toBe(false);
    expect(appendChild).toHaveBeenCalledTimes(1);
    expect(removeChild).toHaveBeenCalledTimes(1);
  });
});
