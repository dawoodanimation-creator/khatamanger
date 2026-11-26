const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function localDayString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function shouldShowBackupBanner(
  hasData: boolean,
  lastBackupAt: string | null,
  dismissedDate: string | null,
  now: Date = new Date()
): boolean {
  if (!hasData) return false;
  const today = localDayString(now);
  if (dismissedDate === today) return false;
  if (!lastBackupAt) return true;

  const parsed = Date.parse(lastBackupAt);
  if (Number.isNaN(parsed)) return true;

  const elapsedDays = (now.getTime() - parsed) / MS_PER_DAY;
  return elapsedDays >= 7;
}
