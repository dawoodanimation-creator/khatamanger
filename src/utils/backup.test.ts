import { test, expect } from 'vitest';
import { decodeLedger } from './backup';
function valid() { return {
  schemaVersion: 1,
  customers: [{ id: 'c', name: 'Ali', phone: '03001234567', note: '' }],
  transactions: [{ id: 't', customerId: 'c', kind: 'credit', amountPaisa: 100,
    date: '2026-01-01T00:00:00.000', createdAt: '2026-01-01T00:00:00.000Z', note: '' }],
  settings: { language: 'en', darkMode: false },
}; }
test('unknown schema, duplicates and orphan transactions are rejected', () => {
  const schema = { ...valid(), schemaVersion: 99 };
  const duplicate = valid(); duplicate.customers.push(duplicate.customers[0]);
  const orphan = valid(); orphan.transactions[0].customerId = 'absent';
  for (const data of [schema, duplicate, orphan]) expect(() => decodeLedger(JSON.stringify(data))).toThrow();
});
test('transactions with itemized details decode cleanly', () => {
  const data = {
    ...valid(),
    transactions: [{
      id: 't', customerId: 'c', kind: 'credit' as const, amountPaisa: 50000,
      date: '2026-01-01T00:00:00.000', createdAt: '2026-01-01T00:00:00.000Z', note: 'Groceries',
      items: [
        { id: 'i1', name: 'Flour', qty: '10kg', pricePaisa: 30000 },
        { id: 'i2', name: 'Cooking Oil', qty: '1L', pricePaisa: 20000 },
      ],
    }],
  };
  const decoded = decodeLedger(JSON.stringify(data));
  expect(decoded.transactions[0].items).toHaveLength(2);
  expect(decoded.transactions[0].items?.[0].name).toBe('Flour');
  expect(decoded.transactions[0].items?.[1].pricePaisa).toBe(20000);
});
