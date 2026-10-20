import { Globe2, Moon } from 'lucide-react';
import { Backup } from './Backup';
import { ReviewControls } from '../components/ReviewControls';
import { Header } from '../components/Header';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
export function Settings() {
  const { ledger, updateSettings } = useLedger();
  const { t } = useI18n();
  const settings = ledger.settings;
  return <><Header title={t('settings')} backTo="/" /><div className="page-content settings-content">
    <section className="settings-card"><h2 className="flex items-center gap-3"><Globe2/>{t('language')}</h2>
      <div className="language-switch" role="group" aria-label={t('language')}>
        <button type="button" lang="en" dir="ltr" aria-pressed={settings.language === 'en'} onClick={() => updateSettings({ language: 'en' })}>{t('english')}</button>
        <button type="button" className="urdu-label" lang="ur" dir="rtl" aria-pressed={settings.language === 'ur'} onClick={() => updateSettings({ language: 'ur' })}>{t('urdu')}</button>
      </div>
    </section>
    <section className="settings-card"><div className="setting-row"><span className="flex items-center gap-3"><Moon/>{t('darkMode')}</span>
      <button type="button" className="toggle" role="switch" aria-checked={settings.darkMode} aria-label={t('darkMode')} onClick={() => updateSettings({ darkMode: !settings.darkMode })}><span /></button>
    </div><div className="setting-row currency-row"><span>{t('currency')}</span><strong><bdi dir="ltr">{t('currencyLabel')}</bdi></strong></div></section>
    <Backup embedded/>
    <ReviewControls/>
    <p className="muted-copy">{t('offline')}</p>
  </div></>;
}
