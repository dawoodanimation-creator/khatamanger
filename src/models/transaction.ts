/** Date strings preserve the Flutter JSON representation. */
export type TransactionKind = 'credit' | 'payment';

export interface TransactionItem {
  id: string;
  name: string;
  qty?: string;
  pricePaisa?: number;
}

export interface LedgerTransaction {
  id: string;
  customerId: string;
  kind: TransactionKind;
  amountPaisa: number;
  date: string;
  createdAt: string;
  note: string;
  items?: TransactionItem[];
  dueDate?: string;
  category?: string;
  paymentMethod?: string;
}
