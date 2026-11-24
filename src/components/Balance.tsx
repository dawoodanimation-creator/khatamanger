import { Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { money } from '../utils/money';

interface BalanceProps {
  paisa: number;
  forceShow?: boolean;
}

export function Balance({ paisa, forceShow }: BalanceProps) {
  const { t } = useI18n();
  const { ledger } = useLedger();
  const hidden = !forceShow && !!ledger.settings.hideBalances;

  const isOwed = paisa > 0;
  const isPayable = paisa < 0;
  const isSettled = paisa === 0;

  const label = t(isOwed ? 'owesYou' : isPayable ? 'youOwe' : 'settled');

  const statusClass = isOwed
    ? 'balance-owed'
    : isPayable
    ? 'balance-payable'
    : 'balance-settled';

  return (
    <div className={`balance ${statusClass}`}>
      <bdi className="balance-amount" dir="ltr">
        {hidden ? '••••••' : money(paisa, t('currencyLabel'))}
      </bdi>
      <span className="balance-direction">
        {isSettled && <Check aria-hidden="true" />}
        <span>{label}</span>
      </span>
    </div>
  );
}
