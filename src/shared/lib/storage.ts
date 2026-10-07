import type { ThemeName } from '../types/usas';
import { parseJsonObject } from './cache';

const THEME_VALUES = new Set<ThemeName>(['light', 'navy', 'oled', 'emerald']);

export function restoreStringRecord(value: string): Record<string, string> {
  const parsed = parseJsonObject(value);
  if (!parsed) return {};

  const restored: Record<string, string> = {};
  for (const [key, entry] of Object.entries(parsed)) {
    if (typeof entry === 'string') {
      Object.defineProperty(restored, key, { value: entry, enumerable: true, configurable: true, writable: true });
    }
  }

  return restored;
}

export function normalizeThemeName(value: unknown): ThemeName {
  const normalized = String(value ?? '').trim().toLowerCase();
  return THEME_VALUES.has(normalized as ThemeName) ? (normalized as ThemeName) : 'navy';
}
