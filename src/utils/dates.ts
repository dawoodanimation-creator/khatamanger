import type { Language } from '../models/ledger';
export function todayISO(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
export function validEntryDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || value < '1900-01-01' || value > todayISO()) return false;
  const d = new Date(`${value}T00:00:00`);
  return Number.isFinite(d.getTime()) && todayISO(d) === value;
}
export function localDate(value: string, language: Language): string {
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en', {
    year: 'numeric', month: 'short', day: 'numeric',
  }).format(new Date(value));
}

/** ISO calendar dates/timestamps only. Date.parse alone normalizes February 30. */
export function validBackupDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T([01]\d|2[0-3]):([0-5]\d):([0-5]\d)(?:\.\d{1,6})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?)?$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  if (+year < 1900 || +year > 2200) return false;
  const calendar = new Date(Date.UTC(+year, +month - 1, +day));
  return calendar.getUTCFullYear() === +year && calendar.getUTCMonth() === +month - 1 && calendar.getUTCDate() === +day && Number.isFinite(Date.parse(value));
}
