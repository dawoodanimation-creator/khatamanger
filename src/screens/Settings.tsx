import { useState } from 'react';
import {
  Globe2,
  Moon,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  FlaskConical,
  KeyRound,
  BarChart3,
  Tag,
  UserCircle2
} from 'lucide-react';
import { formatPakistaniPhoneInput } from '../utils/phone';
import { Link } from 'react-router';
import { Backup } from './Backup';
import { ReviewControls } from '../components/ReviewControls';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { REMINDER_PRESETS } from '../utils/reminderTemplates';

declare const __COMMIT_HASH__: string;

export function Settings() {
  const { ledger, updateSettings } = useLedger();
  const { prefs, setNumberFormat, setReminderTemplate } = useUiPrefs();
  const { t } = useI18n();
  const settings = ledger.settings;

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');
  const [devOpen, setDevOpen] = useState(
    typeof navigator !== 'undefined' && navigator.webdriver === true
  );

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

  const pinActive = !!settings.pin;

  return (
    <>
      <Header title={t('settings')} backTo="/" />

      <div className="page-content settings-content settings-with-nav">
        {/* Section 1: Profile */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('profileSection')}</h2>
          <div className="settings-group-card settings-group-card-padded" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="flex items-center gap-2 text-sm text-muted">
              <UserCircle2 size={18} aria-hidden="true" />
              <span>{t('onboardingProfileStep')}</span>
            </div>
            <div className="form-field">
              <label htmlFor="profile-shop">{t('shopName')}</label>
              <input
                id="profile-shop"
                className="form-control-input"
                value={settings.profile?.shopName ?? ''}
                onChange={e =>
                  updateSettings({
                    profile: { ...settings.profile, shopName: e.target.value },
                  })
                }
                maxLength={100}
                dir="auto"
                placeholder={t('shopName')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="profile-owner">{t('ownerName')}</label>
              <input
                id="profile-owner"
                className="form-control-input"
                value={settings.profile?.ownerName ?? ''}
                onChange={e =>
                  updateSettings({
                    profile: { ...settings.profile, ownerName: e.target.value },
                  })
                }
                maxLength={100}
                dir="auto"
                placeholder={t('ownerName')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="profile-phone">{t('phone')}</label>
              <input
                id="profile-phone"
                className="form-control-input"
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={settings.profile?.phone ?? ''}
                onChange={e =>
                  updateSettings({
                    profile: {
                      ...settings.profile,
                      phone: formatPakistaniPhoneInput(e.target.value),
                    },
                  })
                }
                placeholder="03XX-XXXXXXX"
              />
            </div>
          </div>
        </section>

        {/* Section 2: Appearance */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('appearance')}</h2>
          <div className="settings-group-card">
            {/* Language Switch */}
            <div className="setting-row">
              <span className="setting-label flex items-center gap-2">
                <Globe2 size={18} className="text-muted" aria-hidden="true" />
                <span>{t('language')}</span>
              </span>

              <div className="language-switch" role="group" aria-label={t('language')}>
                <button
                  type="button"
                  lang="en"
                  dir="ltr"
                  aria-pressed={settings.language === 'en'}
                  onClick={() => updateSettings({ language: 'en' })}
                >
                  {t('english')}
                </button>
                <button
                  type="button"
                  className="urdu-label"
                  lang="ur"
                  dir="rtl"
                  aria-pressed={settings.language === 'ur'}
                  onClick={() => updateSettings({ language: 'ur' })}
                >
                  {t('urdu')}
                </button>
              </div>
            </div>

            {/* Dark Mode */}
            <div className="setting-row">
              <span className="setting-label flex items-center gap-2">
                <Moon size={18} className="text-muted" aria-hidden="true" />
                <span>{t('darkMode')}</span>
              </span>

              <button
                type="button"
                className="toggle"
                role="switch"
                aria-checked={settings.darkMode}
                aria-label={t('darkMode')}
                onClick={() => updateSettings({ darkMode: !settings.darkMode })}
              >
                <span />
              </button>
            </div>

            {/* Number Format */}
            <div className="setting-row flex-wrap">
              <span className="setting-label flex items-center gap-2">
                <span>{t('numberFormat')}</span>
              </span>

              <div className="language-switch" role="group" aria-label={t('numberFormat')}>
                <button
                  type="button"
                  aria-pressed={prefs.numberFormat === 'pk'}
                  onClick={() => setNumberFormat('pk')}
                >
                  75,83,535
                </button>
                <button
                  type="button"
                  aria-pressed={prefs.numberFormat === 'intl'}
                  onClick={() => setNumberFormat('intl')}
                >
                  7,583,535
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Security */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('security')}</h2>
          <div className="settings-group-card">
            <div className="setting-row flex-wrap">
              <div className="setting-info-block">
                <span className="setting-label flex items-center gap-2">
                  <Lock size={18} className="text-muted" aria-hidden="true" />
                  <span>{t('pinLock')}</span>
                </span>
                <span className={`status-badge ${pinActive ? 'status-active' : 'status-muted'}`}>
                  {t(pinActive ? 'pinOn' : 'pinOff')}
                </span>
              </div>

              <div className="setting-action-buttons">
                <button
                  type="button"
                  className="button button-secondary text-sm pin-action-btn"
                  onClick={() => {
                    setShowPinModal(true);
                    setPinValue('');
                    setPinConfirm('');
                    setPinError('');
                  }}
                >
                  <KeyRound size={16} aria-hidden="true" />
                  <span>{settings.pin ? t('changePin') : t('setPin')}</span>
                </button>

                {pinActive && (
                  <button
                    type="button"
                    className="button button-danger text-sm pin-remove-btn"
                    onClick={() => updateSettings({ pin: undefined })}
                  >
                    {t('removePin')}
                  </button>
                )}
              </div>
            </div>

            <div className="setting-row-subtext">
              <p className="muted-copy text-xs">{t('pinLockHelp')}</p>
            </div>
          </div>
        </section>

        {/* Section 3: Data & Backup */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('data')}</h2>
          <div className="settings-group-card settings-group-card-padded">
            <Backup embedded />
          </div>
        </section>

        {/* Section 3b: Monthly Summary & Reminder Templates */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('overview')}</h2>
          <div className="settings-group-card">
            <Link to="/summary" className="setting-row top-customer-link monthly-summary-link-row">
              <span className="setting-label flex items-center gap-2">
                <BarChart3 size={18} className="text-muted" aria-hidden="true" />
                <span>{t('monthlySummary')}</span>
              </span>
              <span className="text-xs text-muted shrink-0" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className="settings-group">
          <h2 className="settings-group-title">{t('reminderTemplateLabel')}</h2>
          <div className="settings-group-card settings-group-card-padded template-editor-card">
            <p className="text-xs text-muted">{t('reminderTemplateHelp')}</p>
            <textarea
              className="form-control-textarea template-textarea"
              rows={3}
              aria-label={t('reminderTemplateLabel')}
              value={prefs.reminderTemplate ?? REMINDER_PRESETS.roman}
              onChange={e => setReminderTemplate(e.target.value)}
            />
            <div className="template-presets-row">
              <button
                type="button"
                className="template-preset-btn"
                onClick={() => setReminderTemplate(REMINDER_PRESETS.en)}
              >
                {t('presetEnglish')}
              </button>
              <button
                type="button"
                className="template-preset-btn"
                onClick={() => setReminderTemplate(REMINDER_PRESETS.ur)}
              >
                {t('presetUrdu')}
              </button>
              <button
                type="button"
                className="template-preset-btn"
                onClick={() => setReminderTemplate(REMINDER_PRESETS.roman)}
              >
                {t('presetRomanUrdu')}
              </button>
              <button
                type="button"
                className="template-preset-btn"
                onClick={() => setReminderTemplate(null)}
              >
                {t('resetDefault')}
              </button>
            </div>
          </div>
        </section>

        {/* Section 5: Categories */}
        <section className="settings-group">
          <h2 className="settings-group-title">{t('categoriesSection')}</h2>
          <div className="settings-group-card">
            <Link to="/settings/categories" className="setting-row top-customer-link monthly-summary-link-row">
              <span className="setting-label flex items-center gap-2">
                <Tag size={18} className="text-muted" aria-hidden="true" />
                <span>{t('categoriesSection')}</span>
              </span>
              <span className="text-xs text-muted shrink-0" aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* Section 4: Developer / Preview Controls (Collapsible, closed by default) */}
        <section className="settings-group developer-section" id="preview-controls">
          <button
            type="button"
            className="developer-toggle-btn"
            onClick={() => setDevOpen(p => !p)}
            aria-expanded={devOpen}
          >
            <div className="flex items-center gap-2">
              <FlaskConical size={18} className="text-muted" aria-hidden="true" />
              <span>{t('developerOptions')}</span>
            </div>
            {devOpen ? (
              <ChevronUp size={16} aria-hidden="true" />
            ) : (
              <ChevronDown size={16} aria-hidden="true" />
            )}
          </button>

          <div className={`developer-body ${devOpen ? 'expanded' : ''}`}>
            <ReviewControls />
          </div>
        </section>

        {/* Section 5: About */}
        <section className="settings-group about-section">
          <h2 className="settings-group-title">{t('about')}</h2>
          <div className="settings-group-card">
            <div className="setting-row">
              <span className="text-muted text-sm">{t('currency')}</span>
              <strong>
                <bdi dir="ltr">{t('currencyLabel')}</bdi> (PKR)
              </strong>
            </div>

            <div className="setting-row">
              <span className="text-muted text-sm">App Version</span>
              <span className="app-version-badge">
                {t('appVersion')} ({typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev'})
              </span>
            </div>
          </div>

          <p className="muted-copy text-center offline-notice">{t('offline')}</p>
        </section>

        {/* PIN Setup Modal */}
        {showPinModal && (
          <Modal
            title={t(settings.pin ? 'changePin' : 'setPin')}
            onDismiss={() => setShowPinModal(false)}
            actions={
              <button type="button" className="button button-primary" onClick={savePin}>
                <Check aria-hidden="true" /> {t('save')}
              </button>
            }
          >
            <div className="pin-modal-content">
              <div className="form-field">
                <label htmlFor="input-pin">{t('enterPin')}</label>
                <input
                  id="input-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  pattern="\d{4}"
                  value={pinValue}
                  onChange={e =>
                    setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="••••"
                  className="pin-digit-input"
                  autoFocus
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
                  onChange={e =>
                    setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))
                  }
                  placeholder="••••"
                  className="pin-digit-input"
                />
              </div>

              {pinError && (
                <p className="field-error" role="alert">
                  {pinError}
                </p>
              )}
            </div>
          </Modal>
        )}
      </div>
    </>
  );
}
