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
import { BottomSheet } from '../components/BottomSheet';
import { MissingCustomer } from '../components/MissingCustomer';
import { categoriesForShopTypes, quickItemsForShopTypes } from '../utils/shopPresets';
import type { TransactionItem, TransactionKind } from '../models/transaction';
import { useI18n, type TranslationKey } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { newId } from '../utils/ids';
import { customerPath } from '../utils/routes';
import { parseAmount } from '../utils/money';
import { todayISO, validEntryDate } from '../utils/dates';
import { getInitials } from '../utils/avatar';

const PAYMENT_METHODS: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: 'Cash', labelKey: 'methodCash' },
  { value: 'Bank', labelKey: 'methodBank' },
  { value: 'JazzCash', labelKey: 'methodJazzCash' },
  { value: 'Easypaisa', labelKey: 'methodEasypaisa' },
  { value: 'Other', labelKey: 'methodOther' },
];

function computeDefaultDueDate(defaultDueDays?: number): string {
  if (!defaultDueDays || defaultDueDays <= 0) return '';
  const d = new Date();
  d.setDate(d.getDate() + defaultDueDays);
  return todayISO(d);
}

export function TransactionForm({ kind }: { kind: TransactionKind }) {
  const { customerId } = useParams();
  const { ledger, addTransaction, writeError } = useLedger();
  const { prefs, addCustomUdhaarCategory, recordQuickItems } = useUiPrefs();
  const customer = ledger.customers.find(c => c.id === customerId);
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(todayISO());
  const [showCustomDate, setShowCustomDate] = useState(false);

  const initialDue = kind === 'credit' ? computeDefaultDueDate(customer?.defaultDueDays) : '';
  const [dueDate, setDueDate] = useState(initialDue);
  const [showDueDate, setShowDueDate] = useState(Boolean(initialDue));

  const [category, setCategory] = useState('');
  const [showCustomCat, setShowCustomCat] = useState(false);
  const [showMoreUdhaarCats, setShowMoreUdhaarCats] = useState(false);
  const [customCatInput, setCustomCatInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

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

  const commonItems = useMemo(
    () => quickItemsForShopTypes(ledger.settings.shopTypes, language),
    [ledger.settings.shopTypes, language]
  );

  const udhaarCategories = useMemo(() => {
    const presetCats = categoriesForShopTypes(
      ledger.settings.shopTypes,
      ledger.settings.customShopTypes
    ).map(c => ({ value: c.nameEn, label: language === 'ur' ? c.nameUr : c.nameEn }));

    const customList = (prefs.customUdhaarCategories ?? []).map(c => ({ value: c, label: c }));
    const merged = [...presetCats];
    const seen = new Set(merged.map(m => m.value.toLowerCase()));
    for (const c of customList) {
      if (!seen.has(c.value.toLowerCase())) {
        seen.add(c.value.toLowerCase());
        merged.push(c);
      }
    }
    // Sort by usage frequency in existing transactions
    const counts = new Map<string, number>();
    for (const tx of ledger.transactions) {
      if (tx.kind === 'credit' && tx.category) {
        counts.set(tx.category, (counts.get(tx.category) ?? 0) + 1);
      }
    }
    return merged.sort((a, b) => (counts.get(b.value) ?? 0) - (counts.get(a.value) ?? 0));
  }, [ledger.settings.shopTypes, ledger.settings.customShopTypes, prefs.customUdhaarCategories, ledger.transactions, language]);

  const rememberedItems = useMemo(() => {
    const saved = [...(prefs.quickItems ?? [])].sort((a, b) => b.count - a.count);
    const seen = new Set(saved.map(i => i.name.toLowerCase()));
    const extras = commonItems
      .filter(name => !seen.has(name.toLowerCase()))
      .map(name => ({ name, defaultPricePaisa: undefined as number | undefined }));
    return [...saved.map(s => ({ name: s.name, defaultPricePaisa: s.defaultPricePaisa })), ...extras];
  }, [prefs.quickItems, commonItems]);

  function addItem(suggestedName = '', defaultPricePaisa?: number) {
    setShowItems(true);
    setItems(prev => [
      ...prev,
      {
        id: newId(),
        name: suggestedName,
        qty: '',
        price: defaultPricePaisa ? (defaultPricePaisa / 100).toFixed(2) : '',
      },
    ]);
  }

  function handleAddCustomUdhaarCategory() {
    const clean = customCatInput.trim().slice(0, 60);
    if (!clean) return;
    addCustomUdhaarCategory(clean);
    setCategory(clean);
    setCustomCatInput('');
    setShowCustomCat(false);
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
          ...(credit && category ? { category } : {}),
          ...(!credit && paymentMethod ? { paymentMethod } : {}),
        },
        expectedCustomer.current!
      );

      if (saved) {
        if (validItems.length > 0) {
          recordQuickItems(validItems.map(i => ({ name: i.name, pricePaisa: i.pricePaisa })));
        }
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(10);
          } catch {
            // Ignore vibrate errors
          }
        }
        const reducedMotion =
          typeof window !== 'undefined' &&
          window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
        if (reducedMotion) {
          navigate(backTo, { replace: true });
        } else {
          setShowSuccess(true);
          window.setTimeout(() => {
            navigate(backTo, { replace: true });
          }, 200);
        }
      } else {
        setError(t(writeError()));
      }
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

          {credit &&
            customer.creditLimitPaisa &&
            customer.creditLimitPaisa > 0 &&
            projected !== null &&
            projected > customer.creditLimitPaisa && (
              <div className="warning-banner" role="status" style={{ marginTop: '10px' }}>
                {t('creditLimitExceeded')}
              </div>
            )}
        </div>

        {/* Udhaar Category Chips or Payment Method Chips */}
        {credit ? (
          <div className="form-field">
            <label>{t('category')}</label>
            <div className="chip-wrap-row" role="group" aria-label={t('category')}>
              {udhaarCategories.slice(0, 6).map(cat => {
                const active = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    className={`choice-chip ${active ? 'is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setCategory(active ? '' : cat.value)}
                    disabled={busy}
                  >
                    {cat.label}
                  </button>
                );
              })}
              {udhaarCategories.length > 6 && (
                <button
                  type="button"
                  className="choice-chip choice-chip-add"
                  onClick={() => setShowMoreUdhaarCats(true)}
                  disabled={busy}
                >
                  <span>{t('moreCategories')}</span>
                </button>
              )}
              <button
                type="button"
                className="choice-chip choice-chip-add"
                onClick={() => setShowCustomCat(v => !v)}
                disabled={busy}
              >
                <span>{t('customCategory')}</span>
              </button>
            </div>
            {showMoreUdhaarCats && (
              <BottomSheet title={t('category')} onDismiss={() => setShowMoreUdhaarCats(false)}>
                <div className="chip-wrap-row" style={{ paddingBottom: '12px' }}>
                  {udhaarCategories.map(cat => {
                    const active = category === cat.value;
                    return (
                      <button
                        key={cat.value}
                        type="button"
                        className={`choice-chip ${active ? 'is-active' : ''}`}
                        onClick={() => {
                          setCategory(active ? '' : cat.value);
                          setShowMoreUdhaarCats(false);
                        }}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </BottomSheet>
            )}
            {showCustomCat && (
              <div className="custom-chip-inline">
                <input
                  type="text"
                  className="form-control-input"
                  value={customCatInput}
                  onChange={e => setCustomCatInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomUdhaarCategory();
                    }
                  }}
                  maxLength={60}
                  placeholder={t('customCategoryPlaceholder')}
                />
                <button
                  type="button"
                  className="button button-secondary"
                  onClick={handleAddCustomUdhaarCategory}
                >
                  {t('save')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="form-field">
            <label>{t('paymentMethod')}</label>
            <div className="chip-wrap-row" role="group" aria-label={t('paymentMethod')}>
              {PAYMENT_METHODS.map(m => {
                const active = paymentMethod === m.value;
                return (
                  <button
                    key={m.value}
                    type="button"
                    className={`choice-chip ${active ? 'is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => setPaymentMethod(active ? '' : m.value)}
                    disabled={busy}
                  >
                    {t(m.labelKey)}
                  </button>
                );
              })}
            </div>
          </div>
        )}

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
                {rememberedItems.map(item => (
                  <button
                    key={item.name}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => addItem(item.name, item.defaultPricePaisa)}
                  >
                    + {item.name}
                    {item.defaultPricePaisa
                      ? ` (${Math.round(item.defaultPricePaisa / 100)})`
                      : ''}
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

      {showSuccess && (
        <div className="save-success-overlay" aria-live="polite">
          <div className="save-success-card">
            <svg className="checkmark-svg" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="3" opacity="0.25" />
              <path
                className="checkmark-path"
                d="M14 25l7 7 13-14"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      )}
    </>
  );
}
