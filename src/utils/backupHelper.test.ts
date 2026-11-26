import { describe, expect, test } from 'vitest';
import { shouldShowBackupBanner } from './backupHelper';

describe('backupHelper', () => {
  const now = new Date('2026-11-26T12:00:00.000Z');

  test('never shows when ledger has no data', () => {
    expect(shouldShowBackupBanner(false, null, null, now)).toBe(false);
  });

  test('shows when never backed up, hides for 3 days ago, shows for 8 days ago', () => {
    expect(shouldShowBackupBanner(true, null, null, now)).toBe(true);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(shouldShowBackupBanner(true, threeDaysAgo, null, now)).toBe(false);
    const eightDaysAgo = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString();
    expect(shouldShowBackupBanner(true, eightDaysAgo, null, now)).toBe(true);
  });

  test('respects dismissal until the next day', () => {
    expect(shouldShowBackupBanner(true, null, '2026-11-26', now)).toBe(false);
    expect(shouldShowBackupBanner(true, null, '2026-11-25', now)).toBe(true);
  });
});
