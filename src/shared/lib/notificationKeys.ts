export function getLocalDateStamp(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDayScopedNotificationKey(now: Date, ...parts: Array<string | undefined>): string {
  return [getLocalDateStamp(now), ...parts.map((part) => String(part ?? ''))].join('-');
}

export function pruneDayScopedNotificationKeys(
  store: ReadonlySet<string>,
  now: Date,
): Set<string> {
  const prefix = `${getLocalDateStamp(now)}-`;
  return new Set([...store].filter((key) => key.startsWith(prefix)));
}
