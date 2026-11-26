import { describe, expect, test } from 'vitest';
import type { Ledger } from '../models/ledger';
import { computeMonthlySummary } from './monthlySummary';

describe('computeMonthlySummary', () => {
  const ledger: Ledger = {
    customers: [
      { id: 'c1', name: 'Ali', phone: '03001111111', note: '' },
      { id: 'c2', name: 'Sana', phone: '03002222222', note: '' },
      { id: 'c3', name: 'Bilal', phone: '03003333333', note: '' },
    ],
    transactions: [
      {
        id: 't1',
        customerId: 'c1',
        kind: 'credit',
        amountPaisa: 300000,
        date: '2026-11-10T10:00:00.000',
        createdAt: '2026-11-10T10:00:00.000Z',
        note: '',
      },
      {
        id: 't2',
        customerId: 'c1',
        kind: 'payment',
        amountPaisa: 100000,
        date: '2026-11-15T10:00:00.000',
        createdAt: '2026-11-15T10:00:00.000Z',
        note: '',
      },
      {
        id: 't3',
        customerId: 'c2',
        kind: 'credit',
        amountPaisa: 500000,
        date: '2026-10-12T10:00:00.000',
        createdAt: '2026-10-12T10:00:00.000Z',
        note: '',
      },
    ],
    settings: { language: 'en', darkMode: false },
  };

  test('computes this month, last month, and top customers accurately', () => {
    const res = computeMonthlySummary(ledger, new Date('2026-11-26T12:00:00.000Z'));
    expect(res.thisMonth).toEqual({
      monthKey: '2026-11',
      creditPaisa: 300000,
      paymentPaisa: 100000,
      netPaisa: 200000,
    });
    expect(res.lastMonth).toEqual({
      monthKey: '2026-10',
      creditPaisa: 500000,
      paymentPaisa: 0,
      netPaisa: 500000,
    });
    expect(res.topCustomers.map(c => [c.customer.id, c.balancePaisa])).toEqual([
      ['c2', 500000],
      ['c1', 200000],
    ]);
  });
});
