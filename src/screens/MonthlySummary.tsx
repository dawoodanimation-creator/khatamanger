import { Link } from 'react-router';
import { Header } from '../components/Header';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { computeMonthlySummary, type MonthTotals } from '../utils/monthlySummary';
import { formatMoney } from '../utils/numberFormat';
import { customerPath } from '../utils/routes';

function formatMonthHeading(monthKey: string, language: 'en' | 'ur'): string {
  const [y, m] = monthKey.split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Intl.DateTimeFormat(language === 'ur' ? 'ur-PK' : 'en-US', {
    month: 'long',
    year: 'numeric',
  }).format(new Date(y, m - 1, 1));
}

function MonthCard({
  title,
  data,
  hidden,
  numberFormat,
  currencyLabel,
  language,
  t,
}: {
  title: string;
  data: MonthTotals;
  hidden: boolean;
  numberFormat: 'pk' | 'intl';
  currencyLabel: string;
  language: 'en' | 'ur';
  t: (key: any) => string;
}) {
  const maxVal = Math.max(data.creditPaisa, data.paymentPaisa, 1);
  const creditPct = Math.round((data.creditPaisa / maxVal) * 100);
  const paymentPct = Math.round((data.paymentPaisa / maxVal) * 100);
  const hasAny = data.creditPaisa > 0 || data.paymentPaisa > 0;

  return (
    <section className="settings-group">
      <h2 className="settings-group-title">
        {title} · {formatMonthHeading(data.monthKey, language)}
      </h2>
      <div className="settings-group-card settings-group-card-padded monthly-card">
        {!hasAny ? (
          <p className="text-sm text-muted">{t('noMonthlyData')}</p>
        ) : (
          <>
            <div className="monthly-bar-row">
              <div className="monthly-bar-header">
                <span className="text-sm">{t('totalGiven')}</span>
                <bdi dir="ltr" className="font-semibold balance-owed">
                  {hidden ? '••••••' : formatMoney(data.creditPaisa, currencyLabel, numberFormat)}
                </bdi>
              </div>
              <div className="monthly-bar-track">
                <div className="monthly-bar-fill monthly-bar-credit" style={{ width: `${creditPct}%` }} />
              </div>
            </div>

            <div className="monthly-bar-row">
              <div className="monthly-bar-header">
                <span className="text-sm">{t('totalReceived')}</span>
                <bdi dir="ltr" className="font-semibold balance-payable">
                  {hidden ? '••••••' : formatMoney(data.paymentPaisa, currencyLabel, numberFormat)}
                </bdi>
              </div>
              <div className="monthly-bar-track">
                <div className="monthly-bar-fill monthly-bar-payment" style={{ width: `${paymentPct}%` }} />
              </div>
            </div>

            <div className="monthly-net-row">
              <span className="text-sm text-muted">{t('netBalance')}</span>
              <bdi dir="ltr" className="font-bold">
                {hidden
                  ? '••••••'
                  : `${data.netPaisa < 0 ? '− ' : ''}${formatMoney(
                      Math.abs(data.netPaisa),
                      currencyLabel,
                      numberFormat
                    )}`}
              </bdi>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function MonthlySummary() {
  const { ledger } = useLedger();
  const { prefs } = useUiPrefs();
  const { t, language } = useI18n();
  const hidden = !!ledger.settings.hideBalances;
  const summary = computeMonthlySummary(ledger);

  return (
    <>
      <Header title={t('monthlySummary')} backTo="/" />

      <div className="page-content settings-content">
        <MonthCard
          title={t('thisMonth')}
          data={summary.thisMonth}
          hidden={hidden}
          numberFormat={prefs.numberFormat}
          currencyLabel={t('currencyLabel')}
          language={language}
          t={t}
        />

        <MonthCard
          title={t('lastMonth')}
          data={summary.lastMonth}
          hidden={hidden}
          numberFormat={prefs.numberFormat}
          currencyLabel={t('currencyLabel')}
          language={language}
          t={t}
        />

        <section className="settings-group">
          <h2 className="settings-group-title">{t('topCustomers')}</h2>
          <div className="settings-group-card">
            {summary.topCustomers.length === 0 ? (
              <div className="setting-row">
                <span className="text-sm text-muted">{t('noMonthlyData')}</span>
              </div>
            ) : (
              summary.topCustomers.map(({ customer, balancePaisa }) => (
                <Link
                  key={customer.id}
                  to={customerPath(customer.id)}
                  className="setting-row top-customer-link"
                >
                  <span className="font-medium truncate" dir="auto">
                    {customer.name}
                  </span>
                  <bdi dir="ltr" className="font-semibold balance-owed">
                    {hidden
                      ? '••••••'
                      : formatMoney(balancePaisa, t('currencyLabel'), prefs.numberFormat)}
                  </bdi>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </>
  );
}
