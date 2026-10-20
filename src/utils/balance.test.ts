import { describe, test, expect } from 'vitest';
import type { Customer } from '../models/customer';
import type { LedgerTransaction, TransactionKind } from '../models/transaction';
import { emptyLedger, maxAmountPaisa, type Ledger } from '../models/ledger';
import { balanceFor, outstandingPaisa, payablePaisa, historyFor, runningHistoryFor } from './balance';
import { parseAmount } from './money';
import { decodeLedger, encodeLedger } from './backup';
const ali: Customer = { id: 'ali', name: 'Ali', phone: '03001234567', note: '' };
const sana: Customer = { id: 'sana', name: 'Sana', phone: '03011234567', note: '' };
const entry = (id: string, amountPaisa: number, kind: TransactionKind,
  customerId = 'ali', day = 1): LedgerTransaction => ({
    id, customerId, amountPaisa, kind, date: `2026-01-${String(day).padStart(2, '0')}T00:00:00.000`,
    createdAt: `2026-01-${String(day).padStart(2, '0')}T00:00:00.000Z`, note: '',
  });
const ledger = (transactions: LedgerTransaction[], customers = [ali]): Ledger => ({ ...emptyLedger(), customers, transactions });

describe('ported verbatim scenarios from Flutter test/balance_test.dart', () => {
  test('credit minus payments uses exact paisa', () => {
    const data = ledger([entry('1', 10010, 'credit'), entry('2', 3010, 'payment')]);
    expect(balanceFor(data, 'ali')).toBe(7000);
    expect(balanceFor(data, 'missing')).toBe(0);
  });
  test('overpayment is payable; receivables exclude customer advances', () => {
    const data = ledger([entry('1', 10000, 'credit'), entry('2', 12000, 'payment'), entry('3', 7500, 'credit', 'sana')], [ali, sana]);
    expect(balanceFor(data, 'ali')).toBe(-2000);
    expect(balanceFor(data, 'sana')).toBe(7500);
    expect(outstandingPaisa(data)).toBe(7500);
    expect(payablePaisa(data)).toBe(2000);
  });
  test('full payment settles balance', () => {
    const data = ledger([entry('1', 34567, 'credit'), entry('2', 34567, 'payment')]);
    expect(balanceFor(data, 'ali')).toBe(0);
    expect(outstandingPaisa(data)).toBe(0);
    expect(payablePaisa(data)).toBe(0);
  });
  test('backdated entries sort chronologically for running balance', () => {
    const data = ledger([entry('late', 500, 'payment', 'ali', 4), entry('early', 1000, 'credit', 'ali', 2)]);
    expect(runningHistoryFor(data, 'ali').map(row => row.balancePaisa)).toEqual([1000, 500]);
  });
  test('money parsing rejects invalid amounts and preserves decimal precision', () => {
    expect(parseAmount('12.34')).toBe(1234);
    expect(parseAmount('0.01')).toBe(1);
    expect(parseAmount('۱۲.۳۴')).toBe(1234);
    expect(parseAmount('١٢.٣٤')).toBe(1234);
    expect(parseAmount('9999999999.99')).toBe(maxAmountPaisa);
    for (const invalid of ['', '0', '-2', '1.234', '1e3', 'NaN', '1,000', '10000000000']) expect(parseAmount(invalid), invalid).toBeNull();
  });
  test('backup preserves customers, entries, balance and settings', () => {
    const original = { ...ledger([entry('1', 12345, 'credit')]), settings: { language: 'ur' as const, darkMode: true } };
    const restored = decodeLedger(encodeLedger(original));
    expect(restored.customers[0].name).toBe('Ali');
    expect(balanceFor(restored, 'ali')).toBe(12345);
    expect(restored.settings.language).toBe('ur');
    expect(restored.settings.darkMode).toBe(true);
  });
});

test('same-day entries use creation time then ID without mutating the ledger', () => {
  const a = entry('a', 100, 'credit');
  const b = entry('b', 200, 'credit');
  const c = { ...entry('c', 50, 'payment'), createdAt: '2026-01-01T01:00:00.000Z' };
  const data = ledger([c, b, a]);
  expect(historyFor(data, 'ali').map(t => t.id)).toEqual(['a', 'b', 'c']);
  expect(data.transactions.map(t => t.id)).toEqual(['c', 'b', 'a']);
});

test('empty ledger has no outstanding or payable balance', () => {
  expect(outstandingPaisa(emptyLedger())).toBe(0);
  expect(payablePaisa(emptyLedger())).toBe(0);
});
