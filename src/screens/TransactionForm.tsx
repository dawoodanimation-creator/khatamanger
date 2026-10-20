import { useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CalendarDays, Check, Plus, Banknote } from 'lucide-react';
import { CustomerContext } from '../components/CustomerContext';
import { Balance } from '../components/Balance';
import { balanceFor, exactAdd } from '../utils/balance';
import { money } from '../utils/money';
import { Header } from '../components/Header';
import { MissingCustomer } from '../components/MissingCustomer';
import type { TransactionKind } from '../models/transaction';
import { useI18n, type TranslationKey } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { newId } from '../utils/ids';
import { customerPath } from '../utils/routes';
import { parseAmount } from '../utils/money';
import { todayISO, validEntryDate } from '../utils/dates';
export function TransactionForm({ kind }: { kind: TransactionKind }) {
  const { customerId } = useParams();
  const { ledger, addTransaction, writeError } = useLedger();
  const customer = ledger.customers.find(c => c.id === customerId);
  const { t } = useI18n();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<Partial<Record<'amount' | 'date' | 'note', TranslationKey>>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const expectedCustomer = useRef(customer);
  const saving = useRef(false);
  const transactionId = useRef<string | null>(null);
  if (!customer) return <MissingCustomer/>;
  const backTo = customerPath(customer.id);
  const credit = kind === 'credit';
  const previewAmount = parseAmount(amount);
  let projected: number | null = null;
  try { if (previewAmount !== null) projected = exactAdd(balanceFor(ledger, customer.id), credit ? previewAmount : -previewAmount); } catch { /* Invalid aggregate: no misleading preview. */ }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current) return;
    const paisa = parseAmount(amount);
    const found: typeof errors = {};
    if (paisa === null) found.amount = 'amountInvalid';
    if (!validEntryDate(date)) found.date = 'dateInvalid';
    if (note.length > 500) found.note = 'noteInvalid';
    setErrors(found); setError('');
    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`transaction-${first}`)?.focus(); return;
    }
    saving.current = true; setBusy(true);
    try {
      transactionId.current ??= newId();
      const saved = await addTransaction({ id: transactionId.current, customerId: customerId!, kind,
        amountPaisa: paisa!, date: `${date}T00:00:00.000`, createdAt: new Date().toISOString(), note: note.trim() }, expectedCustomer.current!);
      if (saved) navigate(backTo, { replace: true });
      else setError(t(writeError()));
    } catch { setError(t('error')); }
    finally { saving.current = false; setBusy(false); }
  }
  return <><Header title={t(credit ? 'credit' : 'payment')} backTo={backTo}/>
    <form noValidate onSubmit={submit} className="page-content form-content">
      <div className={`transaction-help ${credit ? 'credit-help' : 'payment-help'}`}><span className="transaction-symbol">{credit ? <Plus/> : <Banknote/>}</span><div><CustomerContext customer={customer}/><p>{t(credit ? 'creditHelp' : 'paymentHelp')}</p></div></div>
      <div className="form-field"><label htmlFor="transaction-amount">{t('amount')}</label>
        <input id="transaction-amount" data-entry-focus className="amount-input" value={amount} onChange={e => setAmount(e.target.value)} type="text" inputMode="decimal" dir="ltr" aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'amount-error' : undefined} disabled={busy}/>
        {errors.amount && <p id="amount-error" className="field-error" role="alert">{t(errors.amount)}</p>}
      </div>
      <div className="form-field"><label htmlFor="transaction-date" className="flex items-center gap-2"><CalendarDays/>{t('date')}</label>
        <input id="transaction-date" type="date" value={date} min="1900-01-01" max={todayISO()} onChange={e => setDate(e.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'date-error' : undefined} disabled={busy}/>
        {errors.date && <p id="date-error" className="field-error" role="alert">{t(errors.date)}</p>}
      </div>
      <div className="form-field"><label htmlFor="transaction-note">{t('note')}</label>
        <textarea id="transaction-note" value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={3} aria-invalid={!!errors.note} aria-describedby={errors.note ? 'transaction-note-error' : undefined} disabled={busy}/>
        {errors.note && <p id="transaction-note-error" className="field-error" role="alert">{t(errors.note)}</p>}
      </div>
      {error && <p className="field-error" role="alert">{error}</p>}
      {previewAmount !== null && <section className="money-review" aria-label={t('reviewEntry')}>
        <CustomerContext customer={customer}/><p>{t(credit ? 'credit' : 'payment')}: <bdi dir="ltr">{money(previewAmount, t('currencyLabel'))}</bdi></p>
        <p>{t('running')}</p>{projected === null ? <p className="field-error">{t('balanceRangeError')}</p> : <Balance paisa={projected}/>}
      </section>}
      <div className="form-actions"><button className="button button-primary" type="submit" disabled={busy || projected === null && previewAmount !== null}><Check/>{t(credit ? 'saveCredit' : 'savePayment')}</button><Link className="button button-secondary" to={backTo}>{t('cancel')}</Link></div>
    </form></>;
}
