import { useState } from 'react';
import { Globe2, Moon, Lock, Check } from 'lucide-react';
import { Backup } from './Backup';
import { ReviewControls } from '../components/ReviewControls';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
export function Settings() {
  const { ledger, updateSettings } = useLedger();
  const { t } = useI18n();
  const settings = ledger.settings;
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  function savePin() {
    if (!/^\d{4}$/.test(pinValue)) {
      setPinError(t('enterPin'));
      return;
    }
    if (pinValue !== pinConfirm) {
      setPinError(t('pinMismatch'));
      return;
    }
    updateSettings({ pin: pinValue });
    setShowPinModal(false);
    setPinValue('');
    setPinConfirm('');
    setPinError('');
  }

  return <><Header title={t('settings')} backTo="/" /><div className="page-content settings-content">
    <section className="settings-card"><h2 className="flex items-center gap-3"><Globe2/>{t('language')}</h2>
      <div className="language-switch" role="group" aria-label={t('language')}>
        <button type="button" lang="en" dir="ltr" aria-pressed={settings.language === 'en'} onClick={() => updateSettings({ language: 'en' })}>{t('english')}</button>
        <button type="button" className="urdu-label" lang="ur" dir="rtl" aria-pressed={settings.language === 'ur'} onClick={() => updateSettings({ language: 'ur' })}>{t('urdu')}</button>
      </div>
    </section>
    <section className="settings-card">
      <div className="setting-row"><span className="flex items-center gap-3"><Moon/>{t('darkMode')}</span>
        <button type="button" className="toggle" role="switch" aria-checked={settings.darkMode} aria-label={t('darkMode')} onClick={() => updateSettings({ darkMode: !settings.darkMode })}><span /></button>
      </div>
      <div className="setting-row currency-row"><span>{t('currency')}</span><strong><bdi dir="ltr">{t('currencyLabel')}</bdi></strong></div>
    </section>
    <section className="settings-card">
      <div className="setting-row">
        <span className="flex items-center gap-3"><Lock aria-hidden="true"/>{t('pinLock')}</span>
        <button
          type="button"
          className="button button-secondary text-sm"
          style={{ width: 'auto', minHeight: '38px', padding: '4px 14px' }}
          onClick={() => { setShowPinModal(true); setPinValue(''); setPinConfirm(''); setPinError(''); }}
        >
          {settings.pin ? t('changePin') : t('setPin')}
        </button>
      </div>
      {settings.pin && (
        <div className="setting-row" style={{ marginTop: '12px' }}>
          <span className="muted-copy" style={{ padding: 0 }}>PIN: ••••</span>
          <button
            type="button"
            className="button button-danger text-sm"
            style={{ width: 'auto', minHeight: '38px', padding: '4px 14px' }}
            onClick={() => updateSettings({ pin: undefined })}
          >
            {t('removePin')}
          </button>
        </div>
      )}
      <p className="muted-copy" style={{ marginTop: '8px' }}>{t('pinLockHelp')}</p>
    </section>
    <Backup embedded/>
    <ReviewControls/>
    <p className="muted-copy">{t('offline')}</p>
    {showPinModal && (
      <Modal
        title={t('setPin')}
        onDismiss={() => setShowPinModal(false)}
        actions={
          <button type="button" className="button button-primary" onClick={savePin}>
            <Check aria-hidden="true"/> {t('save')}
          </button>
        }
      >
        <div style={{ display: 'grid', gap: '12px', marginTop: '12px' }}>
          <div className="form-field">
            <label htmlFor="input-pin">{t('enterPin')}</label>
            <input
              id="input-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              value={pinValue}
              onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            />
          </div>
          <div className="form-field">
            <label htmlFor="confirm-pin">{t('confirmPin')}</label>
            <input
              id="confirm-pin"
              type="password"
              inputMode="numeric"
              maxLength={4}
              pattern="\d{4}"
              value={pinConfirm}
              onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
              style={{ textAlign: 'center', fontSize: '24px', letterSpacing: '8px' }}
            />
          </div>
          {pinError && <p className="field-error" role="alert">{pinError}</p>}
        </div>
      </Modal>
    )}
  </div></>;
}
