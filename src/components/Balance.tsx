import { ArrowDownLeft, ArrowUpRight, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { money } from '../utils/money';
export function Balance({ paisa }: { paisa: number }) {
  const { t } = useI18n();
  const Icon = paisa > 0 ? ArrowDownLeft : paisa < 0 ? ArrowUpRight : Check;
  return <div className={`balance ${paisa > 0 ? 'balance-owed' : paisa < 0 ? 'balance-payable' : 'balance-settled'}`}>
    <bdi className="balance-amount" dir="ltr">{money(paisa, t('currencyLabel'))}</bdi>
    <span className="balance-direction"><Icon aria-hidden="true"/>{t(paisa > 0 ? 'owesYou' : paisa < 0 ? 'youOwe' : 'settled')}</span>
  </div>;
}
