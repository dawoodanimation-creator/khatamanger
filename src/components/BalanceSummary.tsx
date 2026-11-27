import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { useUiPrefs } from '../state/UiPrefsContext';
import { formatMoney } from '../utils/numberFormat';

interface BalanceSummaryProps {
  outstanding: number;
  payable: number;
  hidden: boolean;
  onToggleHidden: () => void;
}

function useAnimatedAmount(target: number, disabled: boolean): number {
  const [display, setDisplay] = useState(target);

  useEffect(() => {
    if (disabled) {
      setDisplay(target);
      return;
    }
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reducedMotion || typeof requestAnimationFrame === 'undefined') {
      setDisplay(target);
      return;
    }

    const startVal = display;
    if (startVal === target) return;
    const duration = 350;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, disabled]);

  return disabled ? target : display;
}

export function BalanceSummary({ outstanding, payable, hidden, onToggleHidden }: BalanceSummaryProps) {
  const { t } = useI18n();
  const { prefs } = useUiPrefs();
  const animOutstanding = useAnimatedAmount(outstanding, hidden);
  const animPayable = useAnimatedAmount(payable, hidden);
  const outstandingText = hidden
    ? '••••••'
    : formatMoney(animOutstanding, t('currencyLabel'), prefs.numberFormat);
  const payableText = hidden
    ? '••••••'
    : formatMoney(animPayable, t('currencyLabel'), prefs.numberFormat);
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
