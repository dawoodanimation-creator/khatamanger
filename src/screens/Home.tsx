import { memo, useMemo, useState } from 'react';
import { ArrowUpRight, Search, UserPlus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router';
import { ReviewControls } from '../components/ReviewControls';
import { Header } from '../components/Header';
import { Balance } from '../components/Balance';
import { LedgerIllustration } from '../components/LedgerIllustration';
import { useLedger } from '../state/LedgerContext';
import { useI18n } from '../i18n';
import { ledgerIndex } from '../utils/balance';
import { customerPath } from '../utils/routes';
import { phoneMatches } from '../utils/phone';
import { money } from '../utils/money';
import type { Customer } from '../models/customer';
const CustomerRow = memo(function CustomerRow({ customer, balance }: { customer: Customer; balance: number }) {
  return <Link to={customerPath(customer.id)} className="customer-card" key={customer.id}>
    <div className="customer-identity"><strong dir="auto">{customer.name}</strong><p><bdi dir="ltr">{customer.phone}</bdi></p></div><Balance paisa={balance}/><ChevronRight aria-hidden="true" className="forward-icon"/>
  </Link>;
});
export function Home() {
  const { ledger } = useLedger();
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const sorted = useMemo(() => [...ledger.customers].sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())), [ledger.customers]);
  const customers = useMemo(() => {
    const search = query.trim().toLowerCase();
    return search ? sorted.filter(c => c.name.toLowerCase().includes(search) || phoneMatches(c.phone, search)) : sorted;
  }, [sorted, query]);
  const matches = useMemo(() => new Set(customers.map(c => c.id)), [customers]);
  const index = ledgerIndex(ledger);
  return <><Header title={t('app')} home/><div className="page-content home-content">
    <section className="outstanding-card" aria-label={t('outstanding')}>
      <div className="hero-heading flex items-center justify-between"><span>{t('outstanding')}</span><span className="hero-icon"><ArrowUpRight aria-hidden="true"/></span></div>
      <bdi dir="ltr" className="total-amount">{money(index.outstanding, t('currencyLabel'))}</bdi>
      {index.payable > 0 && <p>{t('payable')}: <bdi dir="ltr">{money(index.payable, t('currencyLabel'))}</bdi></p>}
      <div className="hero-baseline" aria-hidden="true"><span/><span/><span/></div>
    </section>
    <label className="search-field flex items-center gap-3"><Search aria-hidden="true"/><input type="search" value={query} onChange={e => setQuery(e.target.value)} aria-label={t('search')} placeholder={t('search')}/></label>
    <div className="section-heading flex items-center justify-between"><h2>{t('customers')}</h2><span className="count-badge">{ledger.customers.length}</span></div>
    {ledger.customers.length === 0 ? <div className="empty-state flex flex-col items-center text-center"><LedgerIllustration/><h2>{t('emptyCustomers')}</h2><p>{t('emptyCustomersBody')}</p><ReviewControls compact/></div>
      : <>{customers.length === 0 && <div className="empty-state"><p>{t('noMatches')}</p></div>}<div className="customer-list">{sorted.map(customer => <div className="customer-row" key={customer.id} hidden={!matches.has(customer.id)}><CustomerRow customer={customer} balance={index.balances.get(customer.id) ?? 0}/></div>)}</div></>}
  </div><div className="home-actions"><Link className="button button-primary" to="/customers/new"><UserPlus aria-hidden="true"/>{t('addCustomer')}</Link></div></>;
}
