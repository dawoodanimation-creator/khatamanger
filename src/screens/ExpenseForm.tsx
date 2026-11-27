import { useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { CalendarDays, Check, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomSheet } from '../components/BottomSheet';
import { Modal } from '../components/Modal';
import { ExpenseCategoryIcon } from '../components/ExpenseCategoryIcon';
import { useI18n, type TranslationKey } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import type { Expense, ExpenseKind } from '../models/expense';
import { getCategoryLabel, getVisibleCategories, resolveExpenseCategories } from '../utils/expenseCategories';
import { parseAmount } from '../utils/money';
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
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const existing = expenseId ? (ledger.expenses ?? []).find(e => e.id === expenseId) : undefined;

  const categories = useMemo(
    () => resolveExpenseCategories(ledger.expenseCategories, ledger.expenses),
    [ledger.expenseCategories, ledger.expenses]
  );

  const initialKind: ExpenseKind = existing?.kind ?? 'expense';
  const [kind, setKind] = useState<ExpenseKind>(initialKind);
  const [amount, setAmount] = useState(
    existing
      ? (existing.amountPaisa / 100).toFixed(2)
      : searchParams.get('amount') ?? ''
  );

  const visibleCats = useMemo(() => {
    const base = getVisibleCategories(categories, kind);
    const counts = new Map<string, number>();
    for (const exp of ledger.expenses ?? []) {
      if (exp.kind === kind) counts.set(exp.categoryId, (counts.get(exp.categoryId) ?? 0) + 1);
    }
    return [...base].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.order - b.order);
  }, [categories, kind, ledger.expenses]);
  const [catQuery, setCatQuery] = useState('');

  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ??
      searchParams.get('categoryId') ??
      (initialKind === 'expense' ? 'food_dining' : 'salary')
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

  const recentCats = visibleCats.slice(0, 4);
  const gridCats = visibleCats.slice(0, 7);

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
              className="v3-tonal-pill"
              onClick={handleRepeatLast}
            >
              <RotateCcw size={14} aria-hidden="true" />
              <span>{t('repeatLast')}</span>
            </button>
          ) : undefined
        }
      />

      <form className="page-content form-content transaction-form-page v3-page-content" onSubmit={e => void submit(e)} noValidate>
        {/* Segmented Control: Expense / Income */}
        <div className="v3-segmented-track" role="group" aria-label={t('expensesTitle')}>
          <button
            type="button"
            className={`v3-segmented-btn ${kind === 'expense' ? 'is-active v3-pill-bounce' : ''}`}
            aria-pressed={kind === 'expense'}
            onClick={() => switchKind('expense')}
          >
            {t('expenseKind')}
          </button>
          <button
            type="button"
            className={`v3-segmented-btn ${kind === 'income' ? 'is-active v3-pill-bounce' : ''}`}
            aria-pressed={kind === 'income'}
            onClick={() => switchKind('income')}
          >
            {t('incomeKind')}
          </button>
        </div>

        {/* Centred Big Amount Input with Accent Underline */}
        <div className="v3-centered-amount-block">
          <label htmlFor="expense-amount" className="v3-centered-amount-label">
            {t('amount')}
          </label>
          <div className="v3-centered-amount-wrap v3-amount-underline">
            <span className="v3-centered-prefix" aria-hidden="true">
              {t('currencyLabel')}
            </span>
            <input
              id="expense-amount"
              data-entry-focus
              className="v3-centered-input"
              value={amount}
              onChange={e => {
                setAmount(e.target.value);
                if (errors.amount) setErrors(prev => ({ ...prev, amount: undefined }));
              }}
              inputMode="decimal"
              dir="ltr"
              placeholder="0"
              autoFocus
              disabled={busy}
            />
          </div>
          {errors.amount && (
            <p className="field-error" role="alert">
              {t(errors.amount)}
            </p>
          )}
          <div className="v3-quick-amount-row">
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

        {/* Recent Row */}
        <div className="form-field">
          <label>{t('recentCategories')}</label>
          <div className="v3-filter-scroll">
            {recentCats.map(cat => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`v3-pill-btn ${active ? 'is-active v3-pill-bounce' : ''}`}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <ExpenseCategoryIcon name={cat.icon} size={15} color={active ? undefined : cat.color} />
                  <span>{getCategoryLabel(cat, language)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Column Category Tile Grid + See all */}
        <div className="form-field">
          <div className="flex items-center justify-between" style={{ marginBottom: '8px' }}>
            <label style={{ margin: 0 }}>{t('allCategories')}</label>
            <button type="button" className="v3-text-btn" onClick={() => setShowMoreCats(true)}>
              {t('seeAll')}
            </button>
          </div>
          <div className="v3-cat-tile-grid" role="group" aria-label={t('category')}>
            {gridCats.map(cat => {
              const active = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`v3-cat-tile ${active ? 'is-active v3-pill-bounce' : ''}`}
                  aria-pressed={active}
                  onClick={() => setCategoryId(cat.id)}
                >
                  <ExpenseCategoryIcon name={cat.icon} size={20} color={active ? undefined : cat.color} />
                  <span className="v3-cat-tile-label">{getCategoryLabel(cat, language)}</span>
                </button>
              );
            })}
            <button
              type="button"
              className="v3-cat-tile v3-cat-tile-more"
              onClick={() => setShowMoreCats(true)}
            >
              <Plus size={20} aria-hidden="true" />
              <span className="v3-cat-tile-label">{t('moreCategories')}</span>
            </button>
          </div>
        </div>

        {/* Date Pills */}
        <div className="form-field">
          <label>{t('date')}</label>
          <div className="v3-filter-scroll">
            <button
              type="button"
              className={`v3-pill-btn ${date === todayStr && !showCustomDate ? 'is-active' : ''}`}
              onClick={() => {
                setDate(todayStr);
                setShowCustomDate(false);
              }}
            >
              {t('today')}
            </button>
            <button
              type="button"
              className={`v3-pill-btn ${date === yesterdayStr && !showCustomDate ? 'is-active' : ''}`}
              onClick={() => {
                setDate(yesterdayStr);
                setShowCustomDate(false);
              }}
            >
              {t('yesterday')}
            </button>
            <button
              type="button"
              className={`v3-pill-btn ${showCustomDate || (date !== todayStr && date !== yesterdayStr) ? 'is-active' : ''}`}
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

        {/* Paid With Scrollable Pills */}
        <div className="form-field">
          <label>{t('paidWith')}</label>
          <div className="v3-filter-scroll">
            {EXPENSE_PAYMENT_METHODS.map(m => (
              <button
                key={m.value}
                type="button"
                className={`v3-pill-btn ${paymentMethod === m.value ? 'is-active v3-pill-bounce' : ''}`}
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

        {/* Sticky 72px Save Expense Bar */}
        <div className="transaction-form-sticky-bar v3-sticky-bar-72">
          <button type="submit" className="button button-primary v3-btn-52" style={{ width: '100%' }} disabled={busy}>
            <Check size={18} aria-hidden="true" />
            <span>
              {t('save')} {t(kind === 'expense' ? 'expenseKind' : 'incomeKind').toLowerCase()}
            </span>
          </button>
        </div>
      </form>

      {/* More Categories Sheet (with search + groups) */}
      {showMoreCats && (
        <BottomSheet title={t('category')} onDismiss={() => setShowMoreCats(false)}>
          <div style={{ paddingBottom: '12px' }}>
            <input
              type="search"
              className="form-control-input"
              style={{ marginBottom: '10px' }}
              value={catQuery}
              onChange={e => setCatQuery(e.target.value)}
              placeholder={t('searchCategories')}
              aria-label={t('searchCategories')}
            />
            {(() => {
              const q = catQuery.trim().toLowerCase();
              const filteredCats = q
                ? visibleCats.filter(
                    c =>
                      c.nameEn.toLowerCase().includes(q) ||
                      c.nameUr.toLowerCase().includes(q)
                  )
                : visibleCats;
              const groupOrder: Array<{ key: string; labelKey: TranslationKey }> = [
                { key: 'daily', labelKey: 'groupDaily' },
                { key: 'bills_home', labelKey: 'groupBillsHome' },
                { key: 'family', labelKey: 'groupFamily' },
                { key: 'money', labelKey: 'groupMoney' },
                { key: 'fun_other', labelKey: 'groupFunOther' },
              ];
              if (kind === 'income' || q) {
                return (
                  <div className="expense-cat-grid">
                    {filteredCats.map(cat => (
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
                );
              }
              return groupOrder.map(g => {
                const items = filteredCats.filter(c => (c.group ?? 'fun_other') === g.key);
                if (items.length === 0) return null;
                return (
                  <div key={g.key}>
                    <div className="cat-group-heading">{t(g.labelKey)}</div>
                    <div className="expense-cat-grid">
                      {items.map(cat => (
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
                  </div>
                );
              });
            })()}
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
