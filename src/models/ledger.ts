import type { Customer } from './customer';
import type { LedgerTransaction } from './transaction';
import type { CategoryBudget, Expense, ExpenseCategory } from './expense';

export type Language = 'en' | 'ur';
export type UseMode = 'khata' | 'expenses' | 'both';

export interface ProfileSettings {
  shopName?: string;
  ownerName?: string;
  phone?: string;
}

export interface AppSettings {
  language: Language;
  darkMode: boolean;
  hideBalances?: boolean;
  pin?: string;
  profile?: ProfileSettings;
  onboarded?: boolean;
  useMode?: UseMode;
}

export interface Ledger {
  customers: Customer[];
  transactions: LedgerTransaction[];
  settings: AppSettings;
  expenses?: Expense[];
  expenseCategories?: ExpenseCategory[];
  budgets?: CategoryBudget[];
}

export interface LedgerBackup extends Ledger {
  schemaVersion: 2;
  exportedAt: string;
}

export const maxAmountPaisa = 999999999999;
export const maxBackupBytes = 20 * 1024 * 1024;

export const emptyLedger = (): Ledger => ({
  customers: [],
  transactions: [],
  settings: { language: 'en', darkMode: false },
  expenses: [],
  expenseCategories: [],
  budgets: [],
});
