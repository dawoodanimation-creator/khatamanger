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
  const { ledger } = useLedger();
  const { prefs } = useUiPrefs();
  const { t, language, direction } = useI18n();

  const today = todayISO();
  const [monthKey, setMonthKey] = useState(today.slice(0, 7));
  const [kindFilter, setKindFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const [dismissedSuggestionIds, setDismissedSuggestionIds] = useState<string[]>([]);

  const hidden = !!ledger.settings.hideBalances;
  const expenses = ledger.expenses ?? [];
  const categories = useMemo(
    () => resolveExpenseCategories(ledger.expenseCategories),
    [ledger.expenseCategories]
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
          <div className="expense-hero-subgrid">
            <div className="expense-hero-stat">
              <span className="summary-label">{t('incomeThisMonth')}</span>
              <bdi dir="ltr" className="font-semibold expense-income-text">
                {moneyText(summary.incomePaisa)}
              </bdi>
            </div>
            <div className="expense-hero-stat">
              <span className="summary-label">{t('netBalance')}</span>
              <bdi dir="ltr" className="font-semibold">
                {hidden
                  ? '••••••'
                  : `${summary.netPaisa < 0 ? '− ' : ''}${formatMoney(
                      Math.abs(summary.netPaisa),
                      t('currencyLabel'),
                      prefs.numberFormat
                    )}`}
              </bdi>
            </div>
            <div className="expense-hero-stat">
              <span className="summary-label">{t('todaySpent')}</span>
              <bdi dir="ltr" className="font-semibold">
                {moneyText(summary.todaySpentPaisa)}
              </bdi>
            </div>
          </div>
        </section>

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

            {/* Type Filter Tabs */}
            <div className="filter-tabs" role="tablist" aria-label={t('expensesTitle')}>
              {(
                [
                  { id: 'all', label: t('filterAll') },
                  { id: 'expense', label: t('expenseKind') },
                  { id: 'income', label: t('incomeKind') },
                ] as const
              ).map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={kindFilter === tab.id}
                  className={`filter-tab ${kindFilter === tab.id ? 'active' : ''}`}
                  onClick={() => setKindFilter(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
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
    </>
  );
}
