import { describe, expect, test } from 'vitest';
import type { Customer } from '../models/customer';
import type { Ledger } from '../models/ledger';
import { ledgerIndex } from './balance';
import { sortCustomers } from './customerSort';

const customers: Customer[] = [
  { id: 'c1', name: 'Zainab', phone: '03001111111', note: '' },
  { id: 'c2', name: 'Ali', phone: '03002222222', note: '' },
  { id: 'c3', name: 'Bilal', phone: '03003333333', note: '' },
];

const ledger: Ledger = {
  customers,
  transactions: [
    {
      id: 't1',
      customerId: 'c1',
      kind: 'credit',
      amountPaisa: 50000,
      date: '2026-11-25T10:00:00.000',
      createdAt: '2026-11-25T10:00:00.000Z',
      note: '',
    },
    {
      id: 't2',
      customerId: 'c2',
      kind: 'credit',
      amountPaisa: 200000,
      date: '2026-11-10T10:00:00.000',
      createdAt: '2026-11-10T10:00:00.000Z',
      note: '',
    },
  ],
  settings: { language: 'en', darkMode: false },
};

describe('customerSort', () => {
  const index = ledgerIndex(ledger);

  test('sorts by name A-Z, recent, highest balance, and oldest balance', () => {
    expect(sortCustomers(customers, index, 'name', []).map(c => c.id)).toEqual(['c2', 'c3', 'c1']);
    expect(sortCustomers(customers, index, 'recent', []).map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(sortCustomers(customers, index, 'highest', []).map(c => c.id)).toEqual(['c2', 'c1', 'c3']);
    expect(sortCustomers(customers, index, 'oldest', []).map(c => c.id)).toEqual(['c2', 'c1', 'c3']);
  });

  test('keeps pinned customers on top regardless of sort order', () => {
    expect(sortCustomers(customers, index, 'name', ['c1']).map(c => c.id)).toEqual(['c1', 'c2', 'c3']);
    expect(sortCustomers(customers, index, 'highest', ['c3']).map(c => c.id)).toEqual(['c3', 'c2', 'c1']);
  });
});
