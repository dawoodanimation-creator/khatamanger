export type NumberFormatMode = 'pk' | 'intl';
export type SortOrder = 'recent' | 'highest' | 'name' | 'oldest';

export interface UiPrefs {
  numberFormat: NumberFormatMode;
  pinnedCustomerIds: string[];
  sortOrder: SortOrder;
  lastBackupAt: string | null;
  backupBannerDismissedDate: string | null;
  reminderTemplate: string | null;
}

export const UI_PREFS_KEY = 'khata-preview.ui.v1';

export function defaultUiPrefs(): UiPrefs {
  return {
    numberFormat: 'pk',
    pinnedCustomerIds: [],
    sortOrder: 'name',
    lastBackupAt: null,
    backupBannerDismissedDate: null,
    reminderTemplate: null,
  };
}

export function readUiPrefs(storage: Pick<Storage, 'getItem'> = localStorage): UiPrefs {
  const defaults = defaultUiPrefs();
  try {
    const raw = storage.getItem(UI_PREFS_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<UiPrefs>;
    if (!parsed || typeof parsed !== 'object') return defaults;

    const numberFormat: NumberFormatMode =
      parsed.numberFormat === 'intl' || parsed.numberFormat === 'pk'
        ? parsed.numberFormat
        : defaults.numberFormat;

    const sortOrder: SortOrder =
      parsed.sortOrder === 'recent' ||
      parsed.sortOrder === 'highest' ||
      parsed.sortOrder === 'name' ||
      parsed.sortOrder === 'oldest'
        ? parsed.sortOrder
        : defaults.sortOrder;

    const pinnedCustomerIds = Array.isArray(parsed.pinnedCustomerIds)
      ? parsed.pinnedCustomerIds.filter((id): id is string => typeof id === 'string')
      : defaults.pinnedCustomerIds;

    const lastBackupAt =
      typeof parsed.lastBackupAt === 'string' && !Number.isNaN(Date.parse(parsed.lastBackupAt))
        ? parsed.lastBackupAt
        : null;

    const backupBannerDismissedDate =
      typeof parsed.backupBannerDismissedDate === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(parsed.backupBannerDismissedDate)
        ? parsed.backupBannerDismissedDate
        : null;

    const reminderTemplate =
      typeof parsed.reminderTemplate === 'string' && parsed.reminderTemplate.trim().length > 0
        ? parsed.reminderTemplate
        : null;

    return {
      numberFormat,
      pinnedCustomerIds,
      sortOrder,
      lastBackupAt,
      backupBannerDismissedDate,
      reminderTemplate,
    };
  } catch {
    return defaults;
  }
}

export function writeUiPrefs(
  prefs: UiPrefs,
  storage: Pick<Storage, 'setItem'> = localStorage
): boolean {
  try {
    storage.setItem(UI_PREFS_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}
