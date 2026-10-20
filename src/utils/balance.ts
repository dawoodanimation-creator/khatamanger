import type { Ledger } from '../models/ledger';
import type { LedgerTransaction } from '../models/transaction';
export const signedPaisa = (t: LedgerTransaction): number => t.kind === 'credit' ? t.amountPaisa : -t.amountPaisa;
export function exactAdd(a: number, b: number): number {
  const total = a + b;
  if (!Number.isSafeInteger(total)) throw new RangeError('Balance exceeds safe integer range');
  return total;
}
const compare = (a: string, b: string) => a < b ? -1 : a > b ? 1 : 0;
export interface HistoryEntry { transaction: LedgerTransaction; balancePaisa: number }
interface LedgerIndex { balances: Map<string, number>; histories: Map<string, HistoryEntry[]>; outstanding: number; payable: number }
const cache = new WeakMap<Ledger['transactions'], WeakMap<Ledger['customers'], LedgerIndex>>();
/** One grouped pass and per-customer history sort, shared by validation and all screens. */
export function ledgerIndex(ledger: Ledger): LedgerIndex {
  let byCustomers = cache.get(ledger.transactions);
  const cached = byCustomers?.get(ledger.customers);
  if (cached) return cached;
  const balances = new Map<string, number>();
  const groups = new Map<string, LedgerTransaction[]>();
  for (const t of ledger.transactions) {
    balances.set(t.customerId, exactAdd(balances.get(t.customerId) ?? 0, signedPaisa(t)));
    const group = groups.get(t.customerId) ?? [];
    group.push(t); groups.set(t.customerId, group);
  }
  const histories = new Map<string, HistoryEntry[]>();
  for (const [id, group] of groups) {
    group.sort((a, b) => Date.parse(a.date) - Date.parse(b.date) || Date.parse(a.createdAt) - Date.parse(b.createdAt) || compare(a.id, b.id));
    let running = 0;
    histories.set(id, group.map(transaction => ({ transaction, balancePaisa: running = exactAdd(running, signedPaisa(transaction)) })));
  }
  let outstanding = 0, payable = 0;
  for (const c of ledger.customers) {
    const balance = balances.get(c.id) ?? 0;
    outstanding = exactAdd(outstanding, Math.max(balance, 0));
    payable = exactAdd(payable, Math.max(-balance, 0));
  }
  const index = { balances, histories, outstanding, payable };
  if (!byCustomers) { byCustomers = new WeakMap(); cache.set(ledger.transactions, byCustomers); }
  byCustomers.set(ledger.customers, index);
  return index;
}
export function balanceFor(ledger: Ledger, customerId: string): number { return ledgerIndex(ledger).balances.get(customerId) ?? 0; }
export function outstandingPaisa(ledger: Ledger): number { return ledgerIndex(ledger).outstanding; }
export function payablePaisa(ledger: Ledger): number { return ledgerIndex(ledger).payable; }
export function runningHistoryFor(ledger: Ledger, customerId: string): HistoryEntry[] { return [...(ledgerIndex(ledger).histories.get(customerId) ?? [])]; }
export function historyFor(ledger: Ledger, customerId: string): LedgerTransaction[] { return runningHistoryFor(ledger, customerId).map(e => e.transaction); }
