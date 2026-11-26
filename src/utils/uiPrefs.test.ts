import { describe, expect, test } from 'vitest';
import { defaultUiPrefs, readUiPrefs, UI_PREFS_KEY, writeUiPrefs } from './uiPrefs';

describe('uiPrefs', () => {
  test('returns safe defaults when storage is empty or throws or has corrupt JSON', () => {
    const emptyStorage = { getItem: () => null };
    expect(readUiPrefs(emptyStorage)).toEqual(defaultUiPrefs());

    const throwingStorage = {
      getItem: () => {
        throw new Error('blocked');
      },
    };
    expect(readUiPrefs(throwingStorage)).toEqual(defaultUiPrefs());

    const corruptStorage = { getItem: () => '{not valid json' };
    expect(readUiPrefs(corruptStorage)).toEqual(defaultUiPrefs());
  });

  test('validates fields and ignores invalid values while preserving valid ones', () => {
    const map = new Map<string, string>();
    const storage = {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => {
        map.set(k, v);
      },
    };

    const ok = writeUiPrefs(
      {
        numberFormat: 'intl',
        pinnedCustomerIds: ['c1', 'c2'],
        sortOrder: 'highest',
        lastBackupAt: '2026-11-20T10:00:00.000Z',
        backupBannerDismissedDate: '2026-11-25',
        reminderTemplate: 'Hi {name}, please pay {amount}.',
      },
      storage
    );
    expect(ok).toBe(true);
    expect(readUiPrefs(storage)).toEqual({
      numberFormat: 'intl',
      pinnedCustomerIds: ['c1', 'c2'],
      sortOrder: 'highest',
      lastBackupAt: '2026-11-20T10:00:00.000Z',
      backupBannerDismissedDate: '2026-11-25',
      reminderTemplate: 'Hi {name}, please pay {amount}.',
    });

    map.set(
      UI_PREFS_KEY,
      JSON.stringify({
        numberFormat: 'bad',
        pinnedCustomerIds: ['c1', 123],
        sortOrder: 'invalid',
        lastBackupAt: 'not-a-date',
        backupBannerDismissedDate: 'bad-date',
        reminderTemplate: '   ',
      })
    );
    expect(readUiPrefs(storage)).toEqual({
      numberFormat: 'pk',
      pinnedCustomerIds: ['c1'],
      sortOrder: 'name',
      lastBackupAt: null,
      backupBannerDismissedDate: null,
      reminderTemplate: null,
    });
  });

  test('writeUiPrefs returns false when storage throws', () => {
    const throwingWrite = {
      setItem: () => {
        throw new Error('QuotaExceeded');
      },
    };
    expect(writeUiPrefs(defaultUiPrefs(), throwingWrite)).toBe(false);
  });
});
