import { describe, expect, test } from 'vitest';
import type { Ledger } from '../models/ledger';
import { decodeLedger, encodeLedger } from './backup';
import { formatPakistaniPhoneInput } from './phone';
import { validateCustomer } from './validation';

describe('v2 additive data layer, backup round-trip, and field validation', () => {
  test('old schemaVersion 1 backup without v2 fields restores cleanly', () => {
    const oldBackup = JSON.stringify({
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      customers: [{ id: 'c1', name: 'Ali', phone: '03001234567', note: '' }],
      transactions: [
        {
          id: 't1',
          customerId: 'c1',
          kind: 'credit',
          amountPaisa: 50000,
          date: '2026-01-01T10:00:00.000',
          createdAt: '2026-01-01T10:00:00.000Z',
          note: '',
        },
      ],
      settings: { language: 'en', darkMode: false },
    });

    const decoded = decodeLedger(oldBackup);
    expect(decoded.customers[0]).toEqual({
      id: 'c1',
      name: 'Ali',
      phone: '03001234567',
      note: '',
    });
    expect(decoded.transactions[0].category).toBeUndefined();
    expect(decoded.transactions[0].paymentMethod).toBeUndefined();
  });

  test('all new v2 optional fields round-trip through encodeLedger and decodeLedger', () => {
    const ledger: Ledger = {
      customers: [
        {
          id: 'c1',
          name: 'Sana Traders',
          phone: '0300-1234567',
          note: 'Wholesale buyer',
          category: 'Wholesale',
          address: 'Main Bazar, Lahore',
          whatsappPhone: '0321-7654321',
          creditLimitPaisa: 1000000,
          defaultDueDays: 15,
        },
      ],
      transactions: [
        {
          id: 't1',
          customerId: 'c1',
          kind: 'credit',
          amountPaisa: 250000,
          date: '2026-11-20T10:00:00.000',
          createdAt: '2026-11-20T10:00:00.000Z',
          note: 'Opening balance',
          category: 'Rashan/Grocery',
        },
        {
          id: 't2',
          customerId: 'c1',
          kind: 'payment',
          amountPaisa: 100000,
          date: '2026-11-21T10:00:00.000',
          createdAt: '2026-11-21T10:00:00.000Z',
          note: '',
          paymentMethod: 'JazzCash',
        },
      ],
      settings: { language: 'en', darkMode: false },
    };

    const json = encodeLedger(ledger);
    const decoded = decodeLedger(json);
    expect(decoded.customers[0]).toEqual(ledger.customers[0]);
    expect(decoded.transactions[0].category).toBe('Rashan/Grocery');
    expect(decoded.transactions[1].paymentMethod).toBe('JazzCash');
  });

  test('validates each new customer field cleanly', () => {
    const base = { name: 'Ali', phone: '03001234567', note: '' };
    expect(validateCustomer(base)).toEqual({});
    expect(validateCustomer({ ...base, category: 'A'.repeat(61) }).category).toBe('categoryInvalid');
    expect(validateCustomer({ ...base, address: 'A'.repeat(201) }).address).toBe('addressInvalid');
    expect(validateCustomer({ ...base, whatsappPhone: '123' }).whatsappPhone).toBe('phoneInvalid');
    expect(validateCustomer({ ...base, creditLimitPaisa: 0 }).creditLimit).toBe('creditLimitInvalid');
    expect(validateCustomer({ ...base, defaultDueDays: 0 }).defaultDueDays).toBe('dueDaysInvalid');
    expect(validateCustomer({ ...base, defaultDueDays: 4000 }).defaultDueDays).toBe('dueDaysInvalid');
  });

  test('auto-formats +92 and 03XX Pakistani phone numbers', () => {
    expect(formatPakistaniPhoneInput('+923001234567')).toBe('0300-1234567');
    expect(formatPakistaniPhoneInput('03001234567')).toBe('0300-1234567');
    expect(formatPakistaniPhoneInput('00923217654321')).toBe('0321-7654321');
  });
});
