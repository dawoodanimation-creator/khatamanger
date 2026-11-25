import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { money } from '../utils/money';

interface BalanceSummaryProps {
  outstanding: number;
  payable: number;
  hidden: boolean;
  onToggleHidden: () => void;
}

export function BalanceSummary({ outstanding, payable, hidden, onToggleHidden }: BalanceSummaryProps) {
  const { t } = useI18n();
  const outstandingText = hidden ? '••••••' : money(outstanding, t('currencyLabel'));
  const payableText = hidden ? '••••••' : money(payable, t('currencyLabel'));
  const shouldStack = !hidden && (outstandingText.length >= 13 || payableText.length >= 13);

  return (
    <section className="outstanding-card summary-minimalist" aria-label={t('overview')}>
      <div className={`summary-columns ${shouldStack ? 'summary-columns-stacked' : ''}`}>
        {/* "You will get" (To receive) */}
        <div className="summary-col summary-receive">
          <div className="summary-col-header">
            <span className="summary-label">{t('toReceive')}</span>
            <span className="sr-only">{t('outstanding')}</span>
            {shouldStack && (
              <button
                type="button"
                className="summary-eye-btn"
                aria-label={hidden ? t('showBalances') : t('hideBalances')}
                onClick={onToggleHidden}
              >
                {hidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            )}
          </div>
          <bdi dir="ltr" className="summary-amount hero-receive-amount dominant amount-receive">
            {outstandingText}
          </bdi>
        </div>

        {/* "You will give" (To pay) */}
        <div className="summary-col summary-pay">
          <div className="summary-col-header">
            <span className="summary-label">{t('toPay')}</span>
            <span className="sr-only">{t('payable')}</span>
            {!shouldStack && (
              <button
                type="button"
                className="summary-eye-btn"
                aria-label={hidden ? t('showBalances') : t('hideBalances')}
                onClick={onToggleHidden}
              >
                {hidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
              </button>
            )}
          </div>
          <bdi dir="ltr" className="summary-amount hero-pay-amount amount-pay">
            {payableText}
          </bdi>
        </div>
      </div>
    </section>
  );
}
