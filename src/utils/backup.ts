import {
  maxAmountPaisa,
  maxBackupBytes,
  type AppSettings,
  type Ledger,
  type LedgerBackup,
  type ProfileSettings,
} from '../models/ledger';
import { validPhone } from './phone';
import { validBackupDate } from './dates';
import type { Customer } from '../models/customer';
import type { LedgerTransaction } from '../models/transaction';
import type {
  CategoryBudget,
  Expense,
  ExpenseCategory,
  ExpenseCategoryIcon,
} from '../models/expense';
import { CATEGORY_ICON_CHOICES } from './expenseCategories';
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
  const backup: LedgerBackup = { schemaVersion: 2, exportedAt: new Date().toISOString(), ...ledger };
  return JSON.stringify(backup, null, 2);
}
export function decodeLedger(source: string): Ledger {
  if (new TextEncoder().encode(source).length > maxBackupBytes) throw new Error('Backup too large');
  const j = object(JSON.parse(source));
  if ((j.schemaVersion !== 1 && j.schemaVersion !== 2) || !Array.isArray(j.customers) || !Array.isArray(j.transactions)) {
    throw new Error('Unsupported backup');
  }
  const customers: Customer[] = j.customers.map(raw => {
    const c = object(raw);
    const phone = text(c, 'phone', 30);
    if (!validPhone(phone)) throw new Error('Invalid phone');
    const category = typeof c.category === 'string' && c.category.trim() ? text(c, 'category', 60) : undefined;
    const address = typeof c.address === 'string' && c.address.trim() ? text(c, 'address', 200) : undefined;
    let whatsappPhone: string | undefined;
    if (typeof c.whatsappPhone === 'string' && c.whatsappPhone.trim()) {
      whatsappPhone = text(c, 'whatsappPhone', 30);
      if (!validPhone(whatsappPhone)) throw new Error('Invalid whatsappPhone');
    }
    let creditLimitPaisa: number | undefined;
    if (c.creditLimitPaisa !== undefined) {
      if (typeof c.creditLimitPaisa !== 'number' || !Number.isInteger(c.creditLimitPaisa) || c.creditLimitPaisa <= 0 || c.creditLimitPaisa > maxAmountPaisa) {
        throw new Error('Invalid creditLimitPaisa');
      }
      creditLimitPaisa = c.creditLimitPaisa;
    }
    let defaultDueDays: number | undefined;
    if (c.defaultDueDays !== undefined) {
      if (typeof c.defaultDueDays !== 'number' || !Number.isInteger(c.defaultDueDays) || c.defaultDueDays < 1 || c.defaultDueDays > 3650) {
        throw new Error('Invalid defaultDueDays');
      }
      defaultDueDays = c.defaultDueDays;
    }
    return {
      id: text(c, 'id', 100),
      name: text(c, 'name', 100),
      phone,
      note: text(c, 'note', 500, true),
      ...(category ? { category } : {}),
      ...(address ? { address } : {}),
      ...(whatsappPhone ? { whatsappPhone } : {}),
      ...(creditLimitPaisa !== undefined ? { creditLimitPaisa } : {}),
      ...(defaultDueDays !== undefined ? { defaultDueDays } : {}),
    };
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
    const category = typeof t.category === 'string' && t.category.trim() ? text(t, 'category', 60) : undefined;
    const paymentMethod = typeof t.paymentMethod === 'string' && t.paymentMethod.trim() ? text(t, 'paymentMethod', 40) : undefined;
    return {
      id: text(t, 'id', 100), customerId: text(t, 'customerId', 100), kind: t.kind,
      amountPaisa: t.amountPaisa, date: date(t.date), createdAt: date(t.createdAt), note: text(t, 'note', 500, true),
      ...(items && items.length ? { items } : {}),
      ...(dueDate ? { dueDate } : {}),
      ...(category ? { category } : {}),
      ...(paymentMethod ? { paymentMethod } : {}),
    };
  });
  const ids = new Set(customers.map(c => c.id));
  if (ids.size !== customers.length || new Set(transactions.map(t => t.id)).size !== transactions.length || transactions.some(t => !ids.has(t.customerId))) throw new Error('Duplicate IDs or orphan transaction');
  const settings = object(j.settings);
  if ((settings.language !== 'en' && settings.language !== 'ur') || typeof settings.darkMode !== 'boolean') throw new Error('Invalid settings');
  const appSettings: AppSettings = {
    language: settings.language,
    darkMode: settings.darkMode,
  };
  if (typeof settings.hideBalances === 'boolean' && settings.hideBalances) appSettings.hideBalances = true;
  if (typeof settings.pin === 'string' && /^\d{4}$/.test(settings.pin)) appSettings.pin = settings.pin;
  if (typeof settings.onboarded === 'boolean') appSettings.onboarded = settings.onboarded;
  if (settings.useMode === 'khata' || settings.useMode === 'expenses' || settings.useMode === 'both') {
    appSettings.useMode = settings.useMode;
  }
  if (settings.profile && typeof settings.profile === 'object' && !Array.isArray(settings.profile)) {
    const p = object(settings.profile);
    const profile: ProfileSettings = {};
    if (typeof p.shopName === 'string' && p.shopName.trim()) profile.shopName = text(p, 'shopName', 100);
    if (typeof p.ownerName === 'string' && p.ownerName.trim()) profile.ownerName = text(p, 'ownerName', 100);
    if (typeof p.phone === 'string' && p.phone.trim()) {
      const ph = text(p, 'phone', 30);
      if (validPhone(ph)) profile.phone = ph;
    }
    if (Object.keys(profile).length > 0) appSettings.profile = profile;
  }

  const expenses: Expense[] = [];
  if (j.schemaVersion === 2 && j.expenses !== undefined) {
    if (!Array.isArray(j.expenses)) throw new Error('Invalid expenses');
    const seenExpIds = new Set<string>();
    for (const rawExp of j.expenses) {
      const e = object(rawExp);
      const id = text(e, 'id', 100);
      if (seenExpIds.has(id)) throw new Error('Duplicate expense ID');
      seenExpIds.add(id);
      if (e.kind !== 'expense' && e.kind !== 'income') throw new Error('Invalid expense kind');
      if (typeof e.amountPaisa !== 'number' || !Number.isInteger(e.amountPaisa) || e.amountPaisa <= 0 || e.amountPaisa > maxAmountPaisa) {
        throw new Error('Invalid expense amount');
      }
      const paymentMethod = typeof e.paymentMethod === 'string' && e.paymentMethod.trim()
        ? text(e, 'paymentMethod', 40)
        : undefined;
      expenses.push({
        id,
        kind: e.kind,
        amountPaisa: e.amountPaisa,
        categoryId: text(e, 'categoryId', 60),
        date: date(e.date),
        createdAt: date(e.createdAt),
        note: text(e, 'note', 500, true),
        ...(paymentMethod ? { paymentMethod } : {}),
      });
    }
  }

  const iconSet = new Set<string>(CATEGORY_ICON_CHOICES);
  const expenseCategories: ExpenseCategory[] = [];
  if (j.schemaVersion === 2 && j.expenseCategories !== undefined) {
    if (!Array.isArray(j.expenseCategories)) throw new Error('Invalid expenseCategories');
    for (const rawCat of j.expenseCategories) {
      const c = object(rawCat);
      const iconVal = typeof c.icon === 'string' && iconSet.has(c.icon)
        ? (c.icon as ExpenseCategoryIcon)
        : 'circle-dot';
      if (c.kind !== 'expense' && c.kind !== 'income') throw new Error('Invalid category kind');
      expenseCategories.push({
        id: text(c, 'id', 60),
        nameEn: text(c, 'nameEn', 80),
        nameUr: text(c, 'nameUr', 80, true),
        kind: c.kind,
        icon: iconVal,
        color: typeof c.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(c.color) ? c.color : '#475569',
        hidden: typeof c.hidden === 'boolean' ? c.hidden : false,
        order: typeof c.order === 'number' && Number.isFinite(c.order) ? c.order : 0,
        isDefault: typeof c.isDefault === 'boolean' ? c.isDefault : false,
      });
    }
  }

  const budgets: CategoryBudget[] = [];
  if (j.schemaVersion === 2 && j.budgets !== undefined) {
    if (!Array.isArray(j.budgets)) throw new Error('Invalid budgets');
    for (const rawB of j.budgets) {
      const b = object(rawB);
      if (typeof b.limitPaisa !== 'number' || !Number.isInteger(b.limitPaisa) || b.limitPaisa <= 0 || b.limitPaisa > maxAmountPaisa) {
        throw new Error('Invalid budget limit');
      }
      budgets.push({ categoryId: text(b, 'categoryId', 60), limitPaisa: b.limitPaisa });
    }
  }

  return {
    customers,
    transactions,
    settings: appSettings,
    expenses,
    expenseCategories,
    budgets,
  };
}
