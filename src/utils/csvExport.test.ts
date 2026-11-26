import { describe, expect, test } from 'vitest';
import type { Customer } from '../models/customer';
import type { Ledger } from '../models/ledger';
import { ledgerIndex } from './balance';
import { customersToCsv, escapeCsvCell, transactionsToCsv } from './csvExport';

describe('csvExport', () => {
  test('escapes commas, quotes, and formula prefixes', () => {
    expect(escapeCsvCell('Ali, Khan')).toBe('"Ali, Khan"');
    expect(escapeCsvCell('=SUM(A1:A2)')).toBe("'=SUM(A1:A2)");
    expect(escapeCsvCell('Note "quoted"')).toBe('"Note ""quoted"""');
  });

  test('exports customers and transactions CSV with selected number format', () => {
    const customers: Customer[] = [
      { id: 'c1', name: 'Ali Khan', phone: '03001234567', note: 'VIP' },
    ];
    const ledger: Ledger = {
      customers,
      transactions: [
        {
          id: 't1',
          customerId: 'c1',
          kind: 'credit',
          amountPaisa: 758353500,
          date: '2026-11-20T10:00:00.000',
          createdAt: '2026-11-20T10:00:00.000Z',
          dueDate: '2026-11-22',
          note: 'Bulk',
        },
      ],
      settings: { language: 'en', darkMode: false },
    };

    const custCsv = customersToCsv(customers, ledgerIndex(ledger), 'pk', 'Rs');
    expect(custCsv).toContain('ID,Name,Phone,Balance (Rs),Note');
    expect(custCsv).toContain('c1,Ali Khan,03001234567,"Rs 75,83,535.00 (Owes you)",VIP');

    const txCsv = transactionsToCsv(customers, ledger.transactions, 'intl', 'Rs');
    expect(txCsv).toContain('ID,Customer,Type,Amount,Date,Due Date,Note');
    expect(txCsv).toContain('t1,Ali Khan,Udhaar Diya,"Rs 7,583,535.00",2026-11-20,2026-11-22,Bulk');
  });
});
