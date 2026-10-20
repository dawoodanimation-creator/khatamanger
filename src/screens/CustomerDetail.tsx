import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { Banknote, Edit3, Plus, Trash2, MessageCircle, MessageSquare, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import type { Ledger } from '../models/ledger';
import { CustomerContext } from '../components/CustomerContext';
import { Header } from '../components/Header';
import { Balance } from '../components/Balance';
import { MissingCustomer } from '../components/MissingCustomer';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { balanceFor, runningHistoryFor } from '../utils/balance';
import { money } from '../utils/money';
import { localDate } from '../utils/dates';
import { customerPath } from '../utils/routes';
import { reminderMessage, reminderLink } from '../utils/reminders';
export function CustomerDetail() {
  const { customerId } = useParams();
  const { ledger, deleteCustomer, writeError } = useLedger();
  const customer = ledger.customers.find(c => c.id === customerId);
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [dialog, setDialog] = useState<'delete' | null>(null);
  const deleteSnapshot = useRef<Ledger>(ledger);
  const removing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!customer) return <MissingCustomer/>;
  const balance = balanceFor(ledger, customer.id);
  const history = runningHistoryFor(ledger, customer.id).reverse();
  async function remove() {
    if (removing.current) return;
    removing.current = true; setBusy(true);
    if (await deleteCustomer(customer!.id, deleteSnapshot.current)) navigate('/', { replace: true });
    else setError(t(writeError()));
    removing.current = false; setBusy(false);
  }
  function openDialog(value: typeof dialog) { deleteSnapshot.current = ledger; setError(''); setDialog(value); }
  const whatsapp = reminderLink(customer, balance, true);
  return <><Header title={customer.name} backTo="/" actions={<>
    <Link className="icon-button" to={customerPath(customer.id, 'edit')} aria-label={t('edit')}><Edit3/></Link>
    <button type="button" className="icon-button danger-icon" aria-label={t('delete')} onClick={() => openDialog('delete')}><Trash2/></button>
  </>}/>
    <div className="page-content detail-content">
      <section className="customer-summary"><p className="customer-phone"><bdi dir="ltr">{customer.phone}</bdi></p>{customer.note && <p className="customer-note">{customer.note}</p>}
        <div className="detail-balance"><span className="summary-label">{t('balance')}</span><Balance paisa={balance}/></div>
        {balance > 0 && <section className="reminder-section" aria-label={t('remind')}>
          <h2>{t('remind')}</h2><p className="reminder-message" dir="ltr">{reminderMessage(customer, balance)}</p>
          <p className="muted-copy">{t('reminderHelp')}</p><div className="share-actions">
            {whatsapp ? <a className="button button-primary" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle aria-hidden="true"/>{t('whatsapp')}</a> : <button className="button button-primary" type="button" onClick={() => setError(t('invalidWhatsApp'))}><MessageCircle aria-hidden="true"/>{t('whatsapp')}</button>}
            <a className="button button-secondary" href={reminderLink(customer, balance, false)!}><MessageSquare aria-hidden="true"/>{t('sms')}</a>
          </div>{error && dialog !== 'delete' && <p className="field-error" role="alert">{error}</p>}
        </section>}
      </section>
      <div className="section-heading flex items-center justify-between"><h2>{t('history')}</h2><span className="count-badge">{history.length}</span></div>
      {history.length === 0 ? <div className="empty-state text-center"><p>{t('emptyHistory')}</p></div> : <ol className="transaction-list">
        {history.map(({ transaction, balancePaisa }) => <li className="transaction-card" key={transaction.id}>
          <div className="transaction-heading"><span className={`entry-icon ${transaction.kind === 'credit' ? 'entry-credit' : 'entry-payment'}`}>{transaction.kind === 'credit' ? <ArrowUpRight/> : <ArrowDownLeft/>}</span>
            <div className="entry-title"><strong>{t(transaction.kind === 'credit' ? 'credit' : 'payment')}</strong><time dateTime={transaction.date}>{localDate(transaction.date, language)}</time></div>
            <bdi dir="ltr" className={`entry-amount ${transaction.kind === 'credit' ? 'balance-owed' : 'balance-payable'}`}>{transaction.kind === 'credit' ? '+' : '−'} {money(transaction.amountPaisa, t('currencyLabel'))}</bdi>
          </div>
          {transaction.note && <p className="entry-note">{transaction.note}</p>}
          <div className="running-balance"><span>{t('running')}</span><Balance paisa={balancePaisa}/></div>
        </li>)}
      </ol>}
    </div>
    <div className="transaction-actions"><Link className="button button-primary" to={customerPath(customer.id, 'credit')}><Plus/>{t('credit')}</Link><Link className="button button-secondary" to={customerPath(customer.id, 'payment')}><Banknote/>{t('payment')}</Link></div>
    {dialog === 'delete' && <Modal title={t('deleteCustomer')} onDismiss={() => setDialog(null)} actions={<button className="button button-danger" type="button" disabled={busy} onClick={remove}><Trash2/>{t('delete')}</button>}>
      <CustomerContext customer={customer}/><p>{t('balance')}</p><Balance paisa={balance}/><p>{t('entries')}: {history.length}</p><p>{t('deleteWarning')}</p>{error && <p className="field-error" role="alert">{error}</p>}
    </Modal>}
  </>;
}
