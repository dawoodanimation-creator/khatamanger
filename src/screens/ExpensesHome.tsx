import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { BarChart3, ChevronLeft, ChevronRight, Plus, Search, X } from 'lucide-react';
import { Header } from '../components/Header';
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
import { formatMoney } from '../utils/numberFormat';
import { localDate, todayISO } from '../utils/dates';

function formatMonthTitle(monthKey: string, language: 'en' | 'ur'): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1));
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
  const incomeStr = moneyText(summary.incomePaisa);
  const netStr = hidden
    ? '••••••'
    : `${summary.netPaisa < 0 ? '− ' : ''}${formatMoney(
        Math.abs(summary.netPaisa),
        t('currencyLabel'),
        prefs.numberFormat
      )}`;
  const todayStr = moneyText(summary.todaySpentPaisa);
  const stackSubgrid =
    !hidden && (incomeStr.length >= 11 || netStr.length >= 11 || todayStr.length >= 11);

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
        title={t('expensesTitle')}
        actions={
          <Link
            to="/expenses/reports"
            className="icon-button"
            aria-label={t('expenseReports')}
            title={t('expenseReports')}
          >
            <BarChart3 size={20} aria-hidden="true" />
          </Link>
        }
      />

      <div className="page-content home-content">
        {/* Month Selector */}
        <div className="month-selector-bar">
          <button
            type="button"
            className="icon-button"
            aria-label="Previous month"
            onClick={() => setMonthKey(m => shiftMonthKey(m, -1))}
          >
            {direction === 'rtl' ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
          <strong className="month-selector-label">{formatMonthTitle(monthKey, language)}</strong>
          <button
            type="button"
            className="icon-button"
            aria-label="Next month"
            onClick={() => setMonthKey(m => shiftMonthKey(m, 1))}
          >
            {direction === 'rtl' ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>

        {/* Expenses Summary Hero */}
        <section className="outstanding-card summary-minimalist" aria-label={t('spentThisMonth')}>
          <div className="expense-hero-main">
            <span className="summary-label">{t('spentThisMonth')}</span>
            <bdi dir="ltr" className="summary-amount expense-hero-total">
              {moneyText(summary.spentPaisa)}
            </bdi>
          </div>
          <div className={`expense-hero-subgrid ${stackSubgrid ? 'expense-hero-subgrid-stacked' : ''}`}>
            <div className="expense-hero-stat">
              <span className="summary-label">{t('incomeThisMonth')}</span>
              <bdi dir="ltr" className="font-semibold expense-income-text expense-stat-amount">
                {incomeStr}
              </bdi>
            </div>
            <div className="expense-hero-stat">
              <span className="summary-label">{t('netBalance')}</span>
              <bdi dir="ltr" className="font-semibold expense-stat-amount">
                {netStr}
              </bdi>
            </div>
            <div className="expense-hero-stat">
              <span className="summary-label">{t('todaySpent')}</span>
              <bdi dir="ltr" className="font-semibold expense-stat-amount">
                {todayStr}
              </bdi>
            </div>
          </div>
        </section>

        {/* Today Rounded Card + 7-Day Mini Bar Chart */}
        <div className="today-mini-chart-card">
          <div>
            <span className="summary-label">{t('todaySpent')}</span>
            <div>
              <bdi dir="ltr" className="font-bold" style={{ fontSize: '18px' }}>
                {todayStr}
              </bdi>
            </div>
            <span className="text-xs text-muted">{t('last7Days')}</span>
          </div>
          <div className="mini-bars-7d" aria-hidden="true">
            {last7Days.map(d => {
              const h = d.total > 0 ? Math.max(6, Math.round((d.total / max7d) * 34)) : 4;
              return (
                <div
                  key={d.day}
                  className={`mini-bar-col ${d.isToday ? 'is-today' : ''}`}
                  style={{ height: `${h}px` }}
                />
              );
            })}
          </div>
        </div>

        {/* P2 Recurring Monthly Bill Suggestion */}
        {recurringSuggestions.slice(0, 1).map(s => {
          const cat = catMap.get(s.categoryId);
          const catName = getCategoryLabel(cat, language, s.categoryId);
          return (
            <div key={s.categoryId} className="backup-reminder-banner" role="status">
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

        {/* Search in notes */}
        {monthExpenses.length > 0 && (
          <>
            <div className="search-sort-row">
              <div className="search-field flex items-center gap-2">
                <Search aria-hidden="true" className="search-icon" size={18} />
                <input
                  type="search"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  aria-label={t('searchExpenses')}
                  placeholder={t('searchExpenses')}
                  className="search-input-minimal"
                />
                {query && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    aria-label="Clear search"
                    onClick={() => setQuery('')}
                  >
                    <X size={16} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            {/* Type Filter Tabs (same style as Khata Home filter tabs) */}
            <div className="filter-chips-container">
              <div className="filter-tabs-row" role="tablist" aria-label={t('expensesTitle')}>
                {(
                  [
                    { id: 'all', label: t('filterAll') },
                    { id: 'expense', label: t('expenseKind') },
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
                      className={`filter-tab-btn ${isActive ? 'filter-tab-active' : ''}`}
                      onClick={() => setKindFilter(tab.id)}
                    >
                      <span className="filter-tab-label">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Chips */}
            {usedCatIds.length > 1 && (
              <div className="home-category-filter-row" role="group" aria-label={t('category')}>
                <button
                  type="button"
                  className={`choice-chip ${catFilter === 'all' ? 'is-active' : ''}`}
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
                      className={`choice-chip ${catFilter === cid ? 'is-active' : ''}`}
                      onClick={() => setCatFilter(catFilter === cid ? 'all' : cid)}
                    >
                      {getCategoryLabel(cat, language, cid)}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Day-grouped list or empty state */}
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
          <div className="expense-day-groups">
            {dayGroups.map(group => (
              <section key={group.day} className="expense-day-section">
                <div className="expense-day-sticky-header">
                  <span>{localDate(group.day, language)}</span>
                  <bdi dir="ltr" className="text-muted">
                    {group.totalSpentPaisa > 0 ? `− ${moneyText(group.totalSpentPaisa)}` : moneyText(group.totalIncomePaisa)}
                  </bdi>
                </div>
                <div className="customer-rows-list">
                  {group.entries.map((exp, idx) => {
                    const cat = catMap.get(exp.categoryId);
                    const label = getCategoryLabel(cat, language, exp.categoryId);
                    const isIncome = exp.kind === 'income';
                    return (
                      <Link
                        key={exp.id}
                        to={`/expenses/${exp.id}/edit`}
                        className={`expense-row-link ${idx < 8 ? 'stagger-row' : ''}`}
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
                          className="cat-icon-badge"
                          style={{
                            backgroundColor: `${cat?.color ?? '#475569'}18`,
                            color: cat?.color ?? '#475569',
                          }}
                        >
                          <ExpenseCategoryIcon name={cat?.icon ?? 'circle-dot'} size={18} />
                        </span>
                        <div className="expense-row-meta">
                          <strong className="expense-row-cat" dir="auto">
                            <span
                              className="inline-block w-2 h-2 rounded-full mr-1.5"
                              style={{ backgroundColor: cat?.color ?? '#475569' }}
                              aria-hidden="true"
                            />
                            {label}
                          </strong>
                          {(exp.note || exp.paymentMethod) && (
                            <span className="expense-row-note" dir="auto">
                              {[exp.paymentMethod, exp.note].filter(Boolean).join(' • ')}
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
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      {/* Extended Floating Add Expense Button */}
      <div className="fab-above-nav-wrap">
        <Link className="button button-primary fab-extended-above-nav" to="/expenses/new">
          <Plus size={18} aria-hidden="true" />
          <span>{t('addExpense')}</span>
        </Link>
      </div>

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
