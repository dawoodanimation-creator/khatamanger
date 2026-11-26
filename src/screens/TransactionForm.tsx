import { useMemo, useRef, useState, useEffect, type FormEvent } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import {
  CalendarDays,
  Check,
  Plus,
  Trash2,
  Clock,
  X,
} from 'lucide-react';
import { Balance } from '../components/Balance';
import { balanceFor, exactAdd } from '../utils/balance';
import { formatMoney } from '../utils/numberFormat';
import { Header } from '../components/Header';
import { MissingCustomer } from '../components/MissingCustomer';
import type { TransactionItem, TransactionKind } from '../models/transaction';
import { useI18n, type TranslationKey } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { newId } from '../utils/ids';
import { customerPath } from '../utils/routes';
import { parseAmount } from '../utils/money';
import { todayISO, validEntryDate } from '../utils/dates';
import { getInitials } from '../utils/avatar';

export function TransactionForm({ kind }: { kind: TransactionKind }) {
  const { customerId } = useParams();
  const { ledger, addTransaction, writeError } = useLedger();
  const { prefs } = useUiPrefs();
  const customer = ledger.customers.find(c => c.id === customerId);
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showCustomDate, setShowCustomDate] = useState(false);

  const [dueDate, setDueDate] = useState('');
  const [showDueDate, setShowDueDate] = useState(false);

  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);

  const [showItems, setShowItems] = useState(false);
  const [items, setItems] = useState<
    Array<{ id: string; name: string; qty: string; price: string }>
  >([]);

  const [viewportBottom, setViewportBottom] = useState(0);

  const [errors, setErrors] = useState<
    Partial<Record<'amount' | 'date' | 'note', TranslationKey>>
  >({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const expectedCustomer = useRef(customer);
  const saving = useRef(false);
  const transactionId = useRef<string | null>(null);

  // Keep Save bar above mobile keyboard using visualViewport
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    function handleResize() {
      const vv = window.visualViewport;
      if (!vv) return;
      const offset = window.innerHeight - (vv.height + vv.offsetTop);
      setViewportBottom(Math.max(0, offset));
    }
    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);
    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  if (!customer) return <MissingCustomer />;

  const backTo = customerPath(customer.id);
  const credit = kind === 'credit';
  const currentBalance = balanceFor(ledger, customer.id);
  const initials = getInitials(customer.name);

  // Compute projected balance
  const previewAmount = parseAmount(amount);
  let projected: number | null = null;
  try {
    if (previewAmount !== null) {
      projected = exactAdd(currentBalance, credit ? previewAmount : -previewAmount);
    }
  } catch {
    /* Invalid aggregate */
  }

  // Quick date calculations
  const todayStr = todayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = todayISO(yesterdayDate);

  const commonItems =
    language === 'ur'
      ? ['آٹا', 'چینی', 'گھی / تیل', 'چائے', 'دودھ', 'چاول', 'دال', 'صابن']
      : [
          'Flour (Aata)',
          'Sugar (Chini)',
          'Cooking Oil',
          'Tea',
          'Milk',
          'Rice',
          'Lentils',
          'Soap',
        ];

  function addItem(suggestedName = '') {
    setShowItems(true);
    setItems(prev => [...prev, { id: newId(), name: suggestedName, qty: '', price: '' }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItem(id: string, field: 'name' | 'qty' | 'price', val: string) {
    setItems(prev =>
      prev.map(i => (i.id === id ? { ...i, [field]: val } : i))
    );
  }

  const itemsTotalPaisa = useMemo(() => {
    return items.reduce((acc, curr) => {
      const p = parseAmount(curr.price);
      return p ? acc + p : acc;
    }, 0);
  }, [items]);

  function handleQuickAmount(addValue: number) {
    const currentVal = parseAmount(amount) ?? 0;
    const nextVal = currentVal + addValue * 100;
    setAmount((nextVal / 100).toFixed(2));
    if (errors.amount) {
      setErrors(prev => ({ ...prev, amount: undefined }));
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current) return;

    const paisa = parseAmount(amount);
    const found: typeof errors = {};
    if (paisa === null) found.amount = 'amountInvalid';
    if (!validEntryDate(date)) found.date = 'dateInvalid';
    if (note.length > 500) found.note = 'noteInvalid';

    setErrors(found);
    setError('');

    if (Object.keys(found).length) {
      const first = Object.keys(found)[0];
      document.getElementById(`transaction-${first}`)?.focus();
      return;
    }

    saving.current = true;
    setBusy(true);

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

      const saved = await addTransaction(
        {
          id: transactionId.current,
          customerId: customerId!,
          kind,
          amountPaisa: paisa!,
          date: `${date}T00:00:00.000`,
          createdAt: new Date().toISOString(),
          note: note.trim(),
          ...(validItems.length ? { items: validItems } : {}),
          ...(dueDate ? { dueDate } : {}),
        },
        expectedCustomer.current!
      );

      if (saved) navigate(backTo, { replace: true });
      else setError(t(writeError()));
    } catch {
      setError(t('error'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  return (
    <>
      <Header title={t(credit ? 'credit' : 'payment')} backTo={backTo} />

      <form
        noValidate
        onSubmit={submit}
        className="page-content form-content transaction-form-page"
      >
        {/* Single quiet line: avatar, customer name, current balance (no colored banner) */}
        <div className="transaction-customer-quiet-line transaction-help flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="customer-avatar avatar-neutral avatar-sm" aria-hidden="true">
              {initials}
            </div>
            <strong className="customer-line-name truncate" dir="auto">
              {customer.name}
            </strong>
            <span className="sr-only">{customer.phone}</span>
          </div>
          <div className="customer-line-balance">
            <span className="balance-label-quiet">{t('balance')}: </span>
            <Balance paisa={currentBalance} />
          </div>
        </div>

        {/* Big Amount Input Field */}
        <div className="form-field amount-field-block">
          <label htmlFor="transaction-amount" className="amount-label">
            {t('amount')}
          </label>

          <div className="big-amount-input-wrapper">
            <span className="big-amount-prefix" aria-hidden="true">
              {t('currencyLabel')}
            </span>
            <input
              id="transaction-amount"
              data-entry-focus
              className="big-amount-input"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
              }}
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              dir="ltr"
              autoFocus
              aria-invalid={!!errors.amount}
              aria-describedby={errors.amount ? 'amount-error' : undefined}
              disabled={busy}
            />
          </div>

          {previewAmount !== null && (
            <div className="amount-live-preview">
              <span>=</span>
              <strong>{formatMoney(previewAmount, t('currencyLabel'), prefs.numberFormat)}</strong>
            </div>
          )}

          {errors.amount && (
            <p id="amount-error" className="field-error" role="alert">
              {t(errors.amount)}
            </p>
          )}

          {/* Quick Amount Chips as plain outlined text chips */}
          <div
            className="quick-amount-chips"
            role="group"
            aria-label="Quick amount shortcuts"
          >
            <button
              type="button"
              className="quick-amount-chip"
              onClick={() => handleQuickAmount(100)}
            >
              +100
            </button>
            <button
              type="button"
              className="quick-amount-chip"
              onClick={() => handleQuickAmount(500)}
            >
              +500
            </button>
            <button
              type="button"
              className="quick-amount-chip"
              onClick={() => handleQuickAmount(1000)}
            >
              +1,000
            </button>
            <button
              type="button"
              className="quick-amount-chip"
              onClick={() => handleQuickAmount(5000)}
            >
              +5,000
            </button>
          </div>
        </div>

        {/* Date Options (Three simple options: Today / Yesterday / Pick date) */}
        <div className="form-field date-field-block">
          <label htmlFor="transaction-date" className="date-field-label">
            <CalendarDays size={16} aria-hidden="true" />
            <span>{t('date')}</span>
          </label>

          <div className="date-shortcuts-row">
            <button
              type="button"
              className={`date-chip ${date === todayStr && !showCustomDate ? 'active' : ''}`}
              onClick={() => {
                setDate(todayStr);
                setShowCustomDate(false);
              }}
            >
              {t('today')}
            </button>
            <button
              type="button"
              className={`date-chip ${date === yesterdayStr && !showCustomDate ? 'active' : ''}`}
              onClick={() => {
                setDate(yesterdayStr);
                setShowCustomDate(false);
              }}
            >
              {t('yesterday')}
            </button>
            <button
              type="button"
              className={`date-chip ${showCustomDate || (date !== todayStr && date !== yesterdayStr) ? 'active' : ''}`}
              onClick={() => setShowCustomDate(true)}
            >
              {t('pickDate')}
            </button>
          </div>

          {(showCustomDate || (date !== todayStr && date !== yesterdayStr)) && (
            <input
              id="transaction-date"
              className="custom-date-input"
              value={date}
              onChange={e => {
                setDate(e.target.value);
                if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
              }}
              type="date"
              aria-invalid={!!errors.date}
              aria-describedby={errors.date ? 'transaction-date-error' : undefined}
              disabled={busy}
            />
          )}

          {errors.date && (
            <p id="transaction-date-error" className="field-error" role="alert">
              {t(errors.date)}
            </p>
          )}
        </div>

        {/* Collapsed Options (+ Add due date, + Add items, + Add note) */}
        <div className="form-collapsed-options">
          {/* Due Date Option */}
          {!showDueDate && !dueDate ? (
            <button
              type="button"
              className="text-link-quiet"
              onClick={() => setShowDueDate(true)}
            >
              <Plus size={15} aria-hidden="true" />
              <span>{t('dueDate')}</span>
            </button>
          ) : (
            <div className="form-field due-date-block">
              <div className="flex items-center justify-between">
                <label htmlFor="transaction-due-date" className="text-sm text-muted">
                  <Clock size={14} aria-hidden="true" />
                  <span>{t('dueDate')}</span>
                </label>
                <button
                  type="button"
                  className="icon-button icon-button-sm"
                  onClick={() => {
                    setDueDate('');
                    setShowDueDate(false);
                  }}
                  aria-label="Remove due date"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                id="transaction-due-date"
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                disabled={busy}
              />
            </div>
          )}

          {/* Items Breakdown Option (Credit only) */}
          {credit && !showItems && items.length === 0 ? (
            <button
              type="button"
              className="text-link-quiet"
              onClick={() => addItem()}
            >
              <Plus size={15} aria-hidden="true" />
              <span>{t('items')}</span>
            </button>
          ) : credit && (
            <section className="items-section-block">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{t('items')}</span>
                <button
                  type="button"
                  className="icon-button icon-button-sm"
                  onClick={() => {
                    setItems([]);
                    setShowItems(false);
                  }}
                  aria-label="Remove items"
                >
                  <X size={14} />
                </button>
              </div>

              {/* Suggestions */}
              <div className="common-items-chips">
                {commonItems.map(name => (
                  <button
                    key={name}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => addItem(name)}
                  >
                    + {name}
                  </button>
                ))}
              </div>

              {/* Item Rows */}
              <div className="items-list-container">
                {items.map(item => (
                  <div key={item.id} className="item-input-card">
                    <div className="item-input-row">
                      <input
                        className="item-name-input"
                        placeholder={t('itemName')}
                        value={item.name}
                        onChange={e => updateItem(item.id, 'name', e.target.value)}
                        disabled={busy}
                      />
                      <button
                        type="button"
                        className="icon-button item-remove-btn"
                        onClick={() => removeItem(item.id)}
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="item-meta-inputs-row">
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

                <button
                  type="button"
                  className="button button-secondary text-sm add-item-blank-btn"
                  onClick={() => addItem()}
                >
                  <Plus size={14} aria-hidden="true" /> {t('addItem')}
                </button>

                {itemsTotalPaisa > 0 && (
                  <button
                    type="button"
                    className="button button-secondary text-sm apply-total-btn"
                    onClick={() => setAmount((itemsTotalPaisa / 100).toFixed(2))}
                  >
                    {t('calculateTotalFromItems')}:{' '}
                    <bdi dir="ltr">{formatMoney(itemsTotalPaisa, t('currencyLabel'), prefs.numberFormat)}</bdi>
                  </button>
                )}
              </div>
            </section>
          )}

          {/* Note Option */}
          {!showNote && !note ? (
            <button
              type="button"
              className="text-link-quiet"
              onClick={() => setShowNote(true)}
            >
              <Plus size={15} aria-hidden="true" />
              <span>{t('note')}</span>
            </button>
          ) : (
            <div className="form-field note-field-block">
              <div className="flex items-center justify-between">
                <label htmlFor="transaction-note">{t('note')}</label>
                {!note && (
                  <button
                    type="button"
                    className="icon-button icon-button-sm"
                    onClick={() => setShowNote(false)}
                    aria-label="Remove note"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
              <textarea
                id="transaction-note"
                className="expandable-note-input"
                value={note}
                onChange={e => setNote(e.target.value)}
                maxLength={500}
                rows={2}
                placeholder="Add a note"
                aria-invalid={!!errors.note}
                aria-describedby={errors.note ? 'transaction-note-error' : undefined}
                disabled={busy}
              />
              {errors.note && (
                <p id="transaction-note-error" className="field-error" role="alert">
                  {t(errors.note)}
                </p>
              )}
            </div>
          )}
        </div>

        {error && (
          <p className="field-error form-global-error" role="alert">
            {error}
          </p>
        )}

        {/* Sticky Bottom Action Bar (Aligned with page margins; New balance only when amount exists) */}
        <div
          className="transaction-form-sticky-bar"
          style={{ bottom: viewportBottom ? `${viewportBottom}px` : undefined }}
        >
          {previewAmount !== null && (
            <div className="sticky-balance-preview-box money-review">
              <span className="sr-only">
                {formatMoney(previewAmount, t('currencyLabel'), prefs.numberFormat)}
              </span>
              <span className="preview-label">{t('newBalance')}:</span>
              <strong className="preview-balance-value">
                {projected === null ? (
                  <span className="field-error text-xs">{t('balanceRangeError')}</span>
                ) : (
                  formatMoney(projected, t('currencyLabel'), prefs.numberFormat)
                )}
              </strong>
            </div>
          )}

          <div className="form-actions sticky-actions">
            <button
              className="button button-primary"
              type="submit"
              disabled={busy || (projected === null && previewAmount !== null)}
            >
              <Check size={18} aria-hidden="true" />
              <span>{t(credit ? 'saveCredit' : 'savePayment')}</span>
            </button>
            <Link className="button button-secondary" to={backTo}>
              {t('cancel')}
            </Link>
          </div>
        </div>
      </form>
    </>
  );
}
