import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { emptyLedger, type AppSettings, type Ledger } from '../models/ledger';
import type { Customer } from '../models/customer';
import type { LedgerTransaction } from '../models/transaction';
import type { CategoryBudget, Expense, ExpenseCategory } from '../models/expense';
import { CommitConflict, LockUnavailable, decodeStored, serializedWrite, STORAGE_KEY, writeLedger } from './storage';
import type { TranslationKey } from '../i18n';
import { balanceFor } from '../utils/balance';
import { likelyDuplicates } from '../utils/customerIdentity';
import * as mutations from './mutations';
interface LedgerState {
  writeError: () => TranslationKey; ledger: Ledger; revision: string | null; loadError: boolean; storageError: TranslationKey | null;
  updateSettings: (settings: Partial<AppSettings>) => Promise<boolean>;
  saveCustomer: (customer: Customer, expected?: Customer, duplicateIds?: string[]) => Promise<boolean>;
  deleteCustomer: (id: string, expected: Ledger) => Promise<boolean>;
  addTransaction: (transaction: LedgerTransaction, expected: Customer) => Promise<boolean>;
  deleteTransaction: (id: string, customerId: string) => Promise<boolean>;
  saveExpense: (expense: Expense) => Promise<boolean>;
  deleteExpense: (id: string) => Promise<boolean>;
  saveExpenseCategories: (categories: ExpenseCategory[]) => Promise<boolean>;
  saveBudgets: (budgets: CategoryBudget[]) => Promise<boolean>;
  restore: (ledger: Ledger, expected: string | null) => Promise<boolean>;
  replaceRecords: (ledger: Pick<Ledger, 'customers' | 'transactions'>, expected: string | null) => Promise<boolean>;
}
const LedgerContext = createContext<LedgerState | null>(null);
const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
function snapshot() {
  let raw: string | null = null;
  try { raw = localStorage.getItem(STORAGE_KEY); return { ledger: decodeStored(raw), raw, loadError: false }; }
  catch { return { ledger: emptyLedger(), raw, loadError: true }; }
}
export function LedgerProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(snapshot);
  const errorRef = useRef<TranslationKey>('saveNotCompleted');
  const [storageError, setStorageError] = useState<TranslationKey | null>(null);
  useEffect(() => {
    const refresh = () => setState(snapshot());
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY || event.key === null) refresh(); };
    window.addEventListener('storage', onStorage);
    window.addEventListener('focus', refresh);
    return () => { window.removeEventListener('storage', onStorage); window.removeEventListener('focus', refresh); };
  }, []);
  async function commit(change: (ledger: Ledger) => Ledger, recovery?: { data: Ledger; expected: string | null }): Promise<boolean> {
    try {
      await serializedWrite(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        let latest: Ledger;
        try { latest = decodeStored(raw); }
        catch {
          if (!recovery || raw !== recovery.expected) throw new CommitConflict();
          // Preserve the unreadable source before a confirmed recovery, including quota failures.
          if (raw !== null) localStorage.setItem(`${STORAGE_KEY}.corrupt.${crypto.randomUUID()}`, raw);
          latest = emptyLedger();
        }
        if (recovery && raw !== recovery.expected) throw new CommitConflict();
        const next = mutations.ensureExactBalances(change(latest));
        writeLedger(localStorage, next);
        const nextState = { ledger: next, raw: localStorage.getItem(STORAGE_KEY), loadError: false };
        setState(nextState); setStorageError(null);
      });
      return true;
    } catch (error) {
      errorRef.current = error instanceof CommitConflict ? 'conflictError' : error instanceof LockUnavailable ? 'lockUnavailable' : error instanceof RangeError ? 'balanceRangeError' : 'storageError';
      setStorageError(errorRef.current);
      // Keep form input mounted. Only refresh readable ledger state, never silently reset corruption.
      const next = snapshot(); setState(next);
      return false;
    }
  }
  const ledger = state.ledger;
  const value: LedgerState = {
    writeError: () => errorRef.current, ledger, revision: state.raw, loadError: state.loadError, storageError,
    updateSettings: settings => commit(data => ({ ...data, settings: { ...data.settings, ...settings } })),
    saveCustomer: (customer, before, duplicateIds = []) => {
      return commit(data => {
        if (!same(before, data.customers.find(c => c.id === customer.id))) throw new CommitConflict();
        if (!same(likelyDuplicates(data.customers, customer).map(c => c.id).sort(), [...duplicateIds].sort())) throw new CommitConflict();
        return mutations.saveCustomer(data, customer);
      });
    },
    deleteCustomer: (id, expected) => commit(data => {
      if (!same(expected.customers.find(c => c.id === id), data.customers.find(c => c.id === id)) || !same(expected.transactions.filter(t => t.customerId === id), data.transactions.filter(t => t.customerId === id))) throw new CommitConflict();
      return mutations.deleteCustomer(data, id);
    }),
    addTransaction: (transaction, expected) => commit(data => {
      if (!same(expected, data.customers.find(c => c.id === transaction.customerId))) throw new CommitConflict();
      if (balanceFor(data, transaction.customerId) !== balanceFor(ledger, transaction.customerId)) throw new CommitConflict();
      return mutations.addTransaction(data, transaction);
    }),
    deleteTransaction: (id: string, customerId: string) => commit(data => {
      if (!data.customers.some(c => c.id === customerId)) throw new CommitConflict();
      if (balanceFor(data, customerId) !== balanceFor(ledger, customerId)) throw new CommitConflict();
      return mutations.deleteTransaction(data, id);
    }),
    saveExpense: expense => commit(data => mutations.saveExpense(data, expense)),
    deleteExpense: id => commit(data => mutations.deleteExpense(data, id)),
    saveExpenseCategories: categories => commit(data => mutations.saveExpenseCategories(data, categories)),
    saveBudgets: budgets => commit(data => mutations.saveBudgets(data, budgets)),
    restore: (data, expected) => commit(() => data, { data, expected }),
    replaceRecords: (records, expected) => {
      return commit(data => {
        if (localStorage.getItem(STORAGE_KEY) !== expected) throw new CommitConflict();
        return { ...data, ...records };
      });
    },
  };
  return <LedgerContext.Provider value={value}>{children}</LedgerContext.Provider>;
}
export function useLedger() {
  const context = useContext(LedgerContext);
  if (!context) throw new Error('LedgerProvider is required');
  return context;
}
