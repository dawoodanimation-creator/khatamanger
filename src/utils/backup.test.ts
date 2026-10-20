import { test, expect } from 'vitest';
import { decodeLedger } from './backup';
import { maxAmountPaisa } from '../models/ledger';
function valid() { return {
  schemaVersion: 1,
  customers: [{ id: 'c', name: 'Ali', phone: '03001234567', note: '' }],
  transactions: [{ id: 't', customerId: 'c', kind: 'credit', amountPaisa: 100,
    date: '2026-01-01T00:00:00.000', createdAt: '2026-01-01T00:00:00.000Z', note: '' }],
  settings: { language: 'en', darkMode: false },
}; }
test('unknown schema, duplicates and orphan transactions are rejected', () => {
  const schema = { ...valid(), schemaVersion: 2 };
  const duplicate = valid(); duplicate.customers.push(duplicate.customers[0]);
  const orphan = valid(); orphan.transactions[0].customerId = 'absent';
  for (const data of [schema, duplicate, orphan]) expect(() => decodeLedger(JSON.stringify(data))).toThrow();
});
test('invalid transaction amounts and settings are rejected', () => {
  for (const amount of [0, -1, 1.5, maxAmountPaisa + 1]) {
    const data = valid(); data.transactions[0].amountPaisa = amount;
    expect(() => decodeLedger(JSON.stringify(data))).toThrow();
  }
  const data = valid(); data.settings.language = 'unknown';
  expect(() => decodeLedger(JSON.stringify(data))).toThrow();
});
