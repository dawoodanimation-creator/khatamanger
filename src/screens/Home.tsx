import { useMemo, useState } from 'react';
import { ArrowUpDown, BarChart3, Bell, Plus, Search, UserPlus, X } from 'lucide-react';
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
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [udhaarCatFilter, setUdhaarCatFilter] = useState<string>('all');

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

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const c of ledger.customers) {
      if (c.category?.trim()) set.add(c.category.trim());
    }
    return Array.from(set);
  }, [ledger.customers]);

  const categoryLabels: Record<string, string> = {
    Regular: t('catRegular'),
    Wholesale: t('catWholesale'),
    Family: t('catFamily'),
    'Friend/Neighbour': t('catFriend'),
    Staff: t('catStaff'),
    Supplier: t('catSupplier'),
  };

  const availableUdhaarCategories = useMemo(() => {
    const set = new Set<string>();
    for (const tx of ledger.transactions) {
      if (tx.kind === 'credit' && tx.category?.trim()) set.add(tx.category.trim());
    }
    return Array.from(set);
  }, [ledger.transactions]);

  const matchingCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sorted.filter(c => {
      const matchesSearch =
        !search ||
        c.name.toLowerCase().includes(search) ||
        phoneMatches(c.phone, search) ||
        (c.address ? c.address.toLowerCase().includes(search) : false);
      if (!matchesSearch) return false;

      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false;
      }

      if (udhaarCatFilter !== 'all') {
        const hist = index.histories.get(c.id) ?? [];
        if (!hist.some(h => h.transaction.kind === 'credit' && h.transaction.category === udhaarCatFilter)) {
          return false;
        }
      }

      const bal = index.balances.get(c.id) ?? 0;
      if (filter === 'receive') return bal > 0;
      if (filter === 'pay') return bal < 0;
      if (filter === 'settled') return bal === 0;
      if (filter === 'overdue') return overdueByCustomer.has(c.id);
      return true;
    });
  }, [sorted, query, filter, categoryFilter, udhaarCatFilter, index.balances, index.histories, overdueByCustomer]);

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
    setCategoryFilter('all');
    setUdhaarCatFilter('all');
  }

  const hasFilterOrSearch =
    query.trim().length > 0 ||
    filter !== 'all' ||
    categoryFilter !== 'all' ||
    udhaarCatFilter !== 'all';

  const shopTitle = ledger.settings.profile?.shopName?.trim() || t('app');

  return (
    <>
      <Header caption={t('app')} title={shopTitle} home />

      <div className="page-content home-content v3-page-content">
        {/* Green Gradient Hero Card */}
        <BalanceSummary
          outstanding={index.outstanding}
          payable={index.payable}
          overdueCount={counts.overdue}
          hidden={hidden}
          onToggleHidden={() => updateSettings({ hideBalances: !hidden })}
        />

        {/* 3 Tonal Quick-Action Tiles */}
        <div className="v3-quick-tiles v3-rise" style={{ '--rise-idx': 1 } as React.CSSProperties}>
          <Link to="/customers/new" className="v3-quick-tile">
            <UserPlus size={20} aria-hidden="true" />
            <span>{t('addCustomer')}</span>
          </Link>
          <button
            type="button"
            className="v3-quick-tile"
            onClick={() => setFilter(filter === 'overdue' ? 'all' : 'overdue')}
          >
            <Bell size={20} aria-hidden="true" />
            <span>{t('remindersTile')}</span>
          </button>
          <Link to="/summary" className="v3-quick-tile">
            <BarChart3 size={20} aria-hidden="true" />
            <span>{t('summaryTile')}</span>
          </Link>
        </div>

        {/* Slim Amber Backup Chip */}
        {showBackupBanner && (
          <div className="v3-amber-chip v3-rise" style={{ '--rise-idx': 2 } as React.CSSProperties} role="status">
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
            <div className="sort-control-wrapper" title={t('sortBy')}>
              <ArrowUpDown size={18} className="text-muted" aria-hidden="true" />
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

        {/* Optional Customer Category Filter Chips */}
        {availableCategories.length > 0 && (
          <div
            className="home-category-filter-row"
            role="group"
            aria-label={t('category')}
          >
            <button
              type="button"
              className={`choice-chip ${categoryFilter === 'all' ? 'is-active' : ''}`}
              aria-pressed={categoryFilter === 'all'}
              onClick={() => setCategoryFilter('all')}
            >
              {t('allCategories')}
            </button>
            {availableCategories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`choice-chip ${categoryFilter === cat ? 'is-active' : ''}`}
                aria-pressed={categoryFilter === cat}
                onClick={() => setCategoryFilter(categoryFilter === cat ? 'all' : cat)}
              >
                {categoryLabels[cat] ?? cat}
              </button>
            ))}
          </div>
        )}

        {/* Optional Udhaar Category Filter Chips */}
        {availableUdhaarCategories.length > 0 && (
          <div
            className="home-category-filter-row"
            role="group"
            aria-label={t('udhaarCategoryFilter')}
          >
            <button
              type="button"
              className={`choice-chip ${udhaarCatFilter === 'all' ? 'is-active' : ''}`}
              aria-pressed={udhaarCatFilter === 'all'}
              onClick={() => setUdhaarCatFilter('all')}
            >
              {t('udhaarCategoryFilter')}: {t('filterAll')}
            </button>
            {availableUdhaarCategories.map(cat => (
              <button
                key={cat}
                type="button"
                className={`choice-chip ${udhaarCatFilter === cat ? 'is-active' : ''}`}
                aria-pressed={udhaarCatFilter === cat}
                onClick={() => setUdhaarCatFilter(udhaarCatFilter === cat ? 'all' : cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Empty States */}
        {ledger.customers.length === 0 ? (
          <div className="empty-state-minimal text-center">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true" style={{ margin: '0 auto 12px', color: 'var(--color-primary)' }}>
              <rect x="14" y="10" width="44" height="52" rx="8" stroke="currentColor" strokeWidth="2.5" opacity="0.3" />
              <circle cx="36" cy="30" r="9" stroke="currentColor" strokeWidth="2.5" />
              <path d="M22 50c3-6 25-6 28 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
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
          <div className="v3-list-card v3-rise" style={{ '--rise-idx': 4 } as React.CSSProperties}>
            {sorted.map((customer, idx) => {
              const balance = index.balances.get(customer.id) ?? 0;
              const history = index.histories.get(customer.id);
              const latestTx =
                history && history.length > 0
                  ? history[history.length - 1].transaction
                  : null;
              const isVisible = matchesSet.has(customer.id);

              return (
                <div
                  className={`v3-list-row-wrap ${isVisible && idx < 8 ? 'v3-row-rise' : ''}`}
                  style={isVisible && idx < 8 ? ({ '--stagger-idx': idx } as React.CSSProperties) : undefined}
                  key={customer.id}
                  hidden={!isVisible}
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

      {/* Round 56px Floating Action Button */}
      <Link
        className="v3-fab"
        to="/customers/new"
        aria-label={t('addFirstCustomer')}
        title={t('addCustomer')}
      >
        <Plus size={24} aria-hidden="true" />
      </Link>
    </>
  );
}
