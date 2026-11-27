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
import type { LedgerTransaction } from '../models/transaction';
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
import { buildCustomReminderLink, buildCustomReminderMessage } from '../utils/reminderTemplates';
import { statementWhatsAppLink } from '../utils/statementShare';
import { getAvatarPalette, getInitials } from '../utils/avatar';

export function CustomerDetail() {
  const { customerId } = useParams();
  const { ledger, deleteCustomer, deleteTransaction, addTransaction, writeError } = useLedger();
  const { prefs, togglePinCustomer } = useUiPrefs();
  const customer = ledger.customers.find(c => c.id === customerId);
  const { t, language, direction } = useI18n();
  const navigate = useNavigate();

  const [dialog, setDialog] = useState<'delete' | null>(null);
  const [txToDelete, setTxToDelete] = useState<LedgerTransaction | null>(null);
  const [deletedUndoTx, setDeletedUndoTx] = useState<LedgerTransaction | null>(null);
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const [showStatementSheet, setShowStatementSheet] = useState(false);
  const deleteSnapshot = useRef<Ledger>(ledger);
  const removing = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [selectedTxForSheet, setSelectedTxForSheet] = useState<LedgerTransaction | null>(null);
  const [txTouchStartX, setTxTouchStartX] = useState<number | null>(null);

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
  const waCustomer = customer.whatsappPhone
    ? { ...customer, phone: customer.whatsappPhone }
    : customer;
  const whatsapp = buildCustomReminderLink(
    waCustomer,
    balance,
    true,
    prefs.reminderTemplate,
    prefs.numberFormat,
    t('currencyLabel'),
    ledger.settings.profile
  );
  const sms = buildCustomReminderLink(
    customer,
    balance,
    false,
    prefs.reminderTemplate,
    prefs.numberFormat,
    t('currencyLabel'),
    ledger.settings.profile
  );
  const customReminderText = buildCustomReminderMessage(
    customer,
    balance,
    prefs.reminderTemplate,
    prefs.numberFormat,
    t('currencyLabel'),
    ledger.settings.profile
  );
  const chronologicalHistory = runningHistoryFor(ledger, customer.id);
  const statementWaHref = statementWhatsAppLink(
    waCustomer,
    chronologicalHistory,
    balance,
    t('currencyLabel'),
    prefs.numberFormat,
    language,
    ledger.settings.profile
  );

  const categoryLabels: Record<string, string> = {
    Regular: t('catRegular'),
    Wholesale: t('catWholesale'),
    Family: t('catFamily'),
    'Friend/Neighbour': t('catFriend'),
    Staff: t('catStaff'),
    Supplier: t('catSupplier'),
  };
  const categoryDisplay = customer.category
    ? categoryLabels[customer.category] ?? customer.category
    : null;
  const creditLimit = customer.creditLimitPaisa;
  const usedCredit = Math.max(0, balance);
  const limitRatio = creditLimit && creditLimit > 0 ? usedCredit / creditLimit : 0;
  const limitClass =
    creditLimit && usedCredit > creditLimit
      ? 'is-over'
      : limitRatio >= 0.8
        ? 'is-warning'
        : '';

  async function confirmDeleteTransaction() {
    if (!txToDelete || busy) return;
    setBusy(true);
    setError('');
    if (await deleteTransaction(txToDelete.id, customer!.id)) {
      setDeletedUndoTx(txToDelete);
      setTxToDelete(null);
    } else {
      setError(t(writeError()));
    }
    setBusy(false);
  }

  async function undoDeleteTransaction() {
    if (!deletedUndoTx || busy) return;
    setBusy(true);
    if (await addTransaction(deletedUndoTx, customer!)) {
      setDeletedUndoTx(null);
    } else {
      setError(t(writeError()));
    }
    setBusy(false);
  }

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
      onClick: () => setShowStatementSheet(true),
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
        backTo="/"
        actions={
          <div className="header-actions-group">
            <MoreMenu items={moreMenuItems} ariaLabel={t('more')} />
          </div>
        }
      />

      <div className="page-content detail-content v3-page-content">
        {/* White Hero Card */}
        <section className="v3-card customer-summary v3-rise" style={{ '--rise-idx': 0 } as React.CSSProperties}>
          <div className="customer-hero-top">
            {(() => {
              const pal = getAvatarPalette(customer.name, ledger.settings.darkMode);
              return (
                <div
                  className="customer-avatar v3-avatar-56"
                  style={{ backgroundColor: pal.bg, color: pal.fg }}
                  aria-hidden="true"
                >
                  {initials}
                </div>
              );
            })()}

            <div className="customer-hero-identity">
              <div className="flex items-center justify-between gap-2">
                <h1 className="customer-detail-name" dir="auto">
                  {customer.name}
                </h1>
                {categoryDisplay && (
                  <span className="customer-category-pill shrink-0">{categoryDisplay}</span>
                )}
              </div>
              <div className="customer-detail-phone-line">
                <span className="customer-phone" dir="ltr">
                  <bdi>{customer.phone}</bdi>
                </span>
              </div>
              {customer.address && (
                <span className="customer-address-text" dir="auto">
                  {customer.address}
                </span>
              )}
            </div>
          </div>

          <div className="detail-balance-block">
            <span className="detail-balance-label">{t('balance')}</span>
            <Balance paisa={balance} customerName={customer.name} />
            {creditLimit && creditLimit > 0 && (
              <div className="credit-limit-wrap">
                <div className={`credit-limit-header ${limitClass}`}>
                  <span>{t('creditLimit')}</span>
                  <bdi dir="ltr">
                    {t('creditLimitUsage', {
                      used: formatMoney(usedCredit, t('currencyLabel'), prefs.numberFormat),
                      limit: formatMoney(creditLimit, t('currencyLabel'), prefs.numberFormat),
                    })}
                  </bdi>
                </div>
                <div className="credit-limit-track" aria-hidden="true">
                  <div
                    className={`credit-limit-fill v3-bar-fill ${limitClass}`}
                    style={{ width: `${Math.min(100, Math.round(limitRatio * 100))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {customer.note && (
            <p className="customer-note customer-note-minimal">
              {customer.note}
            </p>
          )}
        </section>

        {/* 4 Circular Action Buttons: Call, WhatsApp, SMS, Remind */}
        {(() => {
          const grid = (
            <div className="v3-circle-actions-row v3-rise" style={{ '--rise-idx': 1 } as React.CSSProperties}>
              <a
                href={`tel:${customer.phone}`}
                className="v3-circle-action"
                aria-label={t('call')}
              >
                <span className="v3-circle-icon v3-tint-primary">
                  <Phone size={20} aria-hidden="true" />
                </span>
                <span className="v3-circle-label">{t('call')}</span>
              </a>

              {whatsapp ? (
                <a
                  className="v3-circle-action"
                  href={whatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={t('whatsapp')}
                >
                  <span className="v3-circle-icon v3-tint-green">
                    <MessageCircle size={20} aria-hidden="true" />
                  </span>
                  <span className="v3-circle-label">{t('whatsapp')}</span>
                </a>
              ) : (
                <button
                  className="v3-circle-action"
                  type="button"
                  onClick={() => setError(t('invalidWhatsApp'))}
                  aria-label={t('whatsapp')}
                >
                  <span className="v3-circle-icon v3-tint-green">
                    <MessageCircle size={20} aria-hidden="true" />
                  </span>
                  <span className="v3-circle-label">{t('whatsapp')}</span>
                </button>
              )}

              <a
                className="v3-circle-action"
                href={sms ?? `sms:${customer.phone}`}
                aria-label={t('sms')}
              >
                <span className="v3-circle-icon v3-tint-blue">
                  <MessageSquare size={20} aria-hidden="true" />
                </span>
                <span className="v3-circle-label">{t('sms')}</span>
              </a>

              {balance > 0 ? (
                <button
                  type="button"
                  className="v3-circle-action"
                  onClick={() => setShowReminderSheet(true)}
                >
                  <span className="v3-circle-icon v3-tint-amber">
                    <Send size={20} aria-hidden="true" />
                  </span>
                  <span className="v3-circle-label">{language === 'ur' ? 'یاد دہانی' : 'Remind'}</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="v3-circle-action"
                  onClick={() => setShowStatementSheet(true)}
                >
                  <span className="v3-circle-icon v3-tint-amber">
                    <FileText size={20} aria-hidden="true" />
                  </span>
                  <span className="v3-circle-label">{t('downloadStatement')}</span>
                </button>
              )}
            </div>
          );

          if (balance > 0) {
            return (
              <section className="reminder-section" aria-label={t('remind')}>
                {grid}
                <div className="sr-only reminder-message">{customReminderText}</div>
              </section>
            );
          }
          return grid;
        })()}

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

                <ol className="v3-list-card transaction-list">
                  {group.entries.map(({ transaction, balancePaisa }) => {
                    const isCredit = transaction.kind === 'credit';
                    const isExpanded = expandedItems.has(transaction.id);
                    const itemCount = transaction.items?.length || 0;
                    const metaSub = [
                      localDate(transaction.date, language),
                      transaction.category,
                      transaction.paymentMethod,
                    ]
                      .filter(Boolean)
                      .join(' · ');

                    return (
                      <li
                        className="v3-tx-row transaction-card"
                        key={transaction.id}
                        onTouchStart={e => setTxTouchStartX(e.touches[0]?.clientX ?? null)}
                        onTouchEnd={e => {
                          if (txTouchStartX === null) return;
                          const endX = e.changedTouches[0]?.clientX ?? txTouchStartX;
                          const delta = txTouchStartX - endX;
                          setTxTouchStartX(null);
                          if ((direction === 'ltr' && delta > 72) || (direction === 'rtl' && delta < -72)) {
                            void deleteTransaction(transaction.id, customer.id).then(ok => {
                              if (ok) setDeletedUndoTx(transaction);
                            });
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="v3-tx-row-btn"
                          onClick={() => setSelectedTxForSheet(transaction)}
                        >
                          <span
                            className={`entry-icon ${
                              isCredit ? 'entry-credit' : 'entry-payment'
                            }`}
                            aria-hidden="true"
                          >
                            {isCredit ? (
                              <ArrowUpRight size={18} />
                            ) : (
                              <ArrowDownLeft size={18} />
                            )}
                          </span>

                          <div className="entry-title-col">
                            <strong className="entry-type-title">
                              {t(isCredit ? 'credit' : 'payment')}
                            </strong>
                            <span className="entry-date-text">{metaSub}</span>
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
                        </button>

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

      {/* Sticky 80px Bottom Action Bar */}
      <div className="transaction-actions side-by-side v3-sticky-bar-80">
        <Link
          className="button button-primary v3-btn-52"
          to={customerPath(customer.id, 'credit')}
        >
          <Plus size={18} aria-hidden="true" />
          <span>{t('credit')}</span>
        </Link>
        <Link
          className="button v3-btn-tonal v3-btn-52"
          to={customerPath(customer.id, 'payment')}
        >
          <Banknote size={18} aria-hidden="true" />
          <span>{t('payment')}</span>
        </Link>
      </div>

      {/* Transaction Row Action Sheet */}
      {selectedTxForSheet && (
        <BottomSheet
          title={t(selectedTxForSheet.kind === 'credit' ? 'credit' : 'payment')}
          onDismiss={() => setSelectedTxForSheet(null)}
          actions={
            <button
              type="button"
              className="button button-danger"
              style={{ width: '100%' }}
              onClick={() => {
                const tx = selectedTxForSheet;
                setSelectedTxForSheet(null);
                setTxToDelete(tx);
              }}
            >
              <Trash2 size={16} aria-hidden="true" />
              <span>{t('deleteEntryLabel')}</span>
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingBottom: '8px' }}>
            <strong style={{ fontSize: '20px' }}>
              <bdi dir="ltr">
                {formatMoney(selectedTxForSheet.amountPaisa, t('currencyLabel'), prefs.numberFormat)}
              </bdi>
            </strong>
            <span className="text-sm text-muted">
              {localDate(selectedTxForSheet.date, language)}
              {selectedTxForSheet.category ? ` · ${selectedTxForSheet.category}` : ''}
              {selectedTxForSheet.paymentMethod ? ` · ${selectedTxForSheet.paymentMethod}` : ''}
            </span>
            {selectedTxForSheet.note && <p className="text-sm">{selectedTxForSheet.note}</p>}
          </div>
        </BottomSheet>
      )}

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
            <div className="reminder-message-box" dir="auto">
              {customReminderText}
            </div>
          </div>
        </BottomSheet>
      )}

      {/* Statement Share / Print Bottom Sheet */}
      {showStatementSheet && (
        <BottomSheet
          title={t('statementTitle')}
          onDismiss={() => setShowStatementSheet(false)}
          actions={
            <div className="reminder-sheet-actions">
              <a
                className="button button-primary"
                href={statementWaHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowStatementSheet(false)}
              >
                <MessageCircle size={18} aria-hidden="true" />
                <span>{t('shareWhatsApp')}</span>
              </a>
              <button
                type="button"
                className="button button-secondary"
                onClick={() => {
                  setShowStatementSheet(false);
                  setTimeout(() => window.print(), 100);
                }}
              >
                <FileText size={18} aria-hidden="true" />
                <span>{t('savePdf')}</span>
              </button>
            </div>
          }
        >
          <p className="text-sm text-muted">
            {customer.name} · {formatMoney(balance, t('currencyLabel'), prefs.numberFormat)} ({chronologicalHistory.length} {t('entries')})
          </p>
        </BottomSheet>
      )}

      {/* Undo Deleted Transaction Snackbar */}
      {deletedUndoTx && (
        <div className="undo-snackbar" role="status">
          <span>{t('entryDeleted')}</span>
          <button
            type="button"
            className="undo-snackbar-btn"
            disabled={busy}
            onClick={() => void undoDeleteTransaction()}
          >
            {t('undo')}
          </button>
        </div>
      )}

      {/* Single Transaction Delete Modal */}
      {txToDelete && (
        <Modal
          title={t('deleteEntryTitle')}
          onDismiss={() => setTxToDelete(null)}
          actions={
            <button
              className="button button-danger"
              type="button"
              disabled={busy}
              onClick={() => void confirmDeleteTransaction()}
            >
              <Trash2 size={16} aria-hidden="true" />
              {t('delete')}
            </button>
          }
        >
          <p>
            {t(txToDelete.kind === 'credit' ? 'credit' : 'payment')} ·{' '}
            <bdi dir="ltr">
              {formatMoney(txToDelete.amountPaisa, t('currencyLabel'), prefs.numberFormat)}
            </bdi>
          </p>
          <p>{t('deleteEntryWarning')}</p>
        </Modal>
      )}

      {/* Clean Black-on-White Print Statement (visible only in @media print) */}
      <section id="statement-print-root" className="print-statement-only" aria-hidden="true">
        <div className="print-header">
          <h1>{language === 'ur' ? 'کھاتہ اسٹیٹمنٹ' : 'Account Statement'}</h1>
          <p>{localDate(new Date().toISOString().slice(0, 10), language)}</p>
        </div>
        <div className="print-customer-meta">
          <div>
            <strong>{customer.name}</strong> ({customer.phone})
          </div>
          <div>
            {t('dateRange')}:{' '}
            {chronologicalHistory.length > 0
              ? `${localDate(chronologicalHistory[0].transaction.date, language)} – ${localDate(
                  chronologicalHistory[chronologicalHistory.length - 1].transaction.date,
                  language
                )}`
              : '—'}
          </div>
        </div>
        <table className="print-table">
          <thead>
            <tr>
              <th>{t('date')}</th>
              <th>{t('entries')}</th>
              <th>{t('amount')}</th>
              <th>{t('balance')}</th>
            </tr>
          </thead>
          <tbody>
            {chronologicalHistory.map(({ transaction, balancePaisa }) => (
              <tr key={transaction.id}>
                <td>{localDate(transaction.date, language)}</td>
                <td>
                  {t(transaction.kind === 'credit' ? 'credit' : 'payment')}
                  {transaction.note ? ` — ${transaction.note}` : ''}
                </td>
                <td>
                  {transaction.kind === 'credit' ? '+' : '−'}{' '}
                  {formatMoney(transaction.amountPaisa, t('currencyLabel'), prefs.numberFormat)}
                </td>
                <td>{formatMoney(balancePaisa, t('currencyLabel'), prefs.numberFormat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="print-footer-balance">
          <strong>
            {t('balance')}: {formatMoney(balance, t('currencyLabel'), prefs.numberFormat)}
          </strong>
        </div>
      </section>

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
