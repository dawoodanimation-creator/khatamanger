import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { formatMoney } from '../utils/numberFormat';

interface BalanceProps {
  paisa: number;
  forceShow?: boolean;
  customerName?: string;
}

export function Balance({ paisa, forceShow, customerName }: BalanceProps) {
  const { t } = useI18n();
  const { ledger } = useLedger();
  const { prefs } = useUiPrefs();
  const hidden = !forceShow && !!ledger.settings.hideBalances;

  const isOwed = paisa > 0;
  const isPayable = paisa < 0;
  const isSettled = paisa === 0;

  const relationText = customerName && !isSettled
    ? t(isOwed ? 'owesYouNamed' : 'youOweNamed', { name: customerName })
    : t(isOwed ? 'owesYou' : isPayable ? 'youOwe' : 'settled');

  const baseRelationText = t(isOwed ? 'owesYou' : isPayable ? 'youOwe' : 'settled');

  const Icon = isOwed ? ArrowDownLeft : isPayable ? ArrowUpRight : Check;

  const statusClass = isOwed
    ? 'balance-owed'
    : isPayable
    ? 'balance-payable'
    : 'balance-settled';

  return (
    <div className={`balance ${statusClass}`}>
      <bdi className="balance-amount" dir="ltr">
        {hidden ? '••••••' : formatMoney(paisa, t('currencyLabel'), prefs.numberFormat)}
      </bdi>
      <span className="balance-direction">
        <Icon aria-hidden="true" />
        <span>{relationText}</span>
        {customerName && !isSettled && (
          <span className="sr-only">{baseRelationText}</span>
        )}
      </span>
    </div>
  );
}
