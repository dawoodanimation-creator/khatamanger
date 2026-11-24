import type { Ledger } from '../models/ledger';
import type { TransactionItem, TransactionKind } from '../models/transaction';
import type { TranslationKey } from '../i18n';
export function demoRecords(t: (key: TranslationKey) => string): Pick<Ledger, 'customers' | 'transactions'> {
  const customers = [
    { id: 'demo-ali', name: t('demoAli'), phone: '03001234567', note: t('demoCustomerNote') },
    { id: 'demo-sana', name: t('demoSana'), phone: '03011234567', note: '' },
    { id: 'demo-bilal', name: t('demoBilal'), phone: '03021234567', note: '' },
  ];
  function entry(id: string, customerId: string, kind: TransactionKind, amountPaisa: number, daysAgo: number, note: string, items?: TransactionItem[]) {
    const date = new Date(); date.setDate(date.getDate() - daysAgo); date.setHours(0, 0, 0, 0);
    const local = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T00:00:00.000`;
    return { id, customerId, kind, amountPaisa, date: local, createdAt: date.toISOString(), note, ...(items ? { items } : {}) };
  }
  const transactions = [
    entry('demo-1', 'demo-ali', 'credit', 350000, 7, t('demoCreditNote'), [
      { id: 'item-1', name: 'Aata / آٹا', qty: '10kg', pricePaisa: 200000 },
      { id: 'item-2', name: 'Cooking Oil / گھی', qty: '2L', pricePaisa: 150000 },
    ]),
    entry('demo-2', 'demo-ali', 'payment', 100000, 2, t('demoPaymentNote')),
    entry('demo-3', 'demo-sana', 'credit', 80000, 5, t('demoCreditNote'), [
      { id: 'item-3', name: 'Sugar / چینی', qty: '5kg', pricePaisa: 80000 },
    ]),
    entry('demo-4', 'demo-sana', 'payment', 100000, 1, t('demoAdvanceNote')),
    entry('demo-5', 'demo-bilal', 'credit', 125000, 4, t('demoCreditNote'), [
      { id: 'item-4', name: 'Rice / چاول', qty: '3kg', pricePaisa: 125000 },
    ]),
    entry('demo-6', 'demo-bilal', 'payment', 125000, 0, t('demoPaymentNote')),
  ];
  return { customers, transactions };
}
