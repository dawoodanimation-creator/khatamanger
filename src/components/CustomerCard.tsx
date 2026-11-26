import { memo, useRef, useState, type TouchEvent } from 'react';
import { MessageCircle, Phone, Pin } from 'lucide-react';
import { Link } from 'react-router';
import type { Customer } from '../models/customer';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { formatMoney } from '../utils/numberFormat';
import { whatsAppPhone } from '../utils/reminders';
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
  const { t, language, direction } = useI18n();
  const { ledger } = useLedger();
  const { prefs } = useUiPrefs();
  const hidden = !!ledger.settings.hideBalances;

  const [revealed, setRevealed] = useState(false);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const longPressTimer = useRef<number | null>(null);

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
  const waNum = whatsAppPhone(customer.phone);
  const isRtl = direction === 'rtl';

  function clearTimer() {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }

  function onTouchStart(e: TouchEvent<HTMLDivElement>) {
    const pt = e.touches[0];
    touchStart.current = { x: pt.clientX, y: pt.clientY };
    clearTimer();
    longPressTimer.current = window.setTimeout(() => {
      setRevealed(true);
    }, 500);
  }

  function onTouchMove(e: TouchEvent<HTMLDivElement>) {
    if (!touchStart.current) return;
    const pt = e.touches[0];
    const dx = pt.clientX - touchStart.current.x;
    const dy = pt.clientY - touchStart.current.y;
    if (Math.abs(dy) > 12 || Math.abs(dx) > 12) clearTimer();
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      const shouldOpen = isRtl ? dx > 0 : dx < 0;
      setRevealed(shouldOpen);
      touchStart.current = null;
    }
  }

  function onTouchEnd() {
    clearTimer();
    touchStart.current = null;
  }

  return (
    <div
      className={`customer-card customer-row-item ${isSettled ? 'customer-card-settled' : ''} ${
        revealed ? 'swipe-revealed' : ''
      }`}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Link
        to={customerPath(customer.id)}
        className="customer-card-main-link"
        onClick={e => {
          if (revealed) {
            e.preventDefault();
            setRevealed(false);
          }
        }}
      >
        <div className="customer-avatar avatar-neutral" aria-hidden="true">
          {initials}
        </div>

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

        <div className={`customer-balance-block ${balanceClass}`}>
          <bdi className="customer-balance-amount" dir="ltr">
            {hidden ? '••••••' : formatMoney(balance, t('currencyLabel'), prefs.numberFormat)}
          </bdi>
          <span className="customer-relation-label">{relationText}</span>
        </div>
      </Link>

      {revealed && (
        <div className="swipe-actions-tray">
          <a
            href={`tel:${customer.phone}`}
            className="swipe-action-btn swipe-action-call"
            aria-label={`${t('call')} ${customer.name}`}
          >
            <Phone size={16} aria-hidden="true" />
          </a>
          {waNum && (
            <a
              href={`https://wa.me/${waNum}`}
              target="_blank"
              rel="noopener noreferrer"
              className="swipe-action-btn swipe-action-wa"
              aria-label={`${t('whatsapp')} ${customer.name}`}
            >
              <MessageCircle size={16} aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
});
