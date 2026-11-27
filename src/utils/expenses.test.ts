import { describe, expect, test } from 'vitest';
import { decodeLedger, encodeLedger } from './backup';
import { emptyLedger } from '../models/ledger';
import {
  computeExpenseMonthSummary,
  detectRecurringBillSuggestions,
  groupExpensesByDay,
} from './expenses';
import { DEFAULT_EXPENSE_CATEGORIES, resolveExpenseCategories } from './expenseCategories';
import { expensesToCsv } from './csvExport';

describe('expenses backup, summary, grouping, and CSV', () => {
  test('old schemaVersion 1 backup restores with empty expenses', () => {
    const v1 = {
      schemaVersion: 1,
      exportedAt: '2026-01-01T00:00:00.000Z',
      customers: [{ id: 'c1', name: 'Ali', phone: '0300-1234567', note: '' }],
      transactions: [],
      settings: { language: 'en', darkMode: false },
    };
    const decoded = decodeLedger(JSON.stringify(v1));
    expect(decoded.customers).toHaveLength(1);
    expect(decoded.expenses).toEqual([]);
    expect(decoded.expenseCategories).toEqual([]);
  });

  test('schemaVersion 2 backup round-trips expenses, custom categories, budgets, and profile', () => {
    const ledger = {
      ...emptyLedger(),
      settings: {
        language: 'en' as const,
        darkMode: true,
        onboarded: true,
        useMode: 'both' as const,
        profile: { shopName: 'Madina Store', ownerName: 'Usman', phone: '0300-1112223' },
      },
      expenses: [
        {
          id: 'e1',
          kind: 'expense' as const,
          amountPaisa: 150000,
          categoryId: 'rashan',
          date: '2026-11-27T00:00:00.000',
          createdAt: '2026-11-27T10:00:00.000Z',
          paymentMethod: 'Cash',
          note: 'Atta and sugar',
        },
      ],
      expenseCategories: [
        {
          id: 'custom_tea',
          nameEn: 'Chai Guests',
          nameUr: 'چائے',
          kind: 'expense' as const,
          icon: 'wallet' as const,
          color: '#0F766E',
          order: 99,
        },
      ],
      budgets: [{ categoryId: 'rashan', limitPaisa: 500000 }],
    };

    const json = encodeLedger(ledger);
    expect(JSON.parse(json).schemaVersion).toBe(2);
    const decoded = decodeLedger(json);
    expect(decoded.expenses).toHaveLength(1);
    expect(decoded.expenses?.[0].amountPaisa).toBe(150000);
    expect(decoded.expenseCategories?.[0].id).toBe('custom_tea');
    expect(decoded.budgets?.[0].limitPaisa).toBe(500000);
    expect(decoded.settings.profile?.shopName).toBe('Madina Store');
    expect(decoded.settings.onboarded).toBe(true);
    expect(decoded.settings.useMode).toBe('both');
  });

  test('computeExpenseMonthSummary computes spent, income, net, today, sharePct, and deltaPct', () => {
    const expenses = [
      {
        id: 'e1',
        kind: 'expense' as const,
        amountPaisa: 300000,
        categoryId: 'rashan',
        date: '2026-11-27T00:00:00.000',
        createdAt: '2026-11-27T09:00:00.000Z',
        note: '',
      },
      {
        id: 'e2',
        kind: 'expense' as const,
        amountPaisa: 100000,
        categoryId: 'bills',
        date: '2026-11-10T00:00:00.000',
        createdAt: '2026-11-10T09:00:00.000Z',
        note: '',
      },
      {
        id: 'e3',
        kind: 'income' as const,
        amountPaisa: 500000,
        categoryId: 'sale',
        date: '2026-11-20T00:00:00.000',
        createdAt: '2026-11-20T09:00:00.000Z',
        note: '',
      },
      {
        id: 'e4',
        kind: 'expense' as const,
        amountPaisa: 200000,
        categoryId: 'rashan',
        date: '2026-10-15T00:00:00.000',
        createdAt: '2026-10-15T09:00:00.000Z',
        note: '',
      },
    ];

    const summary = computeExpenseMonthSummary(expenses, '2026-11', '2026-11-27');
    expect(summary.spentPaisa).toBe(400000);
    expect(summary.incomePaisa).toBe(500000);
    expect(summary.netPaisa).toBe(100000);
    expect(summary.todaySpentPaisa).toBe(300000);
    expect(summary.byCategory[0]).toEqual({
      categoryId: 'rashan',
      spentPaisa: 300000,
      sharePct: 75,
      prevSpentPaisa: 200000,
      deltaPct: 50,
    });
    expect(summary.byCategory[1].sharePct).toBe(25);
  });

  test('groupExpensesByDay groups newest day first with day totals', () => {
    const expenses = [
      {
        id: 'e1',
        kind: 'expense' as const,
        amountPaisa: 10000,
        categoryId: 'rashan',
        date: '2026-11-25T00:00:00.000',
        createdAt: '2026-11-25T08:00:00.000Z',
        note: 'A',
      },
      {
        id: 'e2',
        kind: 'expense' as const,
        amountPaisa: 25000,
        categoryId: 'bills',
        date: '2026-11-27T00:00:00.000',
        createdAt: '2026-11-27T10:00:00.000Z',
        note: 'B',
      },
      {
        id: 'e3',
        kind: 'income' as const,
        amountPaisa: 50000,
        categoryId: 'sale',
        date: '2026-11-27T00:00:00.000',
        createdAt: '2026-11-27T12:00:00.000Z',
        note: 'C',
      },
    ];
    const groups = groupExpensesByDay(expenses);
    expect(groups).toHaveLength(2);
    expect(groups[0].day).toBe('2026-11-27');
    expect(groups[0].totalSpentPaisa).toBe(25000);
    expect(groups[0].totalIncomePaisa).toBe(50000);
    expect(groups[0].entries[0].id).toBe('e3');
  });

  test('expensesToCsv outputs plain numeric amounts and detectRecurringBillSuggestions flags prior-month bills', () => {
    const expenses = [
      {
        id: 'e1',
        kind: 'expense' as const,
        amountPaisa: 2500000,
        categoryId: 'rent',
        date: '2026-10-05T00:00:00.000',
        createdAt: '2026-10-05T08:00:00.000Z',
        paymentMethod: 'Cash',
        note: 'Shop rent',
      },
    ];
    const csv = expensesToCsv(expenses, DEFAULT_EXPENSE_CATEGORIES, 'en');
    expect(csv).toContain('ID,Type,Category,Amount,Date,Payment Method,Note');
    expect(csv).toContain('e1,Expense,House Rent,25000.00,2026-10-05,Cash,Shop rent');

    const suggestions = detectRecurringBillSuggestions(
      expenses,
      resolveExpenseCategories(),
      '2026-11'
    );
    expect(suggestions).toEqual([{ categoryId: 'rent', suggestedAmountPaisa: 2500000 }]);
  });
});
