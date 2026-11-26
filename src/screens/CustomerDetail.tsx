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
  Send,
  Pin,
  PinOff,
} from 'lucide-react';
import type { Ledger } from '../models/ledger';
import { CustomerContext } from '../components/CustomerContext';
import { Header } from '../components/Header';
import { Balance } from '../components/Balance';
import { MissingCustomer } from '../components/MissingCustomer';
import { Modal } from '../components/Modal';
import { BottomSheet } from '../components/BottomSheet';
import { MoreMenu } from '../components/MoreMenu';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { balanceFor, runningHistoryFor } from '../utils/balance';
import { formatMoney } from '../utils/numberFormat';
import { calculateCustomerOverdue } from '../utils/overdue';
import { localDate, monthYearLabel } from '../utils/dates';
import { customerPath } from '../utils/routes';
import { reminderMessage, reminderLink } from '../utils/reminders';
import { printCustomerStatement } from '../utils/statement';
import { getInitials } from '../utils/avatar';

export function CustomerDetail() {
  const { customerId } = useParams();
  const { ledger, deleteCustomer, writeError } = useLedger();
  const { prefs, togglePinCustomer } = useUiPrefs();
  const customer = ledger.customers.find(c => c.id === customerId);
  const { t, language } = useI18n();
  const navigate = useNavigate();

  const [dialog, setDialog] = useState<'delete' | null>(null);
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const deleteSnapshot = useRef<Ledger>(ledger);
  const removing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const balance = customer ? balanceFor(ledger, customer.id) : 0;
  const history = useMemo(
    () => (customer ? runningHistoryFor(ledger, customer.id).reverse() : []),
    [ledger, customer]
  );

  const overdueResult = useMemo(
    () => calculateCustomerOverdue(history.map(h => h.transaction)),
    [history]
  );
  const isPinned = customer ? prefs.pinnedCustomerIds.includes(customer.id) : false;

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
  const whatsapp = reminderLink(customer, balance, true);
  const sms = reminderLink(customer, balance, false);

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

  const moreMenuItems = [
    {
      label: t(isPinned ? 'unpinCustomer' : 'pinCustomer'),
      icon: isPinned ? <PinOff size={16} /> : <Pin size={16} />,
      onClick: () => togglePinCustomer(customer.id),
    },
    {
      label: t('edit'),
      icon: <Edit3 size={16} />,
      to: customerPath(customer.id, 'edit'),
    },
    {
      label: t('downloadStatement'),
      icon: <FileText size={16} />,
      onClick: () =>
        printCustomerStatement(
          customer,
          runningHistoryFor(ledger, customer.id),
          balance,
          t('currencyLabel'),
          language === 'ur'
        ),
    },
    {
      label: t('delete'),
      icon: <Trash2 size={16} />,
      danger: true,
      onClick: () => openDialog('delete'),
    },
  ];

  return (
    <>
      <Header
        title={customer.name}
        backTo="/"
        actions={
          <div className="header-actions-group">
            <MoreMenu items={moreMenuItems} ariaLabel={t('more')} />
          </div>
        }
      />

      <div className="page-content detail-content">
        {/* Top Block: Calm, spacious, no bordered card */}
        <section className="customer-detail-hero customer-summary">
          <div className="customer-hero-top">
            <div className="customer-avatar avatar-neutral" aria-hidden="true">
              {initials}
            </div>

            <div className="customer-hero-identity">
              <strong className="customer-detail-name" dir="auto">
                {customer.name}
              </strong>
              <div className="customer-detail-phone-line">
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

          <div className="detail-balance-block">
            <span className="detail-balance-label">{t('balance')}</span>
            <Balance paisa={balance} customerName={customer.name} />
          </div>

          {customer.note && (
            <p className="customer-note customer-note-minimal">
              {customer.note}
            </p>
          )}

          {/* Quick Actions Row (Call, WhatsApp, SMS) */}
          <div className="customer-hero-actions-row">
            {balance > 0 && (
              <section className="reminder-section" aria-label={t('remind')}>
                <div className="customer-hero-actions-group">
                  {whatsapp ? (
                    <a
                      className="action-pill-btn action-pill-whatsapp"
                      href={whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('whatsapp')}
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      <span>{t('whatsapp')}</span>
                    </a>
                  ) : (
                    <button
                      className="action-pill-btn action-pill-whatsapp"
                      type="button"
                      onClick={() => setError(t('invalidWhatsApp'))}
                      aria-label={t('whatsapp')}
                    >
                      <MessageCircle size={16} aria-hidden="true" />
                      <span>{t('whatsapp')}</span>
                    </button>
                  )}

                  {sms && (
                    <a
                      className="action-pill-btn action-pill-sms"
                      href={sms}
                      aria-label={t('sms')}
                    >
                      <MessageSquare size={16} aria-hidden="true" />
                      <span>{t('sms')}</span>
                    </a>
                  )}

                  <button
                    type="button"
                    className="action-pill-btn action-pill-reminder"
                    onClick={() => setShowReminderSheet(true)}
                    aria-label={t('remind')}
                  >
                    <Send size={15} aria-hidden="true" />
                    <span>{language === 'ur' ? 'یاد دہانی' : 'Remind'}</span>
                  </button>
                </div>

                <div className="sr-only reminder-message">
                  {reminderMessage(customer, balance)}
                </div>
              </section>
            )}
          </div>
        </section>

        {/* Transaction History Section */}
        <div className="section-heading history-heading flex items-center justify-between">
          <h2>{t('history')}</h2>
          <span className="count-text">{history.length}</span>
        </div>

        {/* Empty History State */}
        {history.length === 0 ? (
          <div className="empty-state text-center">
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
                <div className="month-label-row">
                  <span className="month-label-text">{group.label}</span>
                </div>

                <ol className="transaction-list">
                  {group.entries.map(({ transaction, balancePaisa }) => {
                    const isCredit = transaction.kind === 'credit';
                    const isExpanded = expandedItems.has(transaction.id);
                    const itemCount = transaction.items?.length || 0;

                    return (
                      <li className="transaction-row-item transaction-card" key={transaction.id}>
                        <div className="transaction-main-row">
                          <span
                            className={`entry-icon ${
                              isCredit ? 'entry-credit' : 'entry-payment'
                            }`}
                            aria-hidden="true"
                          >
                            {isCredit ? (
                              <ArrowUpRight size={17} />
                            ) : (
                              <ArrowDownLeft size={17} />
                            )}
                          </span>

                          <div className="entry-title-col">
                            <strong className="entry-type-title">
                              {t(isCredit ? 'credit' : 'payment')}
                            </strong>
                            <time dateTime={transaction.date} className="entry-date-text">
                              {localDate(transaction.date, language)}
                            </time>
                            {overdueResult.overdueCredits.has(transaction.id) && (
                              <span className="overdue-pill-inline">
                                {t('overdue')} · {overdueResult.overdueCredits.get(transaction.id)!.dueDate}
                              </span>
                            )}
                          </div>

                          <div className="entry-amount-col">
                            <bdi
                              dir="ltr"
                              className={`entry-amount ${
                                isCredit ? 'balance-owed' : 'balance-payable'
                              }`}
                            >
                              {isCredit ? '+' : '−'}{' '}
                              {formatMoney(transaction.amountPaisa, t('currencyLabel'), prefs.numberFormat)}
                            </bdi>
                            <div className="running-balance-quiet">
                              <span>{t('running')}:</span>{' '}
                              <bdi dir="ltr" className="running-amount">
                                {formatMoney(balancePaisa, t('currencyLabel'), prefs.numberFormat)}
                              </bdi>
                            </div>
                          </div>
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
                                          {formatMoney(item.pricePaisa, t('currencyLabel'), prefs.numberFormat)}
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
                      </li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (Equal width, 56px, aligned with page margins) */}
      <div className="transaction-actions side-by-side">
        <Link
          className="button button-primary btn-udhaar-primary"
          to={customerPath(customer.id, 'credit')}
        >
          <Plus size={18} aria-hidden="true" />
          <span>{t('credit')}</span>
        </Link>
        <Link
          className="button button-secondary btn-payment-outline"
          to={customerPath(customer.id, 'payment')}
        >
          <Banknote size={18} aria-hidden="true" />
          <span>{t('payment')}</span>
        </Link>
      </div>

      {/* Reminder Message Bottom Sheet */}
      {showReminderSheet && (
        <BottomSheet
          title={t('remind')}
          onDismiss={() => setShowReminderSheet(false)}
          actions={
            <div className="reminder-sheet-actions">
              {whatsapp && (
                <a
                  className="button button-primary"
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setShowReminderSheet(false)}
                >
                  <MessageCircle size={18} aria-hidden="true" />
                  <span>{t('whatsapp')}</span>
                </a>
              )}
              {sms && (
                <a
                  className="button button-secondary"
                  href={sms}
                  onClick={() => setShowReminderSheet(false)}
                >
                  <MessageSquare size={18} aria-hidden="true" />
                  <span>{t('sms')}</span>
                </a>
              )}
            </div>
          }
        >
          <div className="reminder-sheet-content">
            <p className="reminder-sheet-preview-label">{t('reminderHelp')}</p>
            <div className="reminder-message-box" dir="ltr">
              {reminderMessage(customer, balance)}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Delete Confirmation Modal (Existing modal preserved) */}
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
