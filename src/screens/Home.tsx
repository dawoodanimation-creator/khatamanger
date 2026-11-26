import { useMemo, useState } from 'react';
import { ArrowUpDown, Search, UserPlus, X } from 'lucide-react';
import { Link } from 'react-router';
import { ReviewControls } from '../components/ReviewControls';
import { Header } from '../components/Header';
import { BalanceSummary } from '../components/BalanceSummary';
import { FilterChips, type CustomerFilter } from '../components/FilterChips';
import { CustomerCard } from '../components/CustomerCard';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { useI18n } from '../i18n';
import { ledgerIndex } from '../utils/balance';
import { phoneMatches } from '../utils/phone';
import { sortCustomers } from '../utils/customerSort';
import { calculateCustomerOverdue } from '../utils/overdue';
import { localDayString, shouldShowBackupBanner } from '../utils/backupHelper';
import type { SortOrder } from '../utils/uiPrefs';

export function Home() {
  const { ledger, updateSettings } = useLedger();
  const { prefs, setSortOrder, dismissBackupBannerToday } = useUiPrefs();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');

  const index = ledgerIndex(ledger);
  const hidden = !!ledger.settings.hideBalances;
  const todayStr = localDayString();

  const overdueByCustomer = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const c of ledger.customers) {
      const history = index.histories.get(c.id) ?? [];
      const res = calculateCustomerOverdue(
        history.map(h => h.transaction),
        todayStr
      );
      if (res.isOverdue) map.set(c.id, res.earliestDueDate);
    }
    return map;
  }, [ledger.customers, index.histories, todayStr]);

  const sorted = useMemo(
    () => sortCustomers(ledger.customers, index, prefs.sortOrder, prefs.pinnedCustomerIds),
    [ledger.customers, index, prefs.sortOrder, prefs.pinnedCustomerIds]
  );

  const counts = useMemo(() => {
    let receive = 0;
    let pay = 0;
    let settled = 0;
    let overdue = 0;
    for (const c of ledger.customers) {
      const bal = index.balances.get(c.id) ?? 0;
      if (bal > 0) receive++;
      else if (bal < 0) pay++;
      else settled++;
      if (overdueByCustomer.has(c.id)) overdue++;
    }
    return { all: ledger.customers.length, receive, pay, settled, overdue };
  }, [ledger.customers, index.balances, overdueByCustomer]);

  const matchingCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sorted.filter(c => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        phoneMatches(c.phone, search);
      if (!matchesSearch) return false;

      const bal = index.balances.get(c.id) ?? 0;
      if (filter === 'receive') return bal > 0;
      if (filter === 'pay') return bal < 0;
      if (filter === 'settled') return bal === 0;
      if (filter === 'overdue') return overdueByCustomer.has(c.id);
      return true;
    });
  }, [sorted, query, filter, index.balances, overdueByCustomer]);

  const pinnedSet = useMemo(() => new Set(prefs.pinnedCustomerIds), [prefs.pinnedCustomerIds]);
  const showBackupBanner = shouldShowBackupBanner(
    ledger.customers.length > 0 || ledger.transactions.length > 0,
    prefs.lastBackupAt,
    prefs.backupBannerDismissedDate
  );

  const matchesSet = useMemo(
    () => new Set(matchingCustomers.map(c => c.id)),
    [matchingCustomers]
  );

  function clearSearchAndFilter() {
    setQuery('');
    setFilter('all');
  }

  const hasFilterOrSearch = query.trim().length > 0 || filter !== 'all';

  return (
    <>
      <Header title={t('app')} home />

      <div className="page-content home-content">
        {/* Minimalist Summary: Plain white area, 2 big numbers side by side */}
        <BalanceSummary
          outstanding={index.outstanding}
          payable={index.payable}
          hidden={hidden}
          onToggleHidden={() => updateSettings({ hideBalances: !hidden })}
        />

        {/* Quiet 7-day backup reminder banner */}
        {showBackupBanner && (
          <div className="backup-reminder-banner" role="status">
            <Link to="/settings/backup" className="backup-banner-link">
              {t('backupBannerText')}
            </Link>
            <button
              type="button"
              className="backup-banner-dismiss"
              aria-label={t('dismiss')}
              onClick={() => dismissBackupBannerToday(todayStr)}
            >
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Search Bar + Sort Control */}
        <div className="search-sort-row">
          <div className="search-field flex items-center gap-2">
            <Search aria-hidden="true" className="search-icon" size={18} />
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              aria-label={t('search')}
              placeholder={t('search')}
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

          {ledger.customers.length > 0 && (
            <div className="sort-control-wrapper">
              <ArrowUpDown size={14} className="text-muted" aria-hidden="true" />
              <select
                className="sort-select-minimal"
                aria-label={t('sortBy')}
                value={prefs.sortOrder}
                onChange={e => setSortOrder(e.target.value as SortOrder)}
              >
                <option value="recent">{t('sortRecent')}</option>
                <option value="highest">{t('sortHighest')}</option>
                <option value="name">{t('sortName')}</option>
                <option value="oldest">{t('sortOldest')}</option>
              </select>
            </div>
          )}
        </div>

        {/* Filters: Simple underlined text tabs */}
        {ledger.customers.length > 0 && (
          <FilterChips current={filter} onChange={setFilter} counts={counts} />
        )}

        {/* Empty States */}
        {ledger.customers.length === 0 ? (
          <div className="empty-state-minimal text-center">
            <h2 className="empty-state-headline">{t('emptyCustomers')}</h2>
            <p className="empty-state-subtext">{t('emptyCustomersBody')}</p>
            <Link
              className="button button-primary empty-state-cta"
              to="/customers/new"
            >
              <UserPlus size={18} aria-hidden="true" />
              <span>{t('addFirstCustomer')}</span>
            </Link>
            <ReviewControls compact />
          </div>
        ) : matchingCustomers.length === 0 ? (
          <div className="empty-state-minimal text-center">
            <h2 className="empty-state-headline">{t('noMatches')}</h2>
            <p className="empty-state-subtext">{t('noFilterMatches')}</p>
            {hasFilterOrSearch && (
              <button
                type="button"
                className="button button-secondary clear-filters-btn"
                onClick={clearSearchAndFilter}
              >
                {t('clearFilters')}
              </button>
            )}
          </div>
        ) : (
          <div className="customer-list customer-rows-list">
            {sorted.map(customer => {
              const balance = index.balances.get(customer.id) ?? 0;
              const history = index.histories.get(customer.id);
              const latestTx =
                history && history.length > 0
                  ? history[history.length - 1].transaction
                  : null;

              return (
                <div
                  className="customer-row"
                  key={customer.id}
                  hidden={!matchesSet.has(customer.id)}
                >
                  <CustomerCard
                    customer={customer}
                    balance={balance}
                    lastActivityDate={latestTx?.date}
                    isPinned={pinnedSet.has(customer.id)}
                    overdueDueDate={overdueByCustomer.get(customer.id) ?? null}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed Full-Width Bottom Bar with Soft Fade Above */}
      <div className="home-actions">
        <Link
          className="button button-primary add-customer-main-btn"
          to="/customers/new"
        >
          <UserPlus size={18} aria-hidden="true" />
          <span>{t('addCustomer')}</span>
        </Link>
      </div>
    </>
  );
}
