import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router';
import { BarChart3, ChevronLeft, ChevronRight, Plus, SlidersHorizontal, X } from 'lucide-react';
import { Header } from '../components/Header';
import { BottomSheet } from '../components/BottomSheet';
import { ExpenseCategoryIcon } from '../components/ExpenseCategoryIcon';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import {
  computeExpenseMonthSummary,
  detectRecurringBillSuggestions,
  groupExpensesByDay,
  monthKeyFromDate,
  shiftMonthKey,
} from '../utils/expenses';
import { getCategoryLabel, resolveExpenseCategories } from '../utils/expenseCategories';
import { formatCompactMoney, formatMoney } from '../utils/numberFormat';
import { localDate, todayISO } from '../utils/dates';

function formatMonthTitle(monthKey: string, language: 'en' | 'ur'): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1));
}

function useMountCountUp(target: number, disabled: boolean): number {
  const [display, setDisplay] = useState(target);
  const animatedOnce = useRef(false);

  useEffect(() => {
    if (disabled || animatedOnce.current) {
      setDisplay(target);
      return;
    }
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reducedMotion || typeof requestAnimationFrame === 'undefined' || target === 0) {
      animatedOnce.current = true;
      setDisplay(target);
      return;
    }

    animatedOnce.current = true;
    const duration = 500;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, disabled]);

  return disabled ? target : display;
}

