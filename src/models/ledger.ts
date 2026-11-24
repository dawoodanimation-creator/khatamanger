import type { Customer } from './customer';
import type { LedgerTransaction } from './transaction';
export type Language = 'en' | 'ur';
export interface AppSettings {
  language: Language;
  darkMode: boolean;
  hideBalances?: boolean;
  pin?: string;
}
export interface Ledger {
  customers: Customer[];
  transactions: LedgerTransaction[];
  settings: AppSettings;
}
export interface LedgerBackup extends Ledger {
  schemaVersion: 1;
  exportedAt: string;
}
export const maxAmountPaisa = 999999999999;
export const maxBackupBytes = 20 * 1024 * 1024;
export const emptyLedger = (): Ledger => ({
  customers: [], transactions: [], settings: { language: 'en', darkMode: false },
});
