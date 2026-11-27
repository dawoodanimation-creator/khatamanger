import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Header } from '../components/Header';
import { ExpenseCategoryIcon } from '../components/ExpenseCategoryIcon';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { computeExpenseMonthSummary, monthKeyFromDate, shiftMonthKey } from '../utils/expenses';
import { getCategoryLabel, resolveExpenseCategories } from '../utils/expenseCategories';
import { formatMoney } from '../utils/numberFormat';
import { todayISO } from '../utils/dates';

function formatMonthTitle(monthKey: string, language: 'en' | 'ur'): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1));
}

export function ExpenseReports() {
  const { ledger } = useLedger();
  const { prefs } = useUiPrefs();
  const { t, language, direction } = useI18n();
  const [monthKey, setMonthKey] = useState(todayISO().slice(0, 7));

  const hidden = !!ledger.settings.hideBalances;
  const expenses = ledger.expenses ?? [];
  const categories = useMemo(
    () => resolveExpenseCategories(ledger.expenseCategories),
    [ledger.expenseCategories]
  );
  const catMap = useMemo(() => new Map(categories.map(c => [c.id, c])), [categories]);

  const summary = useMemo(
    () => computeExpenseMonthSummary(expenses, monthKey),
    [expenses, monthKey]
  );

  const khataMonth = useMemo(() => {
    let givenPaisa = 0;
    let receivedPaisa = 0;
    for (const tx of ledger.transactions) {
      if (monthKeyFromDate(tx.date) !== monthKey) continue;
      if (tx.kind === 'credit') givenPaisa += tx.amountPaisa;
      else receivedPaisa += tx.amountPaisa;
    }
    return { givenPaisa, receivedPaisa };
  }, [ledger.transactions, monthKey]);

  const budgets = ledger.budgets ?? [];
  const spentByCat = new Map(summary.byCategory.map(b => [b.categoryId, b.spentPaisa]));
  const moneyText = (paisa: number) =>
    hidden ? '••••••' : formatMoney(paisa, t('currencyLabel'), prefs.numberFormat);

  return (
    <>
      <Header title={t('expenseReports')} backTo="/expenses" />

      <div className="page-content settings-content settings-with-nav">
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

        {/* Combined Overview: Khata vs Expenses Side by Side */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('combinedOverview')}</h2>
          <div className="combined-overview-grid">
            <div className="combined-card">
              <strong className="combined-card-title">{t('khataSection')}</strong>
              <div className="combined-stat">
                <span className="text-xs text-muted">{t('totalGiven')}</span>
                <bdi dir="ltr" className="font-semibold amount-pay">
                  {moneyText(khataMonth.givenPaisa)}
                </bdi>
              </div>
              <div className="combined-stat">
                <span className="text-xs text-muted">{t('totalReceived')}</span>
                <bdi dir="ltr" className="font-semibold amount-receive">
                  {moneyText(khataMonth.receivedPaisa)}
                </bdi>
              </div>
            </div>

            <div className="combined-card">
              <strong className="combined-card-title">{t('expensesSection')}</strong>
              <div className="combined-stat">
                <span className="text-xs text-muted">{t('spentThisMonth')}</span>
                <bdi dir="ltr" className="font-semibold">
                  {moneyText(summary.spentPaisa)}
                </bdi>
              </div>
              <div className="combined-stat">
                <span className="text-xs text-muted">{t('incomeThisMonth')}</span>
                <bdi dir="ltr" className="font-semibold expense-income-text">
                  {moneyText(summary.incomePaisa)}
                </bdi>
              </div>
            </div>
          </div>
        </section>

        {/* Category Breakdown */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('categoryBreakdown')}</h2>
          <div className="settings-group-card settings-group-card-padded">
            {summary.byCategory.length === 0 ? (
              <p className="text-sm text-muted">{t('noMonthlyData')}</p>
            ) : (
              <div className="category-bar-list">
                {summary.byCategory.map(item => {
                  const cat = catMap.get(item.categoryId);
                  const label = getCategoryLabel(cat, language, item.categoryId);
                  const deltaLabel =
                    item.deltaPct !== null
                      ? t('vsLastMonth', {
                          delta: `${item.deltaPct >= 0 ? '+' : ''}${item.deltaPct}%`,
                        })
                      : null;
                  return (
                    <div key={item.categoryId} className="category-bar-row">
                      <div className="category-bar-labels">
                        <span className="flex items-center gap-2 min-w-0">
                          <ExpenseCategoryIcon
                            name={cat?.icon ?? 'circle-dot'}
                            size={15}
                            color={cat?.color}
                          />
                          <span className="truncate" dir="auto">
                            {label} ({item.sharePct}%)
                          </span>
                        </span>
                        <bdi dir="ltr" className="font-semibold shrink-0">
                          {moneyText(item.spentPaisa)}
                        </bdi>
                      </div>
                      <div className="category-bar-track" aria-hidden="true">
                        <div
                          className="category-bar-fill"
                          style={{
                            width: `${Math.max(4, item.sharePct)}%`,
                            backgroundColor: cat?.color ?? 'var(--color-primary)',
                          }}
                        />
                      </div>
                      {deltaLabel && <span className="text-xs text-muted">{deltaLabel}</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* P2 Monthly Budgets (if configured) */}
        {budgets.length > 0 && (
          <section className="settings-group">
            <h2 className="settings-group-title">{t('monthlyBudget')}</h2>
            <div className="settings-group-card settings-group-card-padded">
              <div className="category-bar-list">
                {budgets.map(b => {
                  const cat = catMap.get(b.categoryId);
                  const spent = spentByCat.get(b.categoryId) ?? 0;
                  const ratio = b.limitPaisa > 0 ? spent / b.limitPaisa : 0;
                  const statusClass =
                    ratio >= 1 ? 'is-over' : ratio >= 0.8 ? 'is-warning' : '';
                  return (
                    <div key={b.categoryId} className="credit-limit-wrap" style={{ marginTop: 0 }}>
                      <div className={`credit-limit-header ${statusClass}`}>
                        <span dir="auto">{getCategoryLabel(cat, language, b.categoryId)}</span>
                        <bdi dir="ltr">
                          {t('budgetUsed', {
                            used: moneyText(spent),
                            limit: moneyText(b.limitPaisa),
                          })}
                        </bdi>
                      </div>
                      <div className="credit-limit-track" aria-hidden="true">
                        <div
                          className={`credit-limit-fill ${statusClass}`}
                          style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </div>
    </>
  );
}
