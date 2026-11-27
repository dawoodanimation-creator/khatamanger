import type { Customer } from '../models/customer';
import type { LedgerTransaction } from '../models/transaction';
import type { Expense, ExpenseCategory } from '../models/expense';
import type { ledgerIndex } from './balance';
import { getCategoryLabel } from './expenseCategories';

type LedgerIndex = ReturnType<typeof ledgerIndex>;

export function escapeCsvCell(value: string): string {
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  if (/[",\r\n]/.test(safe)) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

function toCsvRow(cells: string[]): string {
  return cells.map(escapeCsvCell).join(',');
}

function paisaToPlainRupees(paisa: number): string {
  const abs = Math.abs(paisa);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, '0');
  return `${whole}.${frac}`;
}

export function customersToCsv(customers: Customer[], index: LedgerIndex): string {
  const header = toCsvRow(['ID', 'Name', 'Phone', 'Balance', 'Direction', 'Note']);
  const rows = customers.map(c => {
    const balance = index.balances.get(c.id) ?? 0;
    const direction = balance > 0 ? 'receive' : balance < 0 ? 'pay' : 'settled';
    return toCsvRow([
      c.id,
      c.name,
      c.phone,
      paisaToPlainRupees(balance),
      direction,
      c.note,
    ]);
  });
  return [header, ...rows].join('\r\n');
}

export function transactionsToCsv(
  customers: Customer[],
  transactions: LedgerTransaction[]
): string {
  const names = new Map(customers.map(c => [c.id, c.name]));
  const header = toCsvRow(['ID', 'Customer', 'Type', 'Amount', 'Date', 'Due Date', 'Note']);
  const rows = transactions.map(tx =>
    toCsvRow([
      tx.id,
      names.get(tx.customerId) ?? tx.customerId,
      tx.kind === 'credit' ? 'Udhaar Diya' : 'Payment Mili',
      paisaToPlainRupees(tx.amountPaisa),
      tx.date.slice(0, 10),
      tx.dueDate ? tx.dueDate.slice(0, 10) : '',
      tx.note,
    ])
  );
  return [header, ...rows].join('\r\n');
}

export function expensesToCsv(
  expenses: Expense[],
  categories: ExpenseCategory[],
  language: 'en' | 'ur' = 'en'
): string {
  const catMap = new Map(categories.map(c => [c.id, c]));
  const header = toCsvRow(['ID', 'Type', 'Category', 'Amount', 'Date', 'Payment Method', 'Note']);
  const rows = expenses.map(exp =>
    toCsvRow([
      exp.id,
      exp.kind === 'expense' ? 'Expense' : 'Income',
      getCategoryLabel(catMap.get(exp.categoryId), language, exp.categoryId),
      paisaToPlainRupees(exp.amountPaisa),
      exp.date.slice(0, 10),
      exp.paymentMethod ?? '',
      exp.note,
    ])
  );
  return [header, ...rows].join('\r\n');
}

export function downloadCsvFile(filename: string, csvContent: string): void {
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
