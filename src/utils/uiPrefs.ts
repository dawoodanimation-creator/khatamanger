export type NumberFormatMode = 'pk' | 'intl';
export type SortOrder = 'recent' | 'highest' | 'name' | 'oldest';

export interface QuickItemEntry {
  name: string;
  count: number;
  defaultPricePaisa?: number;
}

export interface UiPrefs {
  numberFormat: NumberFormatMode;
  pinnedCustomerIds: string[];
  sortOrder: SortOrder;
  lastBackupAt: string | null;
  backupBannerDismissedDate: string | null;
  reminderTemplate: string | null;
  customCustomerCategories?: string[];
  customUdhaarCategories?: string[];
  quickItems?: QuickItemEntry[];
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

    const customCustomerCategories = Array.isArray(parsed.customCustomerCategories)
      ? parsed.customCustomerCategories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      : [];

    const customUdhaarCategories = Array.isArray(parsed.customUdhaarCategories)
      ? parsed.customUdhaarCategories.filter((c): c is string => typeof c === 'string' && c.trim().length > 0)
      : [];

    const quickItems: QuickItemEntry[] = Array.isArray(parsed.quickItems)
      ? parsed.quickItems.filter(
          (item): item is QuickItemEntry =>
            !!item &&
            typeof item === 'object' &&
            typeof item.name === 'string' &&
            item.name.trim().length > 0 &&
            typeof item.count === 'number' &&
            item.count > 0
        )
      : [];

    const result: UiPrefs = {
      numberFormat,
      pinnedCustomerIds,
      sortOrder,
      lastBackupAt,
      backupBannerDismissedDate,
      reminderTemplate,
    };
    if (customCustomerCategories.length > 0) {
      result.customCustomerCategories = customCustomerCategories;
    }
    if (customUdhaarCategories.length > 0) {
      result.customUdhaarCategories = customUdhaarCategories;
    }
    if (quickItems.length > 0) {
      result.quickItems = quickItems;
    }
    return result;
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
