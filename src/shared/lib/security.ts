import type { StudentSession, TimetableItem } from '../types/usas';
import { normalizeDayLabel } from './dayFormat';

// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;
const WHITESPACE = /\s+/g;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCKOUT_MS = 5 * 60 * 1000;
const POISON_IDENTIFIERS = new Set(['__proto__', 'constructor', 'prototype']);

export function getOwnRecordValue<T>(record: object, key: PropertyKey): T | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(record, key);
  return descriptor && 'value' in descriptor ? descriptor.value as T : undefined;
}

export type LoginThrottleState = {
  failedAttempts: number;
  lockedUntil: number;
  lastAttemptAt: number;
};

export type LoginThrottleResult = {
  allowed: boolean;
  retryAt: number | null;
  remainingAttempts: number;
};

export function sanitizeSingleLine(value: unknown, maxLength = 120): string {
  return String(value ?? '')
    .replace(CONTROL_CHARS, ' ')
    .replace(WHITESPACE, ' ')
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultiLine(value: unknown, maxLength = 500): string {
  return String(value ?? '')
    .replace(/\r\n/g, '\n')
    .replace(CONTROL_CHARS, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}

export function normalizeMatricNo(value: unknown): string {
  return sanitizeSingleLine(value, 32).replace(/[^A-Za-z0-9_-]/g, '');
}

export function sanitizeLoginUserId(value: unknown): string {
  const normalized = normalizeMatricNo(value).toUpperCase();
  return POISON_IDENTIFIERS.has(normalized.toLowerCase()) ? '' : normalized;
}

export function isValidLoginUserId(value: unknown): boolean {
  const normalized = String(value ?? '').trim();
  if (!/^[A-Za-z0-9_-]{4,32}$/.test(normalized)) return false;
  return !POISON_IDENTIFIERS.has(normalized.toLowerCase());
}

export function sanitizeSession(session: StudentSession): StudentSession {
  return {
    ...session,
    user_id: sanitizeLoginUserId(session.user_id),
    sid_1: sanitizeSingleLine(session.sid_1, 256),
    sid_2: sanitizeSingleLine(session.sid_2, 256),
    sid_3: sanitizeSingleLine(session.sid_3, 256),
  };
}

export function sanitizeTimetableItem(item: TimetableItem): TimetableItem {
  return {
    ...item,
    id: sanitizeSingleLine(item.id, 64),
    day: normalizeDayLabel(sanitizeSingleLine(item.day, 64)),
    course_id: sanitizeSingleLine(item.course_id, 64),
    kod_kursus: sanitizeSingleLine(item.kod_kursus, 64),
    course_name: sanitizeSingleLine(item.course_name, 160),
    kursus: sanitizeSingleLine(item.kursus, 160),
    group: sanitizeSingleLine(item.group, 32),
    kumpulan: sanitizeSingleLine(item.kumpulan, 32),
    group_id: sanitizeSingleLine(item.group_id, 32),
    jadual: sanitizeSingleLine(item.jadual, 64),
    start_time: sanitizeSingleLine(item.start_time, 32),
    end_time: sanitizeSingleLine(item.end_time, 32),
    location: sanitizeSingleLine(item.location, 160),
    lecturer: sanitizeSingleLine(item.lecturer, 160),
    pensyarah: sanitizeSingleLine(item.pensyarah, 160),
    kehadiran: sanitizeSingleLine(item.kehadiran, 16),
    catatan: sanitizeMultiLine(item.catatan, 240),
    pelajar: sanitizeSingleLine(item.pelajar, 160),
    student_name: sanitizeSingleLine(item.student_name, 160),
    semester: sanitizeSingleLine(item.semester, 64),
    nama: sanitizeSingleLine(item.nama, 160),
    name: sanitizeSingleLine(item.name, 160),
  };
}

export function sanitizeTextForShare(value: unknown, maxLength = 2000): string {
  return sanitizeMultiLine(value, maxLength);
}

export function isSafeExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && ['wa.me', 't.me'].includes(parsed.hostname);
  } catch {
    return false;
  }
}

export function openExternalUrl(url: string): boolean {
  if (!isSafeExternalUrl(url)) {
    return false;
  }

  const opened = window.open(url, '_blank', 'noopener,noreferrer');
  if (opened) {
    opened.opener = null;
    return true;
  }

  return false;
}

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', 'true');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    document.body.appendChild(textarea);
    try {
      textarea.select();
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

export function getEmptyThrottleState(): LoginThrottleState {
  return {
    failedAttempts: 0,
    lockedUntil: 0,
    lastAttemptAt: 0,
  };
}

export function evaluateLoginThrottle(state: LoginThrottleState, now = Date.now()): LoginThrottleResult {
  if (state.lockedUntil > now) {
    return {
      allowed: false,
      retryAt: state.lockedUntil,
      remainingAttempts: 0,
    };
  }

  return {
    allowed: true,
    retryAt: null,
    remainingAttempts: Math.max(0, MAX_LOGIN_ATTEMPTS - state.failedAttempts),
  };
}

export function recordLoginFailure(state: LoginThrottleState, now = Date.now()): LoginThrottleState {
  const nextAttempts = state.failedAttempts + 1;
  return {
    failedAttempts: nextAttempts,
    lockedUntil: nextAttempts >= MAX_LOGIN_ATTEMPTS ? now + LOGIN_LOCKOUT_MS : 0,
    lastAttemptAt: now,
  };
}

export function recordLoginSuccess(_state: LoginThrottleState, now = Date.now()): LoginThrottleState {
  return {
    failedAttempts: 0,
    lockedUntil: 0,
    lastAttemptAt: now,
  };
}

export function formatRetryAt(retryAt: number | null): string {
  if (!retryAt) return '';
  return new Date(retryAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}
