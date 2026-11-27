import type { ExpenseCategory, ExpenseCategoryIcon, ExpenseKind } from '../models/expense';

export const CATEGORY_ICON_CHOICES: ExpenseCategoryIcon[] = [
  'shopping-bag',
  'zap',
  'wifi',
  'home',
  'car',
  'heart-pulse',
  'graduation-cap',
  'shirt',
  'sofa',
  'gift',
  'hand-heart',
  'users',
  'landmark',
  'store',
  'film',
  'wallet',
  'banknote',
  'circle-dot',
];

export const CATEGORY_COLOR_CHOICES: string[] = [
  '#0F766E',
  '#B45309',
  '#1D4ED8',
  '#7C3AED',
  '#BE123C',
  '#047857',
  '#4338CA',
  '#475569',
];

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: 'rashan', nameEn: 'Rashan & Groceries', nameUr: 'راشن', kind: 'expense', icon: 'shopping-bag', color: '#0F766E', order: 0, isDefault: true },
  { id: 'bills', nameEn: 'Bills: Bijli, Gas, Pani', nameUr: 'بل', kind: 'expense', icon: 'zap', color: '#B45309', order: 1, isDefault: true },
  { id: 'internet', nameEn: 'Internet & Mobile load', nameUr: 'انٹرنیٹ اور لوڈ', kind: 'expense', icon: 'wifi', color: '#1D4ED8', order: 2, isDefault: true },
  { id: 'rent', nameEn: 'Rent', nameUr: 'کرایہ', kind: 'expense', icon: 'home', color: '#7C3AED', order: 3, isDefault: true },
  { id: 'transport', nameEn: 'Transport & Fuel', nameUr: 'سفر اور پیٹرول', kind: 'expense', icon: 'car', color: '#047857', order: 4, isDefault: true },
  { id: 'health', nameEn: 'Health & Medicine', nameUr: 'صحت اور دوا', kind: 'expense', icon: 'heart-pulse', color: '#BE123C', order: 5, isDefault: true },
  { id: 'education', nameEn: 'Education & Fees', nameUr: 'تعلیم اور فیس', kind: 'expense', icon: 'graduation-cap', color: '#4338CA', order: 6, isDefault: true },
  { id: 'clothes', nameEn: 'Clothes', nameUr: 'کپڑے', kind: 'expense', icon: 'shirt', color: '#7C3AED', order: 7, isDefault: true },
  { id: 'household', nameEn: 'Household items', nameUr: 'گھر کا سامان', kind: 'expense', icon: 'sofa', color: '#0F766E', order: 8, isDefault: true },
  { id: 'shaadi', nameEn: 'Shaadi & Gifts', nameUr: 'شادی اور تحائف', kind: 'expense', icon: 'gift', color: '#BE123C', order: 9, isDefault: true },
  { id: 'charity', nameEn: 'Charity (Sadqa, Zakat)', nameUr: 'صدقہ و زکوٰۃ', kind: 'expense', icon: 'hand-heart', color: '#047857', order: 10, isDefault: true },
  { id: 'committee', nameEn: 'Committee (BC)', nameUr: 'کمیٹی', kind: 'expense', icon: 'users', color: '#1D4ED8', order: 11, isDefault: true },
  { id: 'loan', nameEn: 'Loan & Kisht', nameUr: 'قسط اور قرض', kind: 'expense', icon: 'landmark', color: '#B45309', order: 12, isDefault: true },
  { id: 'shop', nameEn: 'Shop expenses (Mazdoori, Tankhwah, Maal)', nameUr: 'دکان کے اخراجات', kind: 'expense', icon: 'store', color: '#475569', order: 13, isDefault: true },
  { id: 'entertainment', nameEn: 'Entertainment', nameUr: 'تفریح', kind: 'expense', icon: 'film', color: '#4338CA', order: 14, isDefault: true },
  { id: 'other', nameEn: 'Other', nameUr: 'دیگر', kind: 'expense', icon: 'circle-dot', color: '#475569', order: 15, isDefault: true },
  // Income defaults
  { id: 'sale', nameEn: 'Sale / Aamdani', nameUr: 'آمدنی / فروخت', kind: 'income', icon: 'wallet', color: '#047857', order: 16, isDefault: true },
  { id: 'salary', nameEn: 'Salary', nameUr: 'تنخواہ', kind: 'income', icon: 'banknote', color: '#0F766E', order: 17, isDefault: true },
  { id: 'other_income', nameEn: 'Other income', nameUr: 'دیگر آمدنی', kind: 'income', icon: 'circle-dot', color: '#1D4ED8', order: 18, isDefault: true },
];

export function resolveExpenseCategories(stored?: ExpenseCategory[]): ExpenseCategory[] {
  if (!stored || stored.length === 0) {
    return [...DEFAULT_EXPENSE_CATEGORIES].sort((a, b) => a.order - b.order);
  }
  const byId = new Map<string, ExpenseCategory>();
  for (const def of DEFAULT_EXPENSE_CATEGORIES) {
    byId.set(def.id, { ...def });
  }
  for (const item of stored) {
    byId.set(item.id, { ...item });
  }
  return Array.from(byId.values()).sort((a, b) => a.order - b.order);
}

export function getVisibleCategories(
  categories: ExpenseCategory[],
  kind?: ExpenseKind
): ExpenseCategory[] {
  return categories.filter(c => !c.hidden && (!kind || c.kind === kind));
}

export function getCategoryLabel(cat: ExpenseCategory | undefined, language: 'en' | 'ur', fallbackId?: string): string {
  if (!cat) return fallbackId ?? '';
  return language === 'ur' ? cat.nameUr || cat.nameEn : cat.nameEn || cat.nameUr;
}
