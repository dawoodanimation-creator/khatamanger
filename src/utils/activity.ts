import type { Language } from '../models/ledger';
import type { TranslationKey } from '../i18n';
import { todayISO, localDate } from './dates';

/**
 * Returns a relative or concise date string for customer last activity.
 */
export function formatRelativeActivity(
  dateStr: string | null | undefined,
  language: Language,
  t: (key: TranslationKey, values?: Record<string, string>) => string
): string {
  if (!dateStr) return t('noActivity');

  const todayStr = todayISO();
  const dateOnly = dateStr.slice(0, 10);

  if (dateOnly === todayStr) {
    return t('today');
  }

  // Calculate day difference
  const today = new Date(`${todayStr}T00:00:00`);
  const target = new Date(`${dateOnly}T00:00:00`);
  const diffMs = today.getTime() - target.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 1) {
    return t('yesterday');
  }
  if (diffDays > 1 && diffDays <= 30) {
    return t('daysAgo', { count: String(diffDays) });
  }

  return localDate(dateOnly, language);
}
