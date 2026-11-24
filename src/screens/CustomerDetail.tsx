import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  Banknote,
  Edit3,
  Plus,
  Trash2,
  MessageCircle,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  FileText,
  Phone,
  ChevronDown,
  ChevronUp,
  ShoppingBag,
  Eye,
  EyeOff
} from 'lucide-react';
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
import { localDate, monthYearLabel } from '../utils/dates';
import { customerPath } from '../utils/routes';
import { reminderMessage, reminderLink } from '../utils/reminders';
import { printCustomerStatement } from '../utils/statement';
import { getInitials, getAvatarColorIndex } from '../utils/avatar';

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

  // UI state
  const [showReminderText, setShowReminderText] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Group transactions by month
  const balance = customer ? balanceFor(ledger, customer.id) : 0;
  const history = useMemo(() => customer ? runningHistoryFor(ledger, customer.id).reverse() : [], [ledger, customer]);

  const groupedHistory = useMemo(() => {
    if (!customer) return [];
    const groups: Array<{ monthKey: string; label: string; entries: typeof history }> = [];
    const map = new Map<string, typeof history>();

    for (const item of history) {
      const label = monthYearLabel(item.transaction.date, language);
      if (!map.has(label)) {
        map.set(label, []);
        groups.push({ monthKey: label, label, entries: map.get(label)! });
      }
      map.get(label)!.push(item);
    }
    return groups;
  }, [customer, history, language]);

  if (!customer) return <MissingCustomer />;

  const initials = getInitials(customer.name);
  const colorIndex = getAvatarColorIndex(customer.name);
  const whatsapp = reminderLink(customer, balance, true);

  function toggleItemExpand(id: string) {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function remove() {
    if (removing.current) return;
    removing.current = true;
    setBusy(true);
    if (await deleteCustomer(customer!.id, deleteSnapshot.current)) {
      navigate('/', { replace: true });
    } else {
      setError(t(writeError()));
    }
    removing.current = false;
    setBusy(false);
  }

  function openDialog(value: typeof dialog) {
    deleteSnapshot.current = ledger;
    setError('');
    setDialog(value);
  }

  return (
    <>
      <Header
        title={customer.name}
        backTo="/"
        actions={
          <div className="header-actions-group">
            <button
              type="button"
              className="icon-button"
              aria-label={t('downloadStatement')}
              title={t('downloadStatement')}
              onClick={() =>
                printCustomerStatement(
                  customer,
                  runningHistoryFor(ledger, customer.id),
                  balance,
                  t('currencyLabel'),
                  language === 'ur'
                )
              }
            >
              <FileText size={19} />
            </button>

            <Link
              className="icon-button"
              to={customerPath(customer.id, 'edit')}
              aria-label={t('edit')}
              title={t('edit')}
            >
              <Edit3 size={19} />
            </Link>

            <div className="header-action-divider" aria-hidden="true" />

            <button
              type="button"
              className="icon-button delete-action-btn"
              aria-label={t('delete')}
              title={t('delete')}
              onClick={() => openDialog('delete')}
            >
              <Trash2 size={19} />
            </button>
          </div>
        }
      />

      <div className="page-content detail-content">
        {/* Compact Hero Card */}
        <section className="customer-summary">
          <div className="customer-summary-top">
            <div
              className={`customer-avatar avatar-color-${colorIndex}`}
              aria-hidden="true"
            >
              {initials}
            </div>

            <div className="customer-summary-identity">
              <strong className="customer-summary-name" dir="auto">
                {customer.name}
              </strong>

              <div className="customer-summary-phone-line">
                <span className="customer-phone" dir="ltr">
                  <bdi>{customer.phone}</bdi>
                </span>
                <a
                  href={`tel:${customer.phone}`}
                  className="call-pill-btn"
                  aria-label={t('call')}
                  title={t('call')}
                >
                  <Phone size={13} aria-hidden="true" />
                  <span>{t('call')}</span>
                </a>
              </div>
            </div>
          </div>

          <div className="detail-balance">
            <span className="summary-label">{t('balance')}</span>
            <Balance paisa={balance} customerName={customer.name} />
          </div>

          {customer.note && (
            <p className="customer-note customer-note-line">
              {customer.note}
            </p>
          )}

          {/* Compact Reminder Row (Only when customer owes money) */}
          {balance > 0 && (
            <section className="reminder-section" aria-label={t('remind')}>
              <div className="reminder-compact-row">
                <div className="reminder-header-group">
                  <span className="reminder-label">{t('remind')}</span>
                  <button
                    type="button"
                    className="reminder-view-toggle"
                    onClick={() => setShowReminderText(p => !p)}
                    aria-expanded={showReminderText}
                  >
                    {showReminderText ? <EyeOff size={13} /> : <Eye size={13} />}
                    <span>{t(showReminderText ? 'hideMessage' : 'viewMessage')}</span>
                  </button>
                </div>

                <div className="share-actions-compact">
                  {whatsapp ? (
                    <a
                      className="reminder-action-btn wa-btn"
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('whatsapp')}
                      title={t('whatsapp')}
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      <span>{t('whatsapp')}</span>
                    </a>
                  ) : (
                    <button
                      className="reminder-action-btn wa-btn"
                      type="button"
                      onClick={() => setError(t('invalidWhatsApp'))}
                      aria-label={t('whatsapp')}
                      title={t('whatsapp')}
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      <span>{t('whatsapp')}</span>
                    </button>
                  )}

                  <a
                    className="reminder-action-btn sms-btn"
                    href={reminderLink(customer, balance, false)!}
                    aria-label={t('sms')}
                    title={t('sms')}
                  >
                    <MessageSquare size={16} aria-hidden="true" />
                    <span>{t('sms')}</span>
                  </a>
                </div>
              </div>

              {/* Expandable Message Box */}
              <div className={`reminder-accordion ${showReminderText ? 'expanded' : ''}`}>
                <p className="reminder-message" dir="ltr">
                  {reminderMessage(customer, balance)}
                </p>
                <p className="muted-copy text-xs">{t('reminderHelp')}</p>
              </div>

              {error && dialog !== 'delete' && (
                <p className="field-error" role="alert">
                  {error}
                </p>
              )}
            </section>
          )}
        </section>

        {/* History Header */}
        <div className="section-heading flex items-center justify-between">
          <h2>{t('history')}</h2>
          <span className="count-badge">{history.length}</span>
        </div>

        {/* Empty History State */}
        {history.length === 0 ? (
          <div className="empty-state text-center">
            <div className="empty-state-icon" aria-hidden="true">
              <Clock size={36} />
            </div>
            <p className="empty-state-text">{t('emptyHistory')}</p>
            <Link
              to={customerPath(customer.id, 'credit')}
              className="button button-primary empty-state-cta"
            >
              <Plus size={16} aria-hidden="true" />
              <span>{t('addFirstUdhaar')}</span>
            </Link>
          </div>
        ) : (
          <div className="transaction-history-container">
            {groupedHistory.map(group => (
              <div key={group.monthKey} className="month-group">
                <div className="month-sticky-header">
                  <span className="month-sticky-badge">{group.label}</span>
                </div>

                <ol className="transaction-list">
                  {group.entries.map(({ transaction, balancePaisa }) => {
                    const isCredit = transaction.kind === 'credit';
                    const isExpanded = expandedItems.has(transaction.id);
                    const itemCount = transaction.items?.length || 0;

                    return (
                      <li className="transaction-card" key={transaction.id}>
                        <div className="transaction-heading">
                          <span
                            className={`entry-icon ${
                              isCredit ? 'entry-credit' : 'entry-payment'
                            }`}
                          >
                            {isCredit ? (
                              <ArrowUpRight size={17} />
                            ) : (
                              <ArrowDownLeft size={17} />
                            )}
                          </span>

                          <div className="entry-title">
                            <strong>{t(isCredit ? 'credit' : 'payment')}</strong>
                            <time dateTime={transaction.date}>
                              {localDate(transaction.date, language)}
                            </time>
                          </div>

                          <bdi
                            dir="ltr"
                            className={`entry-amount ${
                              isCredit ? 'balance-owed' : 'balance-payable'
                            }`}
                          >
                            {isCredit ? '+' : '−'}{' '}
                            {money(transaction.amountPaisa, t('currencyLabel'))}
                          </bdi>
                        </div>

                        {/* Collapsible Items Toggle */}
                        {itemCount > 0 && (
                          <div className="transaction-items-wrapper">
                            <button
                              type="button"
                              className="items-toggle-btn"
                              onClick={() => toggleItemExpand(transaction.id)}
                              aria-expanded={isExpanded}
                            >
                              <ShoppingBag size={13} aria-hidden="true" />
                              <span>{t('itemsCount', { count: String(itemCount) })}</span>
                              {isExpanded ? (
                                <ChevronUp size={13} aria-hidden="true" />
                              ) : (
                                <ChevronDown size={13} aria-hidden="true" />
                              )}
                            </button>

                            {isExpanded && (
                              <div className="item-list-display" aria-label={t('items')}>
                                {transaction.items!.map(item => (
                                  <div key={item.id} className="item-entry-row">
                                    <div>
                                      <span className="item-entry-name">{item.name}</span>
                                      {item.qty && (
                                        <span className="item-entry-meta">
                                          {' '}
                                          ({item.qty})
                                        </span>
                                      )}
                                    </div>
                                    {item.pricePaisa !== undefined && (
                                      <span className="item-entry-meta">
                                        <bdi dir="ltr">
                                          {money(item.pricePaisa, t('currencyLabel'))}
                                        </bdi>
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {transaction.dueDate && (
                          <div className="due-date-badge">
                            <Clock size={12} aria-hidden="true" />
                            <span>
                              {t('dueDate')}: {transaction.dueDate}
                            </span>
                          </div>
                        )}

                        {transaction.note && (
                          <p className="entry-note">{transaction.note}</p>
                        )}

                        <div className="running-balance quiet">
                          <span className="running-label">{t('running')}</span>
                          <Balance paisa={balancePaisa} />
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (Side by side in one row) */}
      <div className="transaction-actions side-by-side">
        <Link
          className="button button-credit-action"
          to={customerPath(customer.id, 'credit')}
        >
          <Plus size={18} aria-hidden="true" />
          <span>{t('credit')}</span>
        </Link>
        <Link
          className="button button-payment-action"
          to={customerPath(customer.id, 'payment')}
        >
          <Banknote size={18} aria-hidden="true" />
          <span>{t('payment')}</span>
        </Link>
      </div>

      {/* Delete Confirmation Modal */}
      {dialog === 'delete' && (
        <Modal
          title={t('deleteCustomer')}
          onDismiss={() => setDialog(null)}
          actions={
            <button
              className="button button-danger"
              type="button"
              disabled={busy}
              onClick={remove}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('delete')}
            </button>
          }
        >
          <CustomerContext customer={customer} />
          <p>{t('balance')}</p>
          <Balance paisa={balance} />
          <p>
            {t('entries')}: {history.length}
          </p>
          <p>{t('deleteWarning')}</p>
          {error && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </Modal>
      )}
    </>
  );
}
