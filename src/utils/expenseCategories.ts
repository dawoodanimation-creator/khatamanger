import type { Expense, ExpenseCategory, ExpenseCategoryIcon, ExpenseKind } from '../models/expense';

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
  // Daily
  { id: 'food_dining', nameEn: 'Food & Dining Out', nameUr: 'کھانا باہر', kind: 'expense', group: 'daily', icon: 'store', color: '#B45309', order: 0, isDefault: true },
  { id: 'rashan', nameEn: 'Groceries (Rashan)', nameUr: 'راشن', kind: 'expense', group: 'daily', icon: 'shopping-bag', color: '#0F766E', order: 1, isDefault: true },
  { id: 'tea_snacks', nameEn: 'Tea, Snacks & Cold drinks', nameUr: 'چائے اور اسنیکس', kind: 'expense', group: 'daily', icon: 'wallet', color: '#047857', order: 2, isDefault: true },
  { id: 'transport', nameEn: 'Transport (Bike, Rickshaw, Bus, Careem, inDrive)', nameUr: 'سفر', kind: 'expense', group: 'daily', icon: 'car', color: '#1D4ED8', order: 3, isDefault: true },
  { id: 'fuel', nameEn: 'Fuel', nameUr: 'پیٹرول', kind: 'expense', group: 'daily', icon: 'car', color: '#B45309', order: 4, isDefault: true },

  // Bills & Home
  { id: 'internet', nameEn: 'Mobile Load & Internet', nameUr: 'لوڈ اور انٹرنیٹ', kind: 'expense', group: 'bills_home', icon: 'wifi', color: '#1D4ED8', order: 5, isDefault: true },
  { id: 'bills', nameEn: 'Electricity / Gas / Water Bills', nameUr: 'بل', kind: 'expense', group: 'bills_home', icon: 'zap', color: '#B45309', order: 6, isDefault: true },
  { id: 'rent', nameEn: 'House Rent', nameUr: 'کرایہ', kind: 'expense', group: 'bills_home', icon: 'home', color: '#7C3AED', order: 7, isDefault: true },
  { id: 'household', nameEn: 'Household & Repairs', nameUr: 'گھر کا سامان اور مرمت', kind: 'expense', group: 'bills_home', icon: 'sofa', color: '#0F766E', order: 8, isDefault: true },

  // Family
  { id: 'health', nameEn: 'Health, Doctor & Medicine', nameUr: 'صحت اور دوا', kind: 'expense', group: 'family', icon: 'heart-pulse', color: '#BE123C', order: 9, isDefault: true },
  { id: 'education', nameEn: 'Education & Fees', nameUr: 'تعلیم اور فیس', kind: 'expense', group: 'family', icon: 'graduation-cap', color: '#4338CA', order: 10, isDefault: true },
  { id: 'kids_family', nameEn: 'Kids & Family', nameUr: 'بچے اور گھر والے', kind: 'expense', group: 'family', icon: 'users', color: '#0F766E', order: 11, isDefault: true },
  { id: 'clothes', nameEn: 'Clothes & Shoes', nameUr: 'کپڑے اور جوتے', kind: 'expense', group: 'family', icon: 'shirt', color: '#7C3AED', order: 12, isDefault: true },
  { id: 'personal_care', nameEn: 'Personal Care (haircut, salon)', nameUr: 'ذاتی نگہداشت', kind: 'expense', group: 'family', icon: 'shirt', color: '#BE123C', order: 13, isDefault: true },
  { id: 'shaadi', nameEn: 'Shaadi, Gifts & Eid', nameUr: 'شادی، تحائف، عید', kind: 'expense', group: 'family', icon: 'gift', color: '#BE123C', order: 14, isDefault: true },

  // Money
  { id: 'charity', nameEn: 'Charity (Sadqa, Zakat)', nameUr: 'صدقہ و زکوٰۃ', kind: 'expense', group: 'money', icon: 'hand-heart', color: '#047857', order: 15, isDefault: true },
  { id: 'committee', nameEn: 'Committee (BC)', nameUr: 'کمیٹی', kind: 'expense', group: 'money', icon: 'users', color: '#1D4ED8', order: 16, isDefault: true },
  { id: 'loan', nameEn: 'Loan & Kisht', nameUr: 'قسط اور قرض', kind: 'expense', group: 'money', icon: 'landmark', color: '#B45309', order: 17, isDefault: true },
  { id: 'savings', nameEn: 'Savings & Investment', nameUr: 'بچت', kind: 'expense', group: 'money', icon: 'banknote', color: '#047857', order: 18, isDefault: true },

  // Fun & Other
  { id: 'subscriptions', nameEn: 'Subscriptions (Netflix, YouTube, apps)', nameUr: 'سبسکرپشن', kind: 'expense', group: 'fun_other', icon: 'wifi', color: '#4338CA', order: 19, isDefault: true },
  { id: 'entertainment', nameEn: 'Entertainment & Outing', nameUr: 'تفریح', kind: 'expense', group: 'fun_other', icon: 'film', color: '#4338CA', order: 20, isDefault: true },
  { id: 'travel_hajj', nameEn: 'Travel & Hajj-Umrah', nameUr: 'سفر اور حج عمرہ', kind: 'expense', group: 'fun_other', icon: 'car', color: '#0F766E', order: 21, isDefault: true },
  { id: 'pets', nameEn: 'Pets', nameUr: 'پالتو جانور', kind: 'expense', group: 'fun_other', icon: 'heart-pulse', color: '#B45309', order: 22, isDefault: true },
  { id: 'shop', nameEn: 'Shop expenses', nameUr: 'دکان کے اخراجات', kind: 'expense', group: 'fun_other', icon: 'store', color: '#475569', hidden: true, order: 23, isDefault: true },
  { id: 'other', nameEn: 'Other', nameUr: 'دیگر', kind: 'expense', group: 'fun_other', icon: 'circle-dot', color: '#475569', order: 24, isDefault: true },

  // Income defaults (keeping sale, salary, other_income)
  { id: 'salary', nameEn: 'Salary', nameUr: 'تنخواہ', kind: 'income', group: 'income', icon: 'banknote', color: '#0F766E', order: 25, isDefault: true },
  { id: 'business_income', nameEn: 'Business income', nameUr: 'کاروباری آمدنی', kind: 'income', group: 'income', icon: 'store', color: '#047857', order: 26, isDefault: true },
  { id: 'sale', nameEn: 'Sale / Aamdani', nameUr: 'آمدنی / فروخت', kind: 'income', group: 'income', icon: 'wallet', color: '#047857', order: 27, isDefault: true },
  { id: 'pocket_money', nameEn: 'Pocket money', nameUr: 'جیب خرچ', kind: 'income', group: 'income', icon: 'wallet', color: '#1D4ED8', order: 28, isDefault: true },
  { id: 'gift_received', nameEn: 'Gift received', nameUr: 'تحفہ / عیدی', kind: 'income', group: 'income', icon: 'gift', color: '#7C3AED', order: 29, isDefault: true },
  { id: 'refund', nameEn: 'Refund', nameUr: 'واپسی رقم', kind: 'income', group: 'income', icon: 'banknote', color: '#0F766E', order: 30, isDefault: true },
  { id: 'other_income', nameEn: 'Other income', nameUr: 'دیگر آمدنی', kind: 'income', group: 'income', icon: 'circle-dot', color: '#1D4ED8', order: 31, isDefault: true },
];

export function resolveExpenseCategories(
  stored?: ExpenseCategory[],
  expenses?: Expense[]
): ExpenseCategory[] {
  const usedShop = Boolean(expenses?.some(e => e.categoryId === 'shop'));
  const byId = new Map<string, ExpenseCategory>();
  for (const def of DEFAULT_EXPENSE_CATEGORIES) {
    const item = { ...def };
    if (item.id === 'shop' && usedShop) {
      item.hidden = false;
    }
    byId.set(item.id, item);
  }
  if (stored && stored.length > 0) {
    for (const item of stored) {
      const base = byId.get(item.id);
      byId.set(item.id, base ? { ...base, ...item } : { ...item });
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.order - b.order);
}

export function getVisibleCategories(
  categories: ExpenseCategory[],
  kind?: ExpenseKind
): ExpenseCategory[] {
  return categories.filter(c => !c.hidden && (!kind || c.kind === kind));
}

export function getCategoryLabel(
  cat: ExpenseCategory | undefined,
  language: 'en' | 'ur',
  fallbackId?: string
): string {
  if (!cat) return fallbackId ?? '';
  return language === 'ur' ? cat.nameUr || cat.nameEn : cat.nameEn || cat.nameUr;
}
