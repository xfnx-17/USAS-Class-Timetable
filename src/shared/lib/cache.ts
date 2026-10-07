import type { StudentSession, TimetableData } from '../types/usas';
import { getOwnRecordValue, isValidLoginUserId, sanitizeSession, sanitizeTimetableItem, sanitizeTextForShare, sanitizeSingleLine } from './security';
import { normalizeDayLabel, sortDayLabels } from './dayFormat';

const POISON_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function toNonNegativeInteger(value: unknown): number {
  const next = Number(value);
  if (!Number.isFinite(next) || next < 0) return 0;
  return Math.floor(next);
}

function isSafeParsedValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.every(isSafeParsedValue);
  }

  if (typeof value !== 'object' || value === null) {
    return true;
  }

  for (const key of Object.keys(value as Record<string, unknown>)) {
    if (POISON_KEYS.has(key)) return false;
    if (!isSafeParsedValue(getOwnRecordValue(value, key))) return false;
  }

  return true;
}

function hasTimetableContent(item: ReturnType<typeof sanitizeTimetableItem>): boolean {
  return Boolean(
    item.id ||
    item.day ||
    item.course_id ||
    item.kod_kursus ||
    item.course_name ||
    item.kursus ||
    item.start_time ||
    item.end_time ||
    item.location ||
    item.lecturer
  );
}

export function parseJsonObject(value: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }
    if (!isSafeParsedValue(parsed)) {
      return null;
    }
    return parsed as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function restoreSessionFromCache(value: string): StudentSession | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;

  const session = sanitizeSession(parsed as unknown as StudentSession);
  if (!isValidLoginUserId(session.user_id)) return null;
  if (!session.sid_1 || !session.sid_2 || !session.sid_3) return null;

  return session;
}

export function restoreTimetableFromCache(value: string): TimetableData | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;

  const timetable = Array.isArray(parsed.timetable)
    ? parsed.timetable
        .filter((item) => typeof item === 'object' && item !== null && !Array.isArray(item))
        .map((item) => sanitizeTimetableItem(item as never))
        .filter(hasTimetableContent)
    : [];
  const days = Array.isArray(parsed.days)
    ? sortDayLabels(Array.from(new Set(
        parsed.days
          .map((day) => normalizeDayLabel(sanitizeSingleLine(day, 64)))
          .filter(Boolean)
      )))
    : [];

  return {
    success: true,
    days,
    timetable,
    studentName: sanitizeTextForShare(parsed.studentName, 160),
    program: sanitizeTextForShare(parsed.program, 160),
    semester: sanitizeTextForShare(parsed.semester, 64),
  };
}

export function restoreThrottleState(value: string): { failedAttempts: number; lockedUntil: number; lastAttemptAt: number } | null {
  const parsed = parseJsonObject(value);
  if (!parsed) return null;

  return {
    failedAttempts: toNonNegativeInteger(parsed.failedAttempts),
    lockedUntil: toNonNegativeInteger(parsed.lockedUntil),
    lastAttemptAt: toNonNegativeInteger(parsed.lastAttemptAt),
  };
}
