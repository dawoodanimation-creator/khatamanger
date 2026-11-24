import { memo, type MouseEvent } from 'react';
import { Link } from 'react-router';
import { Phone, MessageCircle, ChevronRight, Clock } from 'lucide-react';
import type { Customer } from '../models/customer';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { money } from '../utils/money';
import { customerPath } from '../utils/routes';
import { getInitials, getAvatarColorIndex } from '../utils/avatar';
import { formatRelativeActivity } from '../utils/activity';
import { reminderLink } from '../utils/reminders';

interface CustomerCardProps {
  customer: Customer;
  balance: number;
  lastActivityDate?: string | null;
}

export const CustomerCard = memo(function CustomerCard({
  customer,
  balance,
  lastActivityDate,
}: CustomerCardProps) {
  const { t, language } = useI18n();
  const { ledger } = useLedger();
  const hidden = !!ledger.settings.hideBalances;

  const initials = getInitials(customer.name);
  const colorIndex = getAvatarColorIndex(customer.name);
  const isSettled = balance === 0;
  const isOwed = balance > 0;
  const isPayable = balance < 0;

  const balanceClass = isOwed
    ? 'balance-owed'
    : isPayable
    ? 'balance-payable'
    : 'balance-settled';

  const relationText = isOwed
    ? t('owesYouNamed', { name: customer.name })
    : isPayable
    ? t('youOweNamed', { name: customer.name })
    : t('settled');

  const relativeActivity = formatRelativeActivity(lastActivityDate, language, t);
  const whatsappHref = reminderLink(customer, balance, true);

  function handleCall(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    window.location.href = `tel:${customer.phone}`;
  }

  function handleWhatsApp(e: MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (whatsappHref) {
      window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    }
  }

  return (
    <div className={`customer-card ${isSettled ? 'customer-card-settled' : ''}`}>
      <Link
        to={customerPath(customer.id)}
        className="customer-card-main-link"
        aria-label={`${customer.name}, ${relationText}, ${isSettled ? '0' : money(balance, t('currencyLabel'))}`}
      >
        {/* Initials Avatar */}
        <div
          className={`customer-avatar avatar-color-${colorIndex}`}
          aria-hidden="true"
        >
          {initials}
        </div>

        {/* Customer Identity */}
        <div className="customer-identity">
          <div className="customer-name-row">
            <strong className="customer-name" dir="auto">
              {customer.name}
            </strong>
          </div>

          <div className="customer-meta-row">
            <span className="customer-phone" dir="ltr">
              <bdi>{customer.phone}</bdi>
            </span>
            <span className="customer-meta-bullet" aria-hidden="true">•</span>
            <span className="customer-activity" title={t('lastActivity')}>
              <Clock aria-hidden="true" className="meta-icon" />
              <span>{relativeActivity}</span>
            </span>
          </div>
        </div>

        {/* Amount & Status */}
        <div className={`customer-balance-block ${balanceClass}`}>
          <bdi className="customer-balance-amount" dir="ltr">
            {hidden ? '••••••' : money(balance, t('currencyLabel'))}
          </bdi>
          <span className="customer-relation-label">{relationText}</span>
        </div>

        <ChevronRight aria-hidden="true" className="forward-icon" />
      </Link>

      {/* Quick Actions (Call & WhatsApp) - stopPropagation keeps card tap clean */}
      <div className="customer-quick-actions">
        <button
          type="button"
          className="quick-action-btn"
          aria-label={t('call')}
          title={t('call')}
          onClick={handleCall}
        >
          <Phone aria-hidden="true" />
        </button>

        {isOwed && whatsappHref && (
          <button
            type="button"
            className="quick-action-btn quick-action-wa"
            aria-label={t('whatsapp')}
            title={t('whatsapp')}
            onClick={handleWhatsApp}
          >
            <MessageCircle aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
});
