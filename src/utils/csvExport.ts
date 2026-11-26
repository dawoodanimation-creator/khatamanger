import type { Customer } from '../models/customer';
import type { LedgerTransaction } from '../models/transaction';
import type { ledgerIndex } from './balance';
import { formatMoney } from './numberFormat';
import type { NumberFormatMode } from './uiPrefs';

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

export function customersToCsv(
  customers: Customer[],
  index: LedgerIndex,
  numberFormat: NumberFormatMode = 'pk',
  currencyLabel = 'Rs'
): string {
  const header = toCsvRow(['ID', 'Name', 'Phone', 'Balance (Rs)', 'Note']);
  const rows = customers.map(c => {
    const balance = index.balances.get(c.id) ?? 0;
    const status = balance > 0 ? 'Owes you' : balance < 0 ? 'You owe' : 'Settled';
    const formatted = `${formatMoney(balance, currencyLabel, numberFormat)} (${status})`;
    return toCsvRow([c.id, c.name, c.phone, formatted, c.note]);
  });
  return [header, ...rows].join('\r\n');
}

export function transactionsToCsv(
  customers: Customer[],
  transactions: LedgerTransaction[],
  numberFormat: NumberFormatMode = 'pk',
  currencyLabel = 'Rs'
): string {
  const names = new Map(customers.map(c => [c.id, c.name]));
  const header = toCsvRow(['ID', 'Customer', 'Type', 'Amount', 'Date', 'Due Date', 'Note']);
  const rows = transactions.map(tx =>
    toCsvRow([
      tx.id,
      names.get(tx.customerId) ?? tx.customerId,
      tx.kind === 'credit' ? 'Udhaar Diya' : 'Payment Mili',
      formatMoney(tx.amountPaisa, currencyLabel, numberFormat),
      tx.date.slice(0, 10),
      tx.dueDate ? tx.dueDate.slice(0, 10) : '',
      tx.note,
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
