export function isWithinClassNotificationWindow(diffMs: number): boolean {
  return diffMs > 0 && diffMs <= 15 * 60 * 1000;
}

export function isPrayerNotificationDue(diffSeconds: number): boolean {
  return diffSeconds <= 0 && diffSeconds >= -60;
}
