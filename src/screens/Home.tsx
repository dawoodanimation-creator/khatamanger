import { useMemo, useState } from 'react';
import { Search, UserPlus, X, Filter } from 'lucide-react';
import { Link } from 'react-router';
import { ReviewControls } from '../components/ReviewControls';
import { Header } from '../components/Header';
import { LedgerIllustration } from '../components/LedgerIllustration';
import { BalanceSummary } from '../components/BalanceSummary';
import { FilterChips, type CustomerFilter } from '../components/FilterChips';
import { CustomerCard } from '../components/CustomerCard';
import { useLedger } from '../state/LedgerContext';
import { useI18n } from '../i18n';
import { ledgerIndex } from '../utils/balance';
import { phoneMatches } from '../utils/phone';

export function Home() {
  const { ledger, updateSettings } = useLedger();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');

  const index = ledgerIndex(ledger);
  const hidden = !!ledger.settings.hideBalances;

  const sorted = useMemo(
    () => [...ledger.customers].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
    [ledger.customers]
  );

  const counts = useMemo(() => {
    let receive = 0;
    let pay = 0;
    let settled = 0;
    for (const c of ledger.customers) {
      const bal = index.balances.get(c.id) ?? 0;
      if (bal > 0) receive++;
      else if (bal < 0) pay++;
      else settled++;
    }
    return { all: ledger.customers.length, receive, pay, settled };
  }, [ledger.customers, index.balances]);

  const matchingCustomers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return sorted.filter(c => {
      // 1. Search text match
      const matchesSearch = !search || c.name.toLowerCase().includes(search) || phoneMatches(c.phone, search);
      if (!matchesSearch) return false;

      // 2. Filter status match
      const bal = index.balances.get(c.id) ?? 0;
      if (filter === 'receive') return bal > 0;
      if (filter === 'pay') return bal < 0;
      if (filter === 'settled') return bal === 0;
      return true;
    });
  }, [sorted, query, filter, index.balances]);

  const matchesSet = useMemo(() => new Set(matchingCustomers.map(c => c.id)), [matchingCustomers]);

  function clearSearchAndFilter() {
    setQuery('');
    setFilter('all');
  }

  const hasFilterOrSearch = query.trim().length > 0 || filter !== 'all';

  return (
    <>
      <Header title={t('app')} home />

      <div className="page-content home-content">
        {/* P0-2: Hero Balance Summary (2 equal columns, no carousel dots, toggle hides both) */}
        <BalanceSummary
          outstanding={index.outstanding}
          payable={index.payable}
          hidden={hidden}
          onToggleHidden={() => updateSettings({ hideBalances: !hidden })}
        />

        {/* P1-9 & P1-4: Refined Search Bar */}
        <div className="search-field flex items-center gap-3">
          <Search aria-hidden="true" className="search-icon" />
          <input
            type="search"
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label={t('search')}
            placeholder={t('search')}
          />
          {query && (
            <button
              type="button"
              className="search-clear-btn"
              aria-label="Clear search"
              onClick={() => setQuery('')}
            >
              <X aria-hidden="true" />
            </button>
          )}
        </div>

        {/* P1-7: Filter Chips (All / To receive / To pay / Settled) */}
        {ledger.customers.length > 0 && (
          <FilterChips
            current={filter}
            onChange={setFilter}
            counts={counts}
          />
        )}

        {/* Heading & Count badge */}
        <div className="section-heading flex items-center justify-between">
          <h2>{t('customers')}</h2>
          <span className="count-badge" aria-label={`${matchingCustomers.length} ${t('customers')}`}>
            {matchingCustomers.length}
          </span>
        </div>

        {/* Empty States (P1-10) */}
        {ledger.customers.length === 0 ? (
          <div className="empty-state flex flex-col items-center text-center">
            <LedgerIllustration />
            <h2>{t('emptyCustomers')}</h2>
            <p>{t('emptyCustomersBody')}</p>
            <Link className="button button-primary empty-state-cta" to="/customers/new">
              <UserPlus aria-hidden="true" />
              {t('addFirstCustomer')}
            </Link>
            <ReviewControls compact />
          </div>
        ) : matchingCustomers.length === 0 ? (
          <div className="empty-state filter-empty-state flex flex-col items-center text-center">
            <div className="filter-empty-icon" aria-hidden="true">
              <Filter />
            </div>
            <h2>{t('noMatches')}</h2>
            <p>{t('noFilterMatches')}</p>
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
          <div className="customer-list">
            {sorted.map(customer => {
              const balance = index.balances.get(customer.id) ?? 0;
              const history = index.histories.get(customer.id);
              const latestTx = history && history.length > 0 ? history[history.length - 1].transaction : null;

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
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Fixed bottom bar with soft fade-out above (P0-1) */}
      <div className="home-actions">
        <Link className="button button-primary" to="/customers/new">
          <UserPlus aria-hidden="true" />
          {t('addCustomer')}
        </Link>
      </div>
    </>
  );
}
