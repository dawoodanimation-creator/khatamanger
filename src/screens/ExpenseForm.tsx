import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { CalendarDays, Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomSheet } from '../components/BottomSheet';
import { Modal } from '../components/Modal';
import { ExpenseCategoryIcon } from '../components/ExpenseCategoryIcon';
import { useI18n, type TranslationKey } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import type { Expense, ExpenseKind } from '../models/expense';
import { getCategoryLabel, getVisibleCategories, resolveExpenseCategories } from '../utils/expenseCategories';
import { parseAmount } from '../utils/money';
import { formatMoney } from '../utils/numberFormat';
import { todayISO, validEntryDate } from '../utils/dates';
import { newId } from '../utils/ids';

const EXPENSE_PAYMENT_METHODS: Array<{ value: string; labelKey: TranslationKey }> = [
  { value: 'Cash', labelKey: 'methodCash' },
  { value: 'Bank', labelKey: 'methodBank' },
  { value: 'JazzCash', labelKey: 'methodJazzCash' },
  { value: 'Easypaisa', labelKey: 'methodEasypaisa' },
  { value: 'Card', labelKey: 'methodCard' },
  { value: 'Other', labelKey: 'methodOther' },
];

export function ExpenseForm() {
  const { expenseId } = useParams();
  const [searchParams] = useSearchParams();
  const { ledger, saveExpense, deleteExpense, writeError } = useLedger();
  const { prefs } = useUiPrefs();
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const existing = expenseId ? (ledger.expenses ?? []).find(e => e.id === expenseId) : undefined;

  const categories = useMemo(
    () => resolveExpenseCategories(ledger.expenseCategories),
    [ledger.expenseCategories]
  );

  const initialKind: ExpenseKind = existing?.kind ?? 'expense';
  const [kind, setKind] = useState<ExpenseKind>(initialKind);
  const [amount, setAmount] = useState(
    existing
      ? (existing.amountPaisa / 100).toFixed(2)
      : searchParams.get('amount') ?? ''
  );

  const visibleCats = useMemo(
    () => getVisibleCategories(categories, kind),
    [categories, kind]
  );

  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ??
      searchParams.get('categoryId') ??
      (initialKind === 'expense' ? 'rashan' : 'sale')
  );
  const [date, setDate] = useState(existing ? existing.date.slice(0, 10) : todayISO());
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(existing?.paymentMethod ?? 'Cash');
  const [note, setNote] = useState(existing?.note ?? '');
  const [showMoreCats, setShowMoreCats] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);
  const [deletedUndo, setDeletedUndo] = useState<Expense | null>(null);
  const [errors, setErrors] = useState<Partial<Record<'amount' | 'date' | 'note', TranslationKey>>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);

  const lastExpense =
    !existing && (ledger.expenses?.length ?? 0) > 0
      ? ledger.expenses![ledger.expenses!.length - 1]
      : null;

  const todayStr = todayISO();
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = todayISO(yesterdayDate);

  function switchKind(nextKind: ExpenseKind) {
    setKind(nextKind);
    const first = getVisibleCategories(categories, nextKind)[0];
    if (first) setCategoryId(first.id);
  }

  function handleQuickAmount(addValue: number) {
    const currentVal = parseAmount(amount) ?? 0;
    const nextVal = currentVal + addValue * 100;
    setAmount((nextVal / 100).toFixed(2));
    if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
  }

  function handleRepeatLast() {
    if (!lastExpense) return;
    setKind(lastExpense.kind);
    setAmount((lastExpense.amountPaisa / 100).toFixed(2));
    setCategoryId(lastExpense.categoryId);
    setPaymentMethod(lastExpense.paymentMethod ?? 'Cash');
    setNote(lastExpense.note);
    setErrors({});
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (saving.current) return;

    const paisa = parseAmount(amount);
    const found: typeof errors = {};
    if (paisa === null) found.amount = 'amountInvalid';
    if (!validEntryDate(date)) found.date = 'dateInvalid';
    if (note.length > 500) found.note = 'noteInvalid';
    setErrors(found);
    setError('');
    if (Object.keys(found).length > 0) return;

    saving.current = true;
    setBusy(true);
    try {
      const ok = await saveExpense({
        id: existing?.id ?? newId(),
        kind,
        amountPaisa: paisa!,
        categoryId,
        date: `${date}T00:00:00.000`,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        paymentMethod,
        note: note.trim(),
      });
      if (!ok) {
        setError(t(writeError()));
        return;
      }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(10);
        } catch {
          // ignore
        }
      }
      if (existing) {
        navigate('/expenses', { replace: true });
      } else {
        setSavedBanner(true);
      }
    } catch {
      setError(t('error'));
    } finally {
      saving.current = false;
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!existing || busy) return;
    setBusy(true);
    if (await deleteExpense(existing.id)) {
      setShowDeleteModal(false);
      setDeletedUndo(existing);
    } else {
      setError(t(writeError()));
    }
    setBusy(false);
  }

  async function handleUndoDelete() {
    if (!deletedUndo || busy) return;
    setBusy(true);
    if (await saveExpense(deletedUndo)) {
      setDeletedUndo(null);
      navigate('/expenses', { replace: true });
    }
    setBusy(false);
  }

  const previewAmount = parseAmount(amount);
  const topCats = visibleCats.slice(0, 6);
  if (!topCats.some(c => c.id === categoryId)) {
    const selected = visibleCats.find(c => c.id === categoryId);
    if (selected) topCats[topCats.length - 1] = selected;
  }

  return (
    <>
      <Header
        title={t(existing ? 'editExpense' : 'addExpense')}
        backTo="/expenses"
        actions={
          existing ? (
            <button
              type="button"
              className="icon-button text-danger"
              aria-label={t('delete')}
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash2 size={20} aria-hidden="true" />
            </button>
          ) : lastExpense ? (
            <button
              type="button"
              className="button button-secondary text-sm"
              style={{ minHeight: '44px', padding: '6px 12px' }}
              onClick={handleRepeatLast}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>{t('repeatLast')}</span>
            </button>
          ) : undefined
        }
      />

      <form className="page-content form-content transaction-form-page" onSubmit={e => void submit(e)} noValidate>
        {/* Segmented Control: Expense / Income */}
        <div className="segmented-control" role="group" aria-label={t('expensesTitle')}>
          <button
            type="button"
            className={`segmented-btn ${kind === 'expense' ? 'is-active' : ''}`}
            aria-pressed={kind === 'expense'}
            onClick={() => switchKind('expense')}
          >
            {t('expenseKind')}
          </button>
          <button
            type="button"
            className={`segmented-btn ${kind === 'income' ? 'is-active' : ''}`}
            aria-pressed={kind === 'income'}
            onClick={() => switchKind('income')}
          >
            {t('incomeKind')}
          </button>
        </div>

        {/* Big Amount Input */}
        <div className="form-field amount-field-block">
          <label htmlFor="expense-amount" className="amount-label">
            {t('amount')}
          </label>
          <div className="big-amount-input-wrapper">
            <span className="big-amount-prefix" aria-hidden="true">
              {t('currencyLabel')}
            </span>
            <input
              id="expense-amount"
              data-entry-focus
              className="big-amount-input"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
              }}
              inputMode="decimal"
              dir="ltr"
              placeholder="0.00"
              autoFocus
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
            <p className="field-error" role="alert">
              {t(errors.amount)}
            </p>
          )}
          <div className="quick-amount-chips">
            {[100, 500, 1000, 5000].map(val => (
              <button
                key={val}
                type="button"
                className="quick-amount-chip"
                onClick={() => handleQuickAmount(val)}
              >
                +{val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Category Chip Grid + More Sheet */}
        <div className="form-field">
          <label>{t('category')}</label>
          <div className="expense-cat-grid" role="group" aria-label={t('category')}>
            {topCats.map(cat => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`expense-cat-chip ${active ? 'is-active' : ''}`}
                  aria-pressed={active}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <ExpenseCategoryIcon name={cat.icon} size={16} color={active ? undefined : cat.color} />
                  <span className="truncate">{getCategoryLabel(cat, language)}</span>
                </button>
              );
            })}
            {visibleCats.length > 6 && (
              <button
                type="button"
                className="expense-cat-chip choice-chip-add"
                onClick={() => setShowMoreCats(true)}
              >
                <Plus size={16} aria-hidden="true" />
                <span>{t('moreCategories')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Chips */}
        <div className="form-field">
          <label>{t('date')}</label>
          <div className="chip-wrap-row">
            <button
              type="button"
              className={`choice-chip ${date === todayStr && !showCustomDate ? 'is-active' : ''}`}
              onClick={() => {
                setDate(todayStr);
                setShowCustomDate(false);
              }}
            >
              {t('today')}
            </button>
            <button
              type="button"
              className={`choice-chip ${date === yesterdayStr && !showCustomDate ? 'is-active' : ''}`}
              onClick={() => {
                setDate(yesterdayStr);
                setShowCustomDate(false);
              }}
            >
              {t('yesterday')}
            </button>
            <button
              type="button"
              className={`choice-chip ${showCustomDate || (date !== todayStr && date !== yesterdayStr) ? 'is-active' : ''}`}
              onClick={() => setShowCustomDate(v => !v)}
            >
              <CalendarDays size={15} aria-hidden="true" />
              <span>{t('pickDate')}</span>
            </button>
          </div>
          {(showCustomDate || (date !== todayStr && date !== yesterdayStr)) && (
            <input
              type="date"
              className="form-control-input"
              style={{ marginTop: '8px' }}
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          )}
        </div>

        {/* Payment Method Chips */}
        <div className="form-field">
          <label>{t('paymentMethod')}</label>
          <div className="chip-wrap-row">
            {EXPENSE_PAYMENT_METHODS.map(m => (
              <button
                key={m.value}
                type="button"
                className={`choice-chip ${paymentMethod === m.value ? 'is-active' : ''}`}
                aria-pressed={paymentMethod === m.value}
                onClick={() => setPaymentMethod(m.value)}
              >
                {t(m.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Note */}
        <div className="form-field">
          <label htmlFor="expense-note">{t('note')}</label>
          <textarea
            id="expense-note"
            className="form-control-textarea"
            rows={2}
            maxLength={500}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder={t('note')}
          />
        </div>

        {error && (
          <p className="field-error form-global-error" role="alert">
            {error}
          </p>
        )}

        {/* Sticky Save Bar */}
        <div className="transaction-form-sticky-bar">
          <div className="form-actions sticky-actions">
            <button type="submit" className="button button-primary" disabled={busy}>
              <Check size={18} aria-hidden="true" />
              <span>{t('save')}</span>
            </button>
            <Link to="/expenses" className="button button-secondary">
              {t('cancel')}
            </Link>
          </div>
        </div>
      </form>

      {/* More Categories Sheet */}
      {showMoreCats && (
        <BottomSheet title={t('category')} onDismiss={() => setShowMoreCats(false)}>
          <div className="expense-cat-grid" style={{ paddingBottom: '12px' }}>
            {visibleCats.map(cat => (
              <button
                key={cat.id}
                type="button"
                className={`expense-cat-chip ${categoryId === cat.id ? 'is-active' : ''}`}
                onClick={() => {
                  setCategoryId(cat.id);
                  setShowMoreCats(false);
                }}
              >
                <ExpenseCategoryIcon name={cat.icon} size={16} color={cat.color} />
                <span className="truncate">{getCategoryLabel(cat, language)}</span>
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* Post-Save Success + Add Another */}
      {savedBanner && (
        <div className="save-success-overlay" role="dialog" aria-modal="true" aria-label={t('save')}>
          <div className="save-success-card" style={{ minWidth: '260px' }}>
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
            <div style={{ display: 'flex', gap: '8px', width: '100%', marginTop: '6px' }}>
              <button
                type="button"
                className="button button-secondary"
                style={{ flex: 1 }}
                onClick={() => {
                  setAmount('');
                  setNote('');
                  setSavedBanner(false);
                }}
              >
                {t('addAnother')}
              </button>
              <button
                type="button"
                className="button button-primary"
                style={{ flex: 1 }}
                onClick={() => navigate('/expenses', { replace: true })}
              >
                {t('finish')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <Modal
          title={t('deleteExpenseTitle')}
          onDismiss={() => setShowDeleteModal(false)}
          actions={
            <button
              type="button"
              className="button button-danger"
              disabled={busy}
              onClick={() => void confirmDelete()}
            >
              {t('delete')}
            </button>
          }
        >
          <p>{t('deleteExpenseWarning')}</p>
        </Modal>
      )}

      {/* Undo Delete Snackbar */}
      {deletedUndo && (
        <div className="undo-snackbar" role="status">
          <span>{t('entryDeleted')}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="button" className="undo-snackbar-btn" onClick={() => void handleUndoDelete()}>
              {t('undo')}
            </button>
            <button
              type="button"
              className="undo-snackbar-btn"
              onClick={() => navigate('/expenses', { replace: true })}
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
