import { test, expect } from 'vitest';
import { emptyLedger } from '../models/ledger';
import { addTransaction, deleteCustomer, deleteTransaction, saveCustomer } from './mutations';
import { balanceFor } from '../utils/balance';
import { validateCustomer } from '../utils/validation';
import { validEntryDate } from '../utils/dates';
import { demoRecords } from '../utils/demo';
import { translate } from '../i18n';
const customer = { id: 'ali', name: ' Ali ', phone: '03001234567', note: ' note ' };
const credit = { id: 't', customerId: 'ali', kind: 'credit' as const, amountPaisa: 12345, date: '2020-01-01T00:00:00.000', createdAt: '2020-01-01T00:00:00.000Z', note: '' };
test('saving trims data and editing preserves identity/history', () => {
  const original = addTransaction(saveCustomer(emptyLedger(), customer), credit);
  const edited = saveCustomer(original, { ...customer, name: 'Ali Khan' });
  expect(edited.customers).toHaveLength(1);
  expect(edited.customers[0].note).toBe('note');
  expect(balanceFor(edited, 'ali')).toBe(12345);
  expect(original.customers[0].name).toBe('Ali');
});
test('deletion cascades only to the chosen customer', () => {
  const data = addTransaction(saveCustomer(saveCustomer(emptyLedger(), customer), { ...customer, id: 'other' }), credit);
  const next = deleteCustomer(data, 'ali');
  expect(next.customers[0].id).toBe('other');
  expect(next.transactions).toEqual([]);
  expect(data.transactions).toHaveLength(1);
});
test('single transaction can be deleted and balances recalculate', () => {
  const withOne = addTransaction(saveCustomer(emptyLedger(), customer), credit);
  const payment = { id: 't2', customerId: 'ali', kind: 'payment' as const, amountPaisa: 2345, date: '2020-01-02T00:00:00.000', createdAt: '2020-01-02T00:00:00.000Z', note: '' };
  const withTwo = addTransaction(withOne, payment);
  expect(balanceFor(withTwo, 'ali')).toBe(10000);
  const afterDelete = deleteTransaction(withTwo, 't2');
  expect(afterDelete.transactions).toHaveLength(1);
  expect(balanceFor(afterDelete, 'ali')).toBe(12345);
});
test('transactions reject missing customers and duplicates', () => {
  expect(() => addTransaction(emptyLedger(), credit)).toThrow();
  const data = addTransaction(saveCustomer(emptyLedger(), customer), credit);
  expect(() => addTransaction(data, credit)).toThrow();
});
test('customer field limits match the Flutter form', () => {
  expect(validateCustomer({ name: ' ', phone: '123', note: 'x'.repeat(501) })).toEqual({ name: 'nameRequired', phone: 'phoneInvalid', note: 'noteInvalid' });
  expect(validateCustomer({ name: 'A'.repeat(100), phone: '+92 (300) 123-4567', note: '' })).toEqual({});
  expect(validateCustomer({ name: 'A', phone: '1234567890123456', note: '' }).phone).toBe('phoneInvalid');
});
test('date form rejects impossible, empty and future dates', () => {
  expect(validEntryDate('2020-02-29')).toBe(true);
  for (const value of ['', '2021-02-29', '2020-13-01', '1899-12-31', '9999-01-01']) expect(validEntryDate(value)).toBe(false);
});
test('demo includes receivable, payable and settled customers', () => {
  const records = demoRecords(key => translate('en', key));
  const data = { ...emptyLedger(), ...records };
  expect(balanceFor(data, 'demo-ali')).toBe(250000);
  expect(balanceFor(data, 'demo-sana')).toBe(-20000);
  expect(balanceFor(data, 'demo-bilal')).toBe(0);
});
