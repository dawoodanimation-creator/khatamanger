import { memo } from 'react';
import { Pin } from 'lucide-react';
import { Link } from 'react-router';
import type { Customer } from '../models/customer';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { formatMoney } from '../utils/numberFormat';
import { customerPath } from '../utils/routes';
import { getInitials } from '../utils/avatar';
import { formatRelativeActivity } from '../utils/activity';

interface CustomerCardProps {
  customer: Customer;
  balance: number;
  lastActivityDate?: string | null;
  isPinned?: boolean;
  overdueDueDate?: string | null;
}

export const CustomerCard = memo(function CustomerCard({
  customer,
  balance,
  lastActivityDate,
  isPinned = false,
  overdueDueDate = null,
}: CustomerCardProps) {
  const { t, language } = useI18n();
  const { ledger } = useLedger();
  const { prefs } = useUiPrefs();
  const hidden = !!ledger.settings.hideBalances;

  const initials = getInitials(customer.name);
  const isSettled = balance === 0;
  const isOwed = balance > 0;
  const isPayable = balance < 0;

  const balanceClass = isOwed
    ? 'balance-owed'
    : isPayable
    ? 'balance-payable'
    : 'balance-settled';

  const relationText = isOwed
    ? t('toReceive')
    : isPayable
    ? t('toPay')
    : t('settled');

  const relativeActivity = formatRelativeActivity(lastActivityDate, language, t);
  const subtext = relativeActivity || customer.phone;

  return (
    <div className={`customer-card customer-row-item ${isSettled ? 'customer-card-settled' : ''}`}>
      <Link
        to={customerPath(customer.id)}
        className="customer-card-main-link"
      >
        {/* Neutral Initials Avatar */}
        <div className="customer-avatar avatar-neutral" aria-hidden="true">
          {initials}
        </div>

        {/* Customer Identity */}
        <div className="customer-identity">
          <div className="customer-name-line">
            <strong className="customer-name" dir="auto">
              {customer.name}
            </strong>
            {isPinned && (
              <Pin size={12} className="customer-pin-icon" aria-label={t('pinned')} />
            )}
          </div>
          <span className="customer-meta-row" dir="auto">
            <span className="customer-subtext">{subtext}</span>
            {overdueDueDate && (
              <span className="overdue-pill-inline">
                {t('overdue')} · {overdueDueDate}
              </span>
            )}
          </span>
        </div>

        {/* Amount & Status */}
        <div className={`customer-balance-block ${balanceClass}`}>
          <bdi className="customer-balance-amount" dir="ltr">
            {hidden ? '••••••' : formatMoney(balance, t('currencyLabel'), prefs.numberFormat)}
          </bdi>
          <span className="customer-relation-label">{relationText}</span>
        </div>
      </Link>
    </div>
  );
});
