import type { Customer } from '../models/customer';
import type { ledgerIndex } from './balance';
import type { SortOrder } from './uiPrefs';

type LedgerIndex = ReturnType<typeof ledgerIndex>;

function latestActivityTimestamp(customerId: string, index: LedgerIndex): string {
  const history = index.histories.get(customerId);
  if (!history || history.length === 0) return '';
  return history[history.length - 1].transaction.date;
}

function oldestActivityTimestamp(customerId: string, index: LedgerIndex): string {
  const history = index.histories.get(customerId);
  if (!history || history.length === 0) return '9999-99-99';
  return history[0].transaction.date;
}

export function sortCustomers(
  customers: Customer[],
  index: LedgerIndex,
  sortOrder: SortOrder,
  pinnedIds: string[]
): Customer[] {
  const pinnedSet = new Set(pinnedIds);

  return [...customers].sort((a, b) => {
    const aPinned = pinnedSet.has(a.id);
    const bPinned = pinnedSet.has(b.id);
    if (aPinned !== bPinned) return aPinned ? -1 : 1;

    if (sortOrder === 'recent') {
      const aDate = latestActivityTimestamp(a.id, index);
      const bDate = latestActivityTimestamp(b.id, index);
      if (aDate !== bDate) return bDate.localeCompare(aDate);
    } else if (sortOrder === 'highest') {
      const aBal = Math.abs(index.balances.get(a.id) ?? 0);
      const bBal = Math.abs(index.balances.get(b.id) ?? 0);
      if (aBal !== bBal) return bBal - aBal;
    } else if (sortOrder === 'oldest') {
      const aBal = index.balances.get(a.id) ?? 0;
      const bBal = index.balances.get(b.id) ?? 0;
      const aHasBal = aBal !== 0;
      const bHasBal = bBal !== 0;
      if (aHasBal !== bHasBal) return aHasBal ? -1 : 1;
      const aDate = oldestActivityTimestamp(a.id, index);
      const bDate = oldestActivityTimestamp(b.id, index);
      if (aDate !== bDate) return aDate.localeCompare(bDate);
    }

    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });
}