export function ExpensesHome() {
  const { ledger, deleteExpense, saveExpense } = useLedger();
  const { prefs } = useUiPrefs();
  const { t, language, direction } = useI18n();

  const today = todayISO();
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const [kindFilter, setKindFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);
  const [deletedUndo, setDeletedUndo] = useState<import('../models/expense').Expense | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const hidden = !!ledger.settings.hideBalances;
  const expenses = ledger.expenses ?? [];
  const categories = useMemo(
    () => resolveExpenseCategories(ledger.expenseCategories, expenses),
    [ledger.expenseCategories, expenses]
  );
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const monthExpenses = useMemo(
    () => expenses.filter(e => monthKeyFromDate(e.date) === monthKey),
    [expenses, monthKey]
  );

  const summary = useMemo(
    () => computeExpenseMonthSummary(expenses, monthKey, today),
    [expenses, monthKey, today]
  );

  const animSpent = useMountCountUp(summary.spentPaisa, hidden);

  const recurringSuggestions = useMemo(
    () =>
      detectRecurringBillSuggestions(expenses, categories, monthKey).filter(
        s => !dismissedSuggestionIds.includes(s.categoryId)
      ),
    [expenses, categories, monthKey, dismissedSuggestionIds]
  );

  const usedCatIds = useMemo(() => {
    const set = new Set<string>();
    for (const e of monthExpenses) set.add(e.categoryId);
    return Array.from(set);
  }, [monthExpenses]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return monthExpenses.filter(e => {
      if (kindFilter !== 'all' && e.kind !== kindFilter) return false;
      if (catFilter !== 'all' && e.categoryId !== catFilter) return false;
      if (q) {
        const cat = catMap.get(e.categoryId);
        const catLabel = getCategoryLabel(cat, language, e.categoryId).toLowerCase();
        if (!e.note.toLowerCase().includes(q) && !catLabel.includes(q)) return false;
      }
      return true;
    });
  }, [monthExpenses, kindFilter, catFilter, query, catMap, language]);

  const dayGroups = useMemo(() => groupExpensesByDay(filtered), [filtered]);

  const moneyText = (paisa: number) =>
    hidden ? '••••••' : formatMoney(paisa, t('currencyLabel'), prefs.numberFormat);
  const compactChipText = (paisa: number) =>
    hidden ? '••••••' : formatCompactMoney(paisa, t('currencyLabel'), prefs.numberFormat);

  const last7Days = useMemo(() => {
    const days: Array<{ day: string; total: number; isToday: boolean }> = [];
    const byDay = new Map<string, number>();
    for (const e of expenses) {
      if (e.kind !== 'expense') continue;
      const d = e.date.slice(0, 10);
      byDay.set(d, (byDay.get(d) ?? 0) + e.amountPaisa);
    }
    for (let offset = 6; offset >= 0; offset--) {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      const iso = todayISO(d);
      days.push({ day: iso, total: byDay.get(iso) ?? 0, isToday: offset === 0 });
    }
    return days;
  }, [expenses]);
  const max7d = Math.max(...last7Days.map(d => d.total), 1);

  async function handleSwipeDelete(exp: import('../models/expense').Expense) {
    if (await deleteExpense(exp.id)) {
      setDeletedUndo(exp);
    }
  }

  return (
    <>
      <Header
        caption={t('personalCaption')}
        title={t('expensesTitle')}
        actions={
          <Link
            to="/expenses/reports"
            className="icon-button v3-header-circle-btn"
            aria-label={t('expenseReports')}
            title={t('expenseReports')}
          >
            <BarChart3 size={20} aria-hidden="true" />
          </Link>
        }
      />

      <div className="page-content home-content v3-page-content">
        {/* Blue Gradient Hero Card with Month Switcher + 7-day Bars + Income/Today Chips */}
        <section
          className="v3-hero-card v3-hero-expenses v3-rise"
          style={{ '--rise-idx': 0 } as React.CSSProperties}
          aria-label={t('spentThisMonth')}
        >
          <div className="v3-hero-month-row">
            <button
              type="button"
              className="v3-hero-month-btn"
              aria-label="Previous month"
              onClick={() => setMonthKey(m => shiftMonthKey(m, -1))}
            >
              {direction === 'rtl' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>
            <strong className="v3-hero-month-title">{formatMonthTitle(monthKey, language)}</strong>
            <button
              type="button"
              className="v3-hero-month-btn"
              aria-label="Next month"
              onClick={() => setMonthKey(m => shiftMonthKey(m, 1))}
            >
              {direction === 'rtl' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>

          <div className="v3-hero-expense-body">
            <div>
              <span className="v3-hero-label">{t('spentThisMonth')}</span>
              <div>
                <bdi
                  dir="ltr"
                  className="v3-hero-amount"
                  style={{ fontSize: 'clamp(28px, 8vw, 34px)' }}
                  aria-live="off"
                  aria-label={moneyText(summary.spentPaisa)}
                >
                  {moneyText(animSpent)}
                </bdi>
              </div>
            </div>

            <div className="mini-bars-7d" aria-hidden="true">
              {last7Days.map((d, idx) => {
                const h = d.total > 0 ? Math.max(6, Math.round((d.total / max7d) * 34)) : 4;
                return (
                  <div
                    key={d.day}
                    className={`mini-bar-col v3-bar-7d ${d.isToday ? 'is-today' : ''}`}
                    style={{ height: `${h}px`, '--bar-idx': idx } as React.CSSProperties}
                  />
                );
              })}
            </div>
          </div>

          <div className="v3-hero-chips-row">
            <span className="v3-hero-chip v3-hero-chip-income" aria-label={`${t('incomeThisMonth')} ${moneyText(summary.incomePaisa)}`}>
              <span>{t('incomeThisMonth')}</span>{' '}
              <bdi dir="ltr">{compactChipText(summary.incomePaisa)}</bdi>
            </span>
            <span className="v3-hero-chip" aria-label={`${t('todaySpent')} ${moneyText(summary.todaySpentPaisa)}`}>
              <span>{t('todaySpent')}</span>{' '}
              <bdi dir="ltr">{compactChipText(summary.todaySpentPaisa)}</bdi>
            </span>
          </div>
        </section>

        {/* P2 Recurring Monthly Bill Suggestion */}
        {recurringSuggestions.slice(0, 1).map(s => {
          const cat = catMap.get(s.categoryId);
          const catName = getCategoryLabel(cat, language, s.categoryId);
          return (
            <div key={s.categoryId} className="v3-amber-chip" role="status">
              <Link
                to={`/expenses/new?categoryId=${encodeURIComponent(s.categoryId)}&amount=${(
                  s.suggestedAmountPaisa / 100
                ).toFixed(2)}`}
                className="backup-banner-link"
              >
                {t('recurringBillPrompt', {
                  category: catName,
                  amount: formatMoney(s.suggestedAmountPaisa, t('currencyLabel'), prefs.numberFormat),
                })}
              </Link>
              <button
                type="button"
                className="backup-banner-dismiss"
                aria-label={t('dismiss')}
                onClick={() => setDismissedSuggestionIds(prev => [...prev, s.categoryId])}
              >
                <X size={16} aria-hidden="true" />
              </button>
            </div>
          );
        })}

        {/* Controls Row: Segmented All / Spent / Income + 52px Filter Button */}
        {monthExpenses.length > 0 && (
          <div className="v3-controls-row v3-rise" style={{ '--rise-idx': 1 } as React.CSSProperties}>
            <div className="v3-segmented-track" style={{ flex: 1 }} role="tablist" aria-label={t('expensesTitle')}>
              {(
                [
                  { id: 'all', label: t('filterAll') },
                  { id: 'expense', label: t('spentLabel') },
                  { id: 'income', label: t('incomeKind') },
                ] as const
              ).map(tab => {
                const isActive = kindFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={`v3-segmented-btn ${isActive ? 'is-active v3-pill-bounce' : ''}`}
                    onClick={() => setKindFilter(tab.id)}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="v3-filter-icon-btn"
              aria-label={t('filtersLabel')}
              onClick={() => setShowFilterSheet(true)}
            >
              <SlidersHorizontal size={20} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Day-grouped Cards or Empty State */}
        {monthExpenses.length === 0 ? (
          <div className="empty-state-minimal text-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }}>
              <rect x="14" y="14" width="44" height="44" rx="10" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
              <path d="M24 38l8-8 6 6 10-12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="empty-state-headline">{t('emptyExpensesTitle')}</h2>
            <p className="empty-state-subtext">{t('emptyExpensesBody')}</p>
            <Link className="button button-primary empty-state-cta" to="/expenses/new">
              <Plus size={18} aria-hidden="true" />
              <span>{t('addFirstExpense')}</span>
            </Link>
          </div>
        ) : dayGroups.length === 0 ? (
          <div className="empty-state-minimal text-center">
            <h2 className="empty-state-headline">{t('noMatches')}</h2>
            <p className="empty-state-subtext">{t('noFilterMatches')}</p>
            <button
              type="button"
              className="button button-secondary clear-filters-btn"
              onClick={() => {
                setKindFilter('all');
                setCatFilter('all');
                setQuery('');
              }}
            >
              {t('clearFilters')}
            </button>
          </div>
        ) : (
          <div className="v3-day-cards-stack">
            {dayGroups.map(group => (
              <section key={group.day} className="v3-list-card">
                <div className="v3-day-card-header">
                  <span>{localDate(group.day, language)}</span>
                  <bdi dir="ltr">
                    {group.totalSpentPaisa > 0
                      ? moneyText(group.totalSpentPaisa)
                      : `+ ${moneyText(group.totalIncomePaisa)}`}
                  </bdi>
                </div>
                {group.entries.map((exp, idx) => {
                  const cat = catMap.get(exp.categoryId);
                  const label = getCategoryLabel(cat, language, exp.categoryId);
                  const isIncome = exp.kind === 'income';
                  return (
                    <Link
                      key={exp.id}
                      to={`/expenses/${exp.id}/edit`}
                      className={`v3-expense-row ${idx < 8 ? 'v3-row-rise' : ''}`}
                      style={idx < 8 ? ({ '--stagger-idx': idx } as React.CSSProperties) : undefined}
                      onTouchStart={e => setTouchStartX(e.touches[0]?.clientX ?? null)}
                      onTouchEnd={e => {
                        if (touchStartX === null) return;
                        const endX = e.changedTouches[0]?.clientX ?? touchStartX;
                        const delta = touchStartX - endX;
                        setTouchStartX(null);
                        if ((direction === 'ltr' && delta > 72) || (direction === 'rtl' && delta < -72)) {
                          e.preventDefault();
                          void handleSwipeDelete(exp);
                        }
                      }}
                    >
                      <span
                        className="v3-cat-circle-40"
                        style={{
                          backgroundColor: `${cat?.color ?? '#475569'}1A`,
                          color: cat?.color ?? '#475569',
                        }}
                      >
                        <ExpenseCategoryIcon name={cat?.icon ?? 'circle-dot'} size={18} />
                      </span>
                      <div className="expense-row-meta">
                        <strong className="expense-row-cat" dir="auto">
                          {label}
                        </strong>
                        {(exp.note || exp.paymentMethod) && (
                          <span className="expense-row-note" dir="auto">
                            {[exp.note, exp.paymentMethod].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </div>
                      <bdi
                        dir="ltr"
                        className={`expense-row-amount ${isIncome ? 'expense-income-text' : ''}`}
                      >
                        {isIncome ? '+ ' : ''}
                        {moneyText(exp.amountPaisa)}
                      </bdi>
                    </Link>
                  );
                })}
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Round 56px Blue FAB */}
      <Link className="v3-fab" to="/expenses/new" aria-label={t('addExpense')} title={t('addExpense')}>
        <Plus size={24} aria-hidden="true" />
      </Link>

      {/* Filter Bottom Sheet (Note search + Category filter) */}
      {showFilterSheet && (
        <BottomSheet title={t('filtersLabel')} onDismiss={() => setShowFilterSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px' }}>
            <input
              type="search"
              className="form-control-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={t('searchExpenses')}
              aria-label={t('searchExpenses')}
            />
            <div className="chip-wrap-row">
              <button
                type="button"
                className={`v3-pill-btn ${catFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setCatFilter('all')}
              >
                {t('allCategories')}
              </button>
              {usedCatIds.map(cid => {
                const cat = catMap.get(cid);
                return (
                  <button
                    key={cid}
                    type="button"
                    className={`v3-pill-btn ${catFilter === cid ? 'is-active' : ''}`}
                    onClick={() => setCatFilter(catFilter === cid ? 'all' : cid)}
                  >
                    {getCategoryLabel(cat, language, cid)}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="button button-primary v3-btn-52"
              onClick={() => setShowFilterSheet(false)}
            >
              {t('finish')}
            </button>
          </div>
        </BottomSheet>
      )}

      {deletedUndo && (
        <div className="undo-snackbar" role="status">
          <span>{t('entryDeleted')}</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="undo-snackbar-btn"
              onClick={() => {
                void saveExpense(deletedUndo).then(ok => {
                  if (ok) setDeletedUndo(null);
                });
              }}
            >
              {t('undo')}
            </button>
            <button
              type="button"
              className="undo-snackbar-btn"
              onClick={() => setDeletedUndo(null)}
            >
              {t('dismiss')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
