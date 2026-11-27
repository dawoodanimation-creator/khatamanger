import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  defaultUiPrefs,
  readUiPrefs,
  UI_PREFS_KEY,
  writeUiPrefs,
  type NumberFormatMode,
  type QuickItemEntry,
  type SortOrder,
  type UiPrefs,
} from '../utils/uiPrefs';

interface UiPrefsContextValue {
  prefs: UiPrefs;
  setNumberFormat: (mode: NumberFormatMode) => void;
  setSortOrder: (order: SortOrder) => void;
  togglePinCustomer: (customerId: string) => void;
  recordBackupNow: () => void;
  dismissBackupBannerToday: (today: string) => void;
  setReminderTemplate: (template: string | null) => void;
  addCustomCustomerCategory: (category: string) => void;
  addCustomUdhaarCategory: (category: string) => void;
  recordQuickItems: (items: Array<{ name: string; pricePaisa?: number }>) => void;
}

const UiPrefsContext = createContext<UiPrefsContextValue | null>(null);

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<UiPrefs>(() =>
    typeof localStorage !== 'undefined' ? readUiPrefs(localStorage) : defaultUiPrefs()
  );

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === UI_PREFS_KEY || event.key === null) {
        setPrefs(readUiPrefs(localStorage));
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  function update(updater: (prev: UiPrefs) => UiPrefs) {
    setPrefs(prev => {
      const next = updater(prev);
      if (typeof localStorage !== 'undefined') writeUiPrefs(next, localStorage);
      return next;
    });
  }

  const value: UiPrefsContextValue = {
    prefs,
    setNumberFormat: numberFormat => update(prev => ({ ...prev, numberFormat })),
    setSortOrder: sortOrder => update(prev => ({ ...prev, sortOrder })),
    togglePinCustomer: customerId =>
      update(prev => {
        const exists = prev.pinnedCustomerIds.includes(customerId);
        return {
          ...prev,
          pinnedCustomerIds: exists
            ? prev.pinnedCustomerIds.filter(id => id !== customerId)
            : [...prev.pinnedCustomerIds, customerId],
        };
      }),
    recordBackupNow: () => update(prev => ({ ...prev, lastBackupAt: new Date().toISOString() })),
    dismissBackupBannerToday: today =>
      update(prev => ({ ...prev, backupBannerDismissedDate: today })),
    setReminderTemplate: template =>
      update(prev => ({
        ...prev,
        reminderTemplate: template && template.trim().length > 0 ? template : null,
      })),
    addCustomCustomerCategory: category =>
      update(prev => {
        const clean = category.trim();
        const current = prev.customCustomerCategories ?? [];
        if (!clean || current.includes(clean)) return prev;
        return { ...prev, customCustomerCategories: [...current, clean] };
      }),
    addCustomUdhaarCategory: category =>
      update(prev => {
        const clean = category.trim();
        const current = prev.customUdhaarCategories ?? [];
        if (!clean || current.includes(clean)) return prev;
        return { ...prev, customUdhaarCategories: [...current, clean] };
      }),
    recordQuickItems: items =>
      update(prev => {
        const map = new Map<string, QuickItemEntry>(
          (prev.quickItems ?? []).map(q => [q.name.toLowerCase(), { ...q }])
        );
        for (const it of items) {
          const cleanName = it.name.trim();
          if (!cleanName) continue;
          const key = cleanName.toLowerCase();
          const existing = map.get(key);
          if (existing) {
            existing.count += 1;
            if (it.pricePaisa !== undefined) existing.defaultPricePaisa = it.pricePaisa;
          } else {
            map.set(key, {
              name: cleanName,
              count: 1,
              ...(it.pricePaisa !== undefined ? { defaultPricePaisa: it.pricePaisa } : {}),
            });
          }
        }
        const sorted = [...map.values()].sort((a, b) => b.count - a.count).slice(0, 20);
        return { ...prev, quickItems: sorted };
      }),
  };

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs(): UiPrefsContextValue {
  const ctx = useContext(UiPrefsContext);
  if (ctx) return ctx;
  const fallback =
    typeof localStorage !== 'undefined' ? readUiPrefs(localStorage) : defaultUiPrefs();
  return {
    prefs: fallback,
    setNumberFormat: () => {},
    setSortOrder: () => {},
    togglePinCustomer: () => {},
    recordBackupNow: () => {},
    dismissBackupBannerToday: () => {},
    setReminderTemplate: () => {},
    addCustomCustomerCategory: () => {},
    addCustomUdhaarCategory: () => {},
    recordQuickItems: () => {},
  };
}
