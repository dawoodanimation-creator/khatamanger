import { describe, expect, test } from 'vitest';
import { money, parseAmount } from './money';
import { validBackupDate } from './dates';
import { phoneMatches, validPhone } from './phone';
import { likelyDuplicates } from './customerIdentity';
import { customerPath } from './routes';
import { decodeLedger, encodeLedger } from './backup';
import { emptyLedger, maxAmountPaisa } from '../models/ledger';
import { balanceFor, ledgerIndex } from './balance';
import { ensureExactBalances } from '../state/mutations';
const ali = { id: 'new', name: 'Ali', phone: '+92 (300) 123-4567', note: '' };
describe('audit P0 money and backup regressions', () => {
  test('maximum accepted aggregate retains every paisa in both directions', () => {
    const data = { ...emptyLedger(), customers: [ali], transactions: Array.from({ length: 9008 }, (_, i) => ({ id: String(i), customerId: 'new', kind: 'credit' as const,
      amountPaisa: i === 9007 ? 199254749998 : maxAmountPaisa, date: '2020-01-01T00:00:00.000', createdAt: '2020-01-01T00:00:00.000Z', note: '' })) };
    const accepted = ensureExactBalances(decodeLedger(encodeLedger(data)));
    expect(balanceFor(accepted, 'new')).toBe(Number.MAX_SAFE_INTEGER);
    expect(money(balanceFor(accepted, 'new'), 'Rs')).toBe('Rs 90,071,992,547,409.91');
    expect(money(-Number.MAX_SAFE_INTEGER, 'Rs')).toBe('Rs 90,071,992,547,409.91');
    expect(money(1, 'Rs')).toBe('Rs 0.01'); expect(money(0, 'Rs')).toBe('Rs 0.00');
    expect(() => money(Number.MAX_SAFE_INTEGER + 1, 'Rs')).toThrow();
    expect(ledgerIndex(accepted)).toBe(ledgerIndex({ ...accepted, settings: { language: 'ur', darkMode: true } }));
  });
  test.each(['2020-02-30T00:00:00.000', '2021-02-29', '2020-13-01', '2020-01-00', '2020-01-01T24:00:00Z', '01/02/2020', '1899-12-31', '2201-01-01'])('rejects impossible or unspecified date %s', value => {
    expect(validBackupDate(value)).toBe(false);
    const ledger = { ...emptyLedger(), customers: [ali], transactions: [{ id: 't', customerId: 'new', kind: 'credit' as const, amountPaisa: 1, date: value, createdAt: '2020-01-01T00:00:00.000Z', note: '' }] };
    expect(() => decodeLedger(encodeLedger(ledger))).toThrow();
  });
  test.each(['2020-02-29', '2020-02-29T23:59:59.123Z', '2020-02-29T00:00:00.000', '2020-02-29T23:59:59+05:00'])('accepts documented ISO date %s', value => expect(validBackupDate(value)).toBe(true));
  test('rejects invalid backup phone without dropping valid formatted/script digits', () => {
    for (const phone of ['not a phone', '123', '+1234567890123456']) expect(() => decodeLedger(encodeLedger({ ...emptyLedger(), customers: [{ ...ali, phone }] }))).toThrow();
    expect(decodeLedger(encodeLedger({ ...emptyLedger(), customers: [{ ...ali, phone: '۰۳۰۰۱۲۳۴۵۶۷' }] })).customers[0].phone).toBe('۰۳۰۰۱۲۳۴۵۶۷');
  });
});
describe('audit P1 normalized identities', () => {
  test.each(['03001234567', '3001234567', '+92 300 1234567', '00923001234567', '۰۳۰۰۱۲۳۴۵۶۷', '٠٣٠٠١٢٣٤٥٦٧', '0300123', '123-4567'])('finds formatted phone with %s', query => expect(phoneMatches(ali.phone, query)).toBe(true));
  test('keeps international numbers and name queries distinct', () => {
    expect(validPhone('+44 (7700) 900-123')).toBe(true);
    expect(phoneMatches(ali.phone, 'Ali')).toBe(false);
    expect(phoneMatches(ali.phone, '03011234567')).toBe(false);
    expect(phoneMatches(ali.phone, '---')).toBe(false);
    expect(validPhone('۰۳۰۰۱۲۳۴۵۶۷')).toBe(true);
    expect(parseAmount('۱۲۳.۴۵')).toBe(12345);
  });
  test('flags same name plus equivalent phone, allowing other shared-phone identities', () => {
    expect(likelyDuplicates([ali], { id: 'other', name: ' Ali ', phone: '03001234567' })).toEqual([ali]);
    expect(likelyDuplicates([ali], { id: 'other', name: 'Sara', phone: '03001234567' })).toEqual([]);
    expect(likelyDuplicates([ali], { id: 'other', name: 'Ali', phone: '03011234567' })).toEqual([]);
    expect(likDuplicatesSelf()).toEqual([]);
  });
  function likDuplicatesSelf() { return likelyDuplicates([ali], ali); }
  test('reserved new ID has an unambiguous canonical customer URL', () => expect(customerPath('new')).toBe('/customer/new'));
});
