import type { Customer } from '../models/customer';
import type { LedgerTransaction } from '../models/transaction';
import { maxAmountPaisa, type Ledger } from '../models/ledger';
import { ledgerIndex } from '../utils/balance';
import { validateCustomer } from '../utils/validation';
export function ensureExactBalances(ledger: Ledger): Ledger {
  ledgerIndex(ledger);
  return ledger;
}
export function saveCustomer(ledger: Ledger, customer: Customer): Ledger {
  if (Object.keys(validateCustomer(customer)).length > 0) throw new Error('Invalid customer');
  const clean = { ...customer, name: customer.name.trim(), phone: customer.phone.trim(), note: customer.note.trim() };
  const exists = ledger.customers.some(c => c.id === clean.id);
  return { ...ledger, customers: exists ? ledger.customers.map(c => c.id === clean.id ? clean : c) : [...ledger.customers, clean] };
}
export function deleteCustomer(ledger: Ledger, id: string): Ledger {
  return { ...ledger, customers: ledger.customers.filter(c => c.id !== id), transactions: ledger.transactions.filter(t => t.customerId !== id) };
}
export function deleteTransaction(ledger: Ledger, id: string): Ledger {
  if (!ledger.transactions.some(t => t.id === id)) throw new Error('Transaction does not exist');
  return ensureExactBalances({ ...ledger, transactions: ledger.transactions.filter(t => t.id !== id) });
}
export function addTransaction(ledger: Ledger, transaction: LedgerTransaction): Ledger {
  if (!ledger.customers.some(c => c.id === transaction.customerId)) throw new Error('Customer no longer exists');
  if (!Number.isInteger(transaction.amountPaisa) || transaction.amountPaisa <= 0 || transaction.amountPaisa > maxAmountPaisa) throw new Error('Invalid amount');
  if (ledger.transactions.some(t => t.id === transaction.id)) throw new Error('Duplicate transaction');
  return ensureExactBalances({ ...ledger, transactions: [...ledger.transactions, transaction] });
}
