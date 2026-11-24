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

  return (
    <section className="outstanding-card" aria-label={t('outstanding')}>
      <div className="hero-top flex items-center justify-between">
        <span className="hero-subtitle">{t('app')}</span>
        <button
          type="button"
          className="hero-icon"
          aria-label={hidden ? t('showBalances') : t('hideBalances')}
          onClick={onToggleHidden}
        >
          {hidden ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>

      <div className="hero-grid">
        <div className="hero-col hero-col-receive">
          <span className="hero-col-label">{t('outstanding')}</span>
          <bdi dir="ltr" className="hero-col-amount dominant">
            {hidden ? '••••••' : money(outstanding, t('currencyLabel'))}
          </bdi>
        </div>

        <div className="hero-divider" aria-hidden="true" />

        <div className="hero-col hero-col-pay">
          <span className="hero-col-label">{t('payable')}</span>
          <bdi dir="ltr" className="hero-col-amount">
            {hidden ? '••••••' : money(payable, t('currencyLabel'))}
          </bdi>
        </div>
      </div>
    </section>
  );
}
