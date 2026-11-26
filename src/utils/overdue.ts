import type { LedgerTransaction } from '../models/transaction';
import { localDayString } from './backupHelper';

export interface OverdueEntryInfo {
  dueDate: string;
  unpaidPaisa: number;
}

export interface CustomerOverdueResult {
  overdueCredits: Map<string, OverdueEntryInfo>;
  overdueTotalPaisa: number;
  earliestDueDate: string | null;
  isOverdue: boolean;
}

function compareChronological(a: LedgerTransaction, b: LedgerTransaction): number {
  const byDate = a.date.localeCompare(b.date);
  if (byDate !== 0) return byDate;
  const byCreated = a.createdAt.localeCompare(b.createdAt);
  if (byCreated !== 0) return byCreated;
  return a.id.localeCompare(b.id);
}

/**
 * Applies payments to the oldest credit entries first (FIFO) and identifies
 * remaining unpaid credits whose dueDate is strictly before today.
 */
export function calculateCustomerOverdue(
  transactions: LedgerTransaction[],
  todayDateStr: string = localDayString()
): CustomerOverdueResult {
  const sorted = [...transactions].sort(compareChronological);
  const creditsQueue: Array<{ id: string; remaining: number; dueDate?: string }> = [];

  for (const tx of sorted) {
    if (tx.kind === 'credit') {
      creditsQueue.push({
        id: tx.id,
        remaining: tx.amountPaisa,
        dueDate: tx.dueDate ? tx.dueDate.slice(0, 10) : undefined,
      });
    } else {
      let paymentLeft = tx.amountPaisa;
      for (const credit of creditsQueue) {
        if (paymentLeft <= 0) break;
        if (credit.remaining <= 0) continue;
        const applied = Math.min(credit.remaining, paymentLeft);
        credit.remaining -= applied;
        paymentLeft -= applied;
      }
    }
  }

  const overdueCredits = new Map<string, OverdueEntryInfo>();
  let overdueTotalPaisa = 0;
  let earliestDueDate: string | null = null;

  for (const credit of creditsQueue) {
    if (credit.remaining > 0 && credit.dueDate && credit.dueDate < todayDateStr) {
      overdueCredits.set(credit.id, {
        dueDate: credit.dueDate,
        unpaidPaisa: credit.remaining,
      });
      overdueTotalPaisa += credit.remaining;
      if (!earliestDueDate || credit.dueDate < earliestDueDate) {
        earliestDueDate = credit.dueDate;
      }
    }
  }

  return {
    overdueCredits,
    overdueTotalPaisa,
    earliestDueDate,
    isOverdue: overdueCredits.size > 0,
  };
}
