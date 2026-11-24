import { maxAmountPaisa, maxBackupBytes, type Ledger, type LedgerBackup } from '../models/ledger';
import { validPhone } from './phone';
import { validBackupDate } from './dates';
import type { Customer } from '../models/customer';
import type { LedgerTransaction } from '../models/transaction';
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected object');
  return value as Record<string, unknown>;
}
function text(j: Record<string, unknown>, key: string, max: number, empty = false): string {
  const value = j[key];
  if (typeof value !== 'string' || value.length > max || (!empty && !value.trim())) throw new Error(`Invalid ${key}`);
  return value.trim();
}
function date(value: unknown): string {
  if (typeof value !== 'string') throw new Error('Invalid date');
  if (!validBackupDate(value)) throw new Error('Invalid date');
  return value;
}
export function encodeLedger(ledger: Ledger): string {
  const backup: LedgerBackup = { schemaVersion: 1, exportedAt: new Date().toISOString(), ...ledger };
  return JSON.stringify(backup, null, 2);
}
export function decodeLedger(source: string): Ledger {
  if (new TextEncoder().encode(source).length > maxBackupBytes) throw new Error('Backup too large');
  const j = object(JSON.parse(source));
  if (j.schemaVersion !== 1 || !Array.isArray(j.customers) || !Array.isArray(j.transactions)) throw new Error('Unsupported backup');
  const customers: Customer[] = j.customers.map(raw => {
    const c = object(raw);
    const phone = text(c, 'phone', 30);
    if (!validPhone(phone)) throw new Error('Invalid phone');
    return { id: text(c, 'id', 100), name: text(c, 'name', 100), phone, note: text(c, 'note', 500, true) };
  });
  const transactions: LedgerTransaction[] = j.transactions.map(raw => {
    const t = object(raw);
    if (typeof t.amountPaisa !== 'number' || !Number.isInteger(t.amountPaisa) || t.amountPaisa <= 0 || t.amountPaisa > maxAmountPaisa) throw new Error('Invalid transaction amount');
    if (t.kind !== 'credit' && t.kind !== 'payment') throw new Error('Invalid transaction kind');
    const items = Array.isArray(t.items) ? t.items.map(rawItem => {
      const it = object(rawItem);
      return {
        id: text(it, 'id', 100),
        name: text(it, 'name', 100),
        qty: it.qty ? text(it, 'qty', 50, true) : undefined,
        pricePaisa: typeof it.pricePaisa === 'number' && Number.isInteger(it.pricePaisa) && it.pricePaisa >= 0 && it.pricePaisa <= maxAmountPaisa ? it.pricePaisa : undefined,
      };
    }) : undefined;
    const dueDate = t.dueDate && typeof t.dueDate === 'string' ? date(t.dueDate) : undefined;
    return {
      id: text(t, 'id', 100), customerId: text(t, 'customerId', 100), kind: t.kind,
      amountPaisa: t.amountPaisa, date: date(t.date), createdAt: date(t.createdAt), note: text(t, 'note', 500, true),
      ...(items && items.length ? { items } : {}),
      ...(dueDate ? { dueDate } : {}),
    };
  });
  const ids = new Set(customers.map(c => c.id));
  if (ids.size !== customers.length || new Set(transactions.map(t => t.id)).size !== transactions.length || transactions.some(t => !ids.has(t.customerId))) throw new Error('Duplicate IDs or orphan transaction');
  const settings = object(j.settings);
  if ((settings.language !== 'en' && settings.language !== 'ur') || typeof settings.darkMode !== 'boolean') throw new Error('Invalid settings');
  const appSettings: { language: 'en' | 'ur'; darkMode: boolean; hideBalances?: boolean; pin?: string } = {
    language: settings.language,
    darkMode: settings.darkMode,
  };
  if (typeof settings.hideBalances === 'boolean' && settings.hideBalances) appSettings.hideBalances = true;
  if (typeof settings.pin === 'string' && /^\d{4}$/.test(settings.pin)) appSettings.pin = settings.pin;
  return { customers, transactions, settings: appSettings };
}
