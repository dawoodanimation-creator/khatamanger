/** Date strings preserve the Flutter JSON representation. */
export type TransactionKind = 'credit' | 'payment';
export interface LedgerTransaction {
  id: string;
  customerId: string;
  kind: TransactionKind;
  amountPaisa: number;
  date: string;
  createdAt: string;
  note: string;
}
