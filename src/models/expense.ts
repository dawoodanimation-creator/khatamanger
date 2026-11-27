export type ExpenseKind = 'expense' | 'income';

export type ExpenseCategoryIcon =
  | 'shopping-bag'
  | 'zap'
  | 'wifi'
  | 'home'
  | 'car'
  | 'heart-pulse'
  | 'graduation-cap'
  | 'shirt'
  | 'sofa'
  | 'gift'
  | 'hand-heart'
  | 'users'
  | 'landmark'
  | 'store'
  | 'film'
  | 'wallet'
  | 'banknote'
  | 'circle-dot';

export interface ExpenseCategory {
  id: string;
  nameEn: string;
  nameUr: string;
  kind: ExpenseKind;
  icon: ExpenseCategoryIcon;
  color: string;
  hidden?: boolean;
  order: number;
  isDefault?: boolean;
}

export interface Expense {
  id: string;
  kind: ExpenseKind;
  amountPaisa: number;
  categoryId: string;
  date: string;
  createdAt: string;
  paymentMethod?: string;
  note: string;
}

export interface CategoryBudget {
  categoryId: string;
  limitPaisa: number;
}
