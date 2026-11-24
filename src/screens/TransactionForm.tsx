import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { CalendarDays, Check, Plus, Banknote, ShoppingBag, Trash2, Clock } from 'lucide-react';
import { CustomerContext } from '../components/CustomerContext';
import { Balance } from '../components/Balance';
import { balanceFor, exactAdd } from '../utils/balance';
import { money } from '../utils/money';
import { Header } from '../components/Header';
import { MissingCustomer } from '../components/MissingCustomer';
import type { TransactionItem, TransactionKind } from '../models/transaction';
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
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [dueDate, setDueDate] = useState('');
  const [note, setNote] = useState('');
  const [items, setItems] = useState<Array<{ id: string; name: string; qty: string; price: string }>>([]);
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

  const commonItems = language === 'ur'
    ? ['آٹا', 'چینی', 'گھی / تیل', 'چائے', 'دودھ', 'چاول', 'دال', 'صابن']
    : ['Flour (Aata)', 'Sugar (Chini)', 'Cooking Oil', 'Tea', 'Milk', 'Rice', 'Lentils', 'Soap'];

  function addItem(suggestedName = '') {
    setItems(prev => [...prev, { id: newId(), name: suggestedName, qty: '', price: '' }]);
  }

  function updateItem(id: string, field: 'name' | 'qty' | 'price', val: string) {
    setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(item => item.id !== id));
  }

  const itemsTotalPaisa = useMemo(() => {
    return items.reduce((sum, item) => sum + (parseAmount(item.price) ?? 0), 0);
  }, [items]);

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
      const validItems: TransactionItem[] = items
        .filter(i => i.name.trim().length > 0)
        .map(i => ({
          id: i.id,
          name: i.name.trim(),
          qty: i.qty.trim() || undefined,
          pricePaisa: parseAmount(i.price) ?? undefined,
        }));

      const saved = await addTransaction({ id: transactionId.current, customerId: customerId!, kind,
        amountPaisa: paisa!, date: `${date}T00:00:00.000`, createdAt: new Date().toISOString(), note: note.trim(),
        ...(validItems.length ? { items: validItems } : {}),
        ...(dueDate ? { dueDate } : {}) }, expectedCustomer.current!);
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
      {credit && (
        <div className="form-field">
          <label htmlFor="transaction-due-date" className="flex items-center gap-2">
            <Clock aria-hidden="true"/>{t('dueDateOptional')}
          </label>
          <input
            id="transaction-due-date"
            type="date"
            value={dueDate}
            min={todayISO()}
            onChange={e => setDueDate(e.target.value)}
            disabled={busy}
          />
        </div>
      )}
      {credit && (
        <section className="items-section" aria-label={t('itemsDetails')}>
          <div className="items-header">
            <h3><ShoppingBag aria-hidden="true"/> {t('itemsDetails')}</h3>
            <button
              type="button"
              className="button button-secondary text-sm"
              style={{ width: 'auto', minHeight: '38px', padding: '4px 12px' }}
              onClick={() => addItem()}
            >
              <Plus aria-hidden="true"/> {t('addItem')}
            </button>
          </div>
          <div className="item-chips">
            {commonItems.map(name => (
              <button
                key={name}
                type="button"
                className="item-chip"
                onClick={() => addItem(name)}
              >
                + {name}
              </button>
            ))}
          </div>
          {items.map(item => (
            <div key={item.id} className="item-card">
              <div className="flex items-center justify-between gap-2">
                <input
                  aria-label={t('itemName')}
                  placeholder={t('itemNamePlaceholder')}
                  value={item.name}
                  onChange={e => updateItem(item.id, 'name', e.target.value)}
                  disabled={busy}
                />
                <button
                  type="button"
                  className="item-remove-btn"
                  aria-label={t('removeItem')}
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 aria-hidden="true"/>
                </button>
              </div>
              <div className="item-fields">
                <input
                  aria-label={t('qty')}
                  placeholder={t('qtyPlaceholder')}
                  value={item.qty}
                  onChange={e => updateItem(item.id, 'qty', e.target.value)}
                  disabled={busy}
                />
                <input
                  aria-label={t('itemPrice')}
                  placeholder={t('itemPrice')}
                  value={item.price}
                  inputMode="decimal"
                  dir="ltr"
                  onChange={e => updateItem(item.id, 'price', e.target.value)}
                  disabled={busy}
                />
              </div>
            </div>
          ))}
          {itemsTotalPaisa > 0 && (
            <button
              type="button"
              className="button button-secondary text-sm"
              onClick={() => setAmount((itemsTotalPaisa / 100).toFixed(2))}
            >
              {t('calculateTotalFromItems')}: <bdi dir="ltr">{money(itemsTotalPaisa, t('currencyLabel'))}</bdi>
            </button>
          )}
        </section>
      )}
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
