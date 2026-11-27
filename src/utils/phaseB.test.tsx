// @vitest-environment jsdom
import { describe, expect, test, beforeAll, beforeEach, afterEach } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { SHOP_TYPE_PRESETS, categoriesForShopTypes } from './shopPresets';
import { DEFAULT_EXPENSE_CATEGORIES, resolveExpenseCategories } from './expenseCategories';
import { decodeLedger, encodeLedger } from './backup';
import { emptyLedger } from '../models/ledger';
import { LedgerProvider } from '../state/LedgerContext';
import { STORAGE_KEY } from '../state/storage';
import { BottomNav } from '../components/BottomNav';

const storageMap = new Map<string, string>();
const mockStorage = {
  getItem: (k: string) => storageMap.get(k) ?? null,
  setItem: (k: string, v: string) => { storageMap.set(k, String(v)); },
  removeItem: (k: string) => { storageMap.delete(k); },
  clear: () => { storageMap.clear(); },
  key: (i: number) => Array.from(storageMap.keys())[i] ?? null,
  get length() { return storageMap.size; },
};

beforeAll(() => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, writable: true, value: mockStorage });
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'localStorage', { configurable: true, writable: true, value: mockStorage });
  }
});

beforeEach(() => storageMap.clear());
afterEach(() => cleanup());

describe('Phase B presets, backward-compat ids, backup round-trip, and hidden mode', () => {
  test('every shop-type preset has 6+ categories with both English and Urdu names', () => {
    expect(SHOP_TYPE_PRESETS.length).toBeGreaterThanOrEqual(20);
    for (const preset of SHOP_TYPE_PRESETS) {
      expect(preset.nameEn.trim().length).toBeGreaterThan(0);
      expect(preset.nameUr.trim().length).toBeGreaterThan(0);
      expect(preset.categories.length).toBeGreaterThanOrEqual(6);
      for (const cat of preset.categories) {
        expect(cat.nameEn.trim().length).toBeGreaterThan(0);
        expect(cat.nameUr.trim().length).toBeGreaterThan(0);
      }
    }
    const elec = categoriesForShopTypes(['electronic_store']);
    expect(elec.map(c => c.nameEn)).toContain('Fan');
    expect(elec.map(c => c.nameEn)).toContain('AC');
  });

  test('all 19 old expense category ids still resolve and shop is hidden unless used', () => {
    const legacyIds = [
      'rashan', 'bills', 'internet', 'rent', 'transport', 'health', 'education',
      'clothes', 'household', 'shaadi', 'charity', 'committee', 'loan', 'shop',
      'entertainment', 'other', 'sale', 'salary', 'other_income',
    ];
    const defaultIds = new Set(DEFAULT_EXPENSE_CATEGORIES.map(c => c.id));
    for (const id of legacyIds) {
      expect(defaultIds.has(id)).toBe(true);
    }

    const freshCats = resolveExpenseCategories();
    expect(freshCats.find(c => c.id === 'shop')?.hidden).toBe(true);

    const usedCats = resolveExpenseCategories(undefined, [
      {
        id: 'e1',
        kind: 'expense',
        amountPaisa: 1000,
        categoryId: 'shop',
        date: '2026-11-27T00:00:00.000',
        createdAt: '2026-11-27T10:00:00.000Z',
        note: 'Legacy shop expense',
      },
    ]);
    expect(usedCats.find(c => c.id === 'shop')?.hidden).toBe(false);
  });

  test('schemaVersion 2 backup with shopTypes, customShopTypes, and customerCategories round-trips', () => {
    const ledger = {
      ...emptyLedger(),
      settings: {
        language: 'en' as const,
        darkMode: false,
        onboarded: true,
        useMode: 'khata' as const,
        shopTypes: ['electronic_store', 'mobile_shop'],
        customShopTypes: ['Solar Panels'],
      },
      customerCategories: [
        { id: 'cc_vip', nameEn: 'VIP Buyer', nameUr: 'خاص گاہک', hidden: false },
      ],
    };
    const decoded = decodeLedger(encodeLedger(ledger));
    expect(decoded.settings.shopTypes).toEqual(['electronic_store', 'mobile_shop']);
    expect(decoded.settings.customShopTypes).toEqual(['Solar Panels']);
    expect(decoded.customerCategories?.[0].nameEn).toBe('VIP Buyer');
  });

  test('useMode khata-only hides Expenses tab and expenses-only hides Khata tab', () => {
    localStorage.setItem(
      STORAGE_KEY,
      encodeLedger({
        ...emptyLedger(),
        settings: { language: 'en', darkMode: false, onboarded: true, useMode: 'khata' },
      })
    );
    const r1 = render(
      <MemoryRouter initialEntries={['/']}>
        <LedgerProvider>
          <BottomNav />
        </LedgerProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Khata' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Expenses' })).toBeNull();
    r1.unmount();

    localStorage.setItem(
      STORAGE_KEY,
      encodeLedger({
        ...emptyLedger(),
        settings: { language: 'en', darkMode: false, onboarded: true, useMode: 'expenses' },
      })
    );
    render(
      <MemoryRouter initialEntries={['/expenses']}>
        <LedgerProvider>
          <BottomNav />
        </LedgerProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Expenses' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Khata' })).toBeNull();
  });
});
