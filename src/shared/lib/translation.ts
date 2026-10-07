import { getOwnRecordValue } from './security';

export function lookupTranslationValue(root: unknown, key: string): string | undefined {
  if (typeof key !== 'string' || !key.trim()) return undefined;

  const keys = key.split('.');
  let value: unknown = root;

  for (const part of keys) {
    if (typeof value !== 'object' || value === null) return undefined;
    if (!Object.prototype.hasOwnProperty.call(value, part)) return undefined;
    value = getOwnRecordValue(value, part);
  }

  return typeof value === 'string' ? value : undefined;
}
