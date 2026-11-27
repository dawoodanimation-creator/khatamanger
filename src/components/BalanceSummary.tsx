import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useI18n } from '../i18n';
import { useUiPrefs } from '../state/UiPrefsContext';
import { formatMoney } from '../utils/numberFormat';

interface BalanceSummaryProps {
  outstanding: number;
  payable: number;
  overdueCount?: number;
  hidden: boolean;
  onToggleHidden: () => void;
}

function useMountCountUp(target: number, disabled: boolean): number {
  const [display, setDisplay] = useState(target);
  const animatedOnce = useRef(false);

  useEffect(() => {
    if (disabled || animatedOnce.current) {
      setDisplay(target);
      return;
    }
    const reducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (reducedMotion || typeof requestAnimationFrame === 'undefined' || target === 0) {
      animatedOnce.current = true;
      setDisplay(target);
      return;
    }

    animatedOnce.current = true;
    const duration = 500;
    const startTime = performance.now();
    let rafId = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startTime) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [target, disabled]);

  return disabled ? target : display;
}

export function BalanceSummary({
  outstanding,
  payable,
  overdueCount = 0,
  hidden,
  onToggleHidden,
}: BalanceSummaryProps) {
  const { t, language } = useI18n();
  const { prefs } = useUiPrefs();
  const animOutstanding = useMountCountUp(outstanding, hidden);

  const finalOutstanding = hidden
    ? '••••••'
    : formatMoney(outstanding, t('currencyLabel'), prefs.numberFormat);
  const displayOutstanding = hidden
    ? '••••••'
    : formatMoney(animOutstanding, t('currencyLabel'), prefs.numberFormat);
  const payableText = hidden
    ? '••••••'
    : formatMoney(payable, t('currencyLabel'), prefs.numberFormat);

  const overdueLabel =
    language === 'ur' ? `${overdueCount} تاخیر` : `${overdueCount} overdue`;

  return (
    <section
      className="v3-hero-card v3-hero-khata v3-rise"
      style={{ '--rise-idx': 0 } as React.CSSProperties}
      aria-label={t('overview')}
    >
      <div className="v3-hero-top">
        <span className="v3-hero-label">{t('toReceive')}</span>
        <span className="sr-only">{t('outstanding')}</span>
        <button
          type="button"
          className="summary-eye-btn v3-hero-eye"
          aria-label={hidden ? t('showBalances') : t('hideBalances')}
          onClick={onToggleHidden}
        >
          {hidden ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </button>
      </div>

      <bdi
        dir="ltr"
        className="v3-hero-amount hero-receive-amount"
        aria-live="off"
        aria-label={finalOutstanding}
      >
        {displayOutstanding}
      </bdi>

      <div className="v3-hero-subline">
        <bdi dir="ltr">{payableText}</bdi> {t('toPay').toLowerCase()} · {overdueLabel}
      </div>
    </section>
  );
}
