import type { Expense, ExpenseCategory } from '../models/expense';
import { todayISO } from './dates';

export function monthKeyFromDate(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function shiftMonthKey(monthKey: string, delta: number): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  const d = new Date(y, m - 1 + delta, 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export interface ExpenseCategoryBreakdown {
  categoryId: string;
  spentPaisa: number;
  sharePct: number;
  prevSpentPaisa: number;
  deltaPct: number | null;
}

export interface ExpenseMonthSummary {
  monthKey: string;
  spentPaisa: number;
  incomePaisa: number;
  netPaisa: number;
  todaySpentPaisa: number;
  byCategory: ExpenseCategoryBreakdown[];
}

export function computeExpenseMonthSummary(
  expenses: Expense[],
  monthKey: string,
  todayStr: string = todayISO()
): ExpenseMonthSummary {
  const prevKey = shiftMonthKey(monthKey, -1);
  let spentPaisa = 0;
  let incomePaisa = 0;
  let todaySpentPaisa = 0;

  const currCats = new Map<string, number>();
  const prevCats = new Map<string, number>();

  for (const exp of expenses) {
    const expMonth = monthKeyFromDate(exp.date);
    const expDay = exp.date.slice(0, 10);

    if (expMonth === monthKey) {
      if (exp.kind === 'expense') {
        spentPaisa += exp.amountPaisa;
        currCats.set(exp.categoryId, (currCats.get(exp.categoryId) ?? 0) + exp.amountPaisa);
        if (expDay === todayStr) {
          todaySpentPaisa += exp.amountPaisa;
        }
      } else {
        incomePaisa += exp.amountPaisa;
      }
    } else if (expMonth === prevKey && exp.kind === 'expense') {
      prevCats.set(exp.categoryId, (prevCats.get(exp.categoryId) ?? 0) + exp.amountPaisa);
    }
  }

  const byCategory: ExpenseCategoryBreakdown[] = Array.from(currCats.entries())
    .map(([categoryId, amt]) => {
      const prevAmt = prevCats.get(categoryId) ?? 0;
      const sharePct = spentPaisa > 0 ? Math.round((amt / spentPaisa) * 100) : 0;
      const deltaPct =
        prevAmt > 0 ? Math.round(((amt - prevAmt) / prevAmt) * 100) : null;
      return {
        categoryId,
        spentPaisa: amt,
        sharePct,
        prevSpentPaisa: prevAmt,
        deltaPct,
      };
    })
    .sort((a, b) => b.spentPaisa - a.spentPaisa);

  return {
    monthKey,
    spentPaisa,
    incomePaisa,
    netPaisa: incomePaisa - spentPaisa,
    todaySpentPaisa,
    byCategory,
  };
}

export interface ExpenseDayGroup {
  day: string;
  totalSpentPaisa: number;
  totalIncomePaisa: number;
  entries: Expense[];
}

export function groupExpensesByDay(expenses: Expense[]): ExpenseDayGroup[] {
  const map = new Map<string, Expense[]>();
  const sorted = [...expenses].sort((a, b) => {
    const dayCmp = b.date.slice(0, 10).localeCompare(a.date.slice(0, 10));
    if (dayCmp !== 0) return dayCmp;
    return b.createdAt.localeCompare(a.createdAt);
  });

  for (const exp of sorted) {
    const day = exp.date.slice(0, 10);
    const list = map.get(day);
    if (list) list.push(exp);
    else map.set(day, [exp]);
  }

  return Array.from(map.entries()).map(([day, entries]) => {
    let totalSpentPaisa = 0;
    let totalIncomePaisa = 0;
    for (const e of entries) {
      if (e.kind === 'expense') totalSpentPaisa += e.amountPaisa;
      else totalIncomePaisa += e.amountPaisa;
    }
    return { day, totalSpentPaisa, totalIncomePaisa, entries };
  });
}

export interface RecurringBillSuggestion {
  categoryId: string;
  suggestedAmountPaisa: number;
}

const RECURRING_BILL_IDS = new Set(['rent', 'bills', 'internet']);

export function detectRecurringBillSuggestions(
  expenses: Expense[],
  categories: ExpenseCategory[],
  currentMonthKey: string
): RecurringBillSuggestion[] {
  const prevKey = shiftMonthKey(currentMonthKey, -1);
  const currentCats = new Set(
    expenses
      .filter(e => e.kind === 'expense' && monthKeyFromDate(e.date) === currentMonthKey)
      .map(e => e.categoryId)
  );
  const validCatIds = new Set(categories.filter(c => !c.hidden).map(c => c.id));
  const suggestions = new Map<string, number>();

  for (const exp of expenses) {
    if (
      exp.kind === 'expense' &&
      monthKeyFromDate(exp.date) === prevKey &&
      RECURRING_BILL_IDS.has(exp.categoryId) &&
      validCatIds.has(exp.categoryId) &&
      !currentCats.has(exp.categoryId)
    ) {
      suggestions.set(exp.categoryId, exp.amountPaisa);
    }
  }

  return Array.from(suggestions.entries()).map(([categoryId, suggestedAmountPaisa]) => ({
    categoryId,
    suggestedAmountPaisa,
  }));
}
