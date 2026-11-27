import type { Customer } from '../models/customer';
import type { Ledger } from '../models/ledger';
import { ledgerIndex } from './balance';

export interface MonthTotals {
  monthKey: string;
  creditPaisa: number;
  paymentPaisa: number;
  netPaisa: number;
}

export interface TopCustomerBalance {
  customer: Customer;
  balancePaisa: number;
}

export interface CategoryTotal {
  category: string;
  amountPaisa: number;
}

export interface MonthlySummaryData {
  thisMonth: MonthTotals;
  lastMonth: MonthTotals;
  topCustomers: TopCustomerBalance[];
  givenByCategory: CategoryTotal[];
}

function monthKeyFor(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, '0')}`;
}

export function computeMonthlySummary(
  ledger: Ledger,
  now: Date = new Date()
): MonthlySummaryData {
  const thisYear = now.getFullYear();
  const thisMonthIdx = now.getMonth();
  const lastMonthDate = new Date(thisYear, thisMonthIdx - 1, 1);

  const thisKey = monthKeyFor(thisYear, thisMonthIdx);
  const lastKey = monthKeyFor(lastMonthDate.getFullYear(), lastMonthDate.getMonth());

  const thisMonth: MonthTotals = { monthKey: thisKey, creditPaisa: 0, paymentPaisa: 0, netPaisa: 0 };
  const lastMonth: MonthTotals = { monthKey: lastKey, creditPaisa: 0, paymentPaisa: 0, netPaisa: 0 };

  const categoryTotals = new Map<string, number>();

  for (const tx of ledger.transactions) {
    const key = tx.date.slice(0, 7);
    const target = key === thisKey ? thisMonth : key === lastKey ? lastMonth : null;
    if (!target) continue;
    if (tx.kind === 'credit') {
      target.creditPaisa += tx.amountPaisa;
      if (key === thisKey) {
        const cat = tx.category?.trim() || 'Other';
        categoryTotals.set(cat, (categoryTotals.get(cat) ?? 0) + tx.amountPaisa);
      }
    } else {
      target.paymentPaisa += tx.amountPaisa;
    }
  }

  thisMonth.netPaisa = thisMonth.creditPaisa - thisMonth.paymentPaisa;
  lastMonth.netPaisa = lastMonth.creditPaisa - lastMonth.paymentPaisa;

  const index = ledgerIndex(ledger);
  const topCustomers = ledger.customers
    .map(customer => ({
      customer,
      balancePaisa: index.balances.get(customer.id) ?? 0,
    }))
    .filter(item => item.balancePaisa > 0)
    .sort((a, b) => b.balancePaisa - a.balancePaisa)
    .slice(0, 5);

  const givenByCategory: CategoryTotal[] = [...categoryTotals.entries()]
    .map(([category, amountPaisa]) => ({ category, amountPaisa }))
    .sort((a, b) => b.amountPaisa - a.amountPaisa);

  return { thisMonth, lastMonth, topCustomers, givenByCategory };
}
