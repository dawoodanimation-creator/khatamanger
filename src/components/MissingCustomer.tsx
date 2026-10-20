import { Link } from 'react-router';
import { Header } from './Header';
import { useI18n } from '../i18n';
export function MissingCustomer() {
  const { t } = useI18n();
  return <><Header title={t('customers')} backTo="/"/><div className="empty-state text-center"><p>{t('customerMissing')}</p><Link className="button button-secondary" to="/">{t('home')}</Link></div></>;
}
