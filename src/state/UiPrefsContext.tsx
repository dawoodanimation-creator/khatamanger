import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  defaultUiPrefs,
  readUiPrefs,
  UI_PREFS_KEY,
  writeUiPrefs,
  type NumberFormatMode,
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
  };

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs(): UiPrefsContextValue {
  const ctx = useContext(UiPrefsContext);
  if (ctx) return ctx;
  // Safe fallback for isolated tests rendering components without UiPrefsProvider.
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
  };
}
