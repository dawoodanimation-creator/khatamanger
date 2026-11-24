import { memo } from 'react';
import { Link } from 'react-router';
import type { Customer } from '../models/customer';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { money } from '../utils/money';
import { customerPath } from '../utils/routes';
import { getInitials } from '../utils/avatar';
import { formatRelativeActivity } from '../utils/activity';

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
          <strong className="customer-name" dir="auto">
            {customer.name}
          </strong>
          <span className="customer-meta-row" dir="ltr">
            <span className="customer-subtext">{subtext}</span>
          </span>
        </div>

        {/* Amount & Status */}
        <div className={`customer-balance-block ${balanceClass}`}>
          <bdi className="customer-balance-amount" dir="ltr">
            {hidden ? '••••••' : money(balance, t('currencyLabel'))}
          </bdi>
          <span className="customer-relation-label">{relationText}</span>
        </div>
      </Link>
    </div>
  );
});
