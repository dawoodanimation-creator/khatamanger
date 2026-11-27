import { useState } from 'react';
import {
  Globe2,
  Moon,
  Lock,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  FlaskConical,
  KeyRound,
  BarChart3,
  Tag,
  Store,
  BookOpen,
  Eye,
  Database,
  Info,
  Hash,
} from 'lucide-react';
import { Link } from 'react-router';
import { Backup } from './Backup';
import { ReviewControls } from '../components/ReviewControls';
import { BottomSheet } from '../components/BottomSheet';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { useUiPrefs } from '../state/UiPrefsContext';
import { REMINDER_PRESETS } from '../utils/reminderTemplates';
import { formatPakistaniPhoneInput } from '../utils/phone';
import { SHOP_TYPE_PRESETS } from '../utils/shopPresets';
import { localDate } from '../utils/dates';
import type { UseMode } from '../models/ledger';

declare const __COMMIT_HASH__: string;

export function Settings() {
  const { ledger, updateSettings } = useLedger();
  const { prefs, setNumberFormat, setReminderTemplate } = useUiPrefs();
  const { t, language } = useI18n();
  const settings = ledger.settings;
  const useMode = settings.useMode ?? 'both';
  const shopTypes = settings.shopTypes ?? [];

  const [showPinModal, setShowPinModal] = useState(false);
  const [pinValue, setPinValue] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinError, setPinError] = useState('');

  const [showProfileSheet, setShowProfileSheet] = useState(false);
  const [showShopTypeSheet, setShowShopTypeSheet] = useState(false);
  const [showModeSheet, setShowModeSheet] = useState(false);
  const [showLangSheet, setShowLangSheet] = useState(false);
  const [showTemplateSheet, setShowTemplateSheet] = useState(false);
  const [devOpen, setDevOpen] = useState(false);

  function toggleShopType(id: string) {
    const next = shopTypes.includes(id)
      ? shopTypes.filter(x => x !== id)
      : [...shopTypes, id];
    void updateSettings({ shopTypes: next });
  }

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
  const modeLabel =
    useMode === 'khata'
      ? t('navKhata')
      : useMode === 'expenses'
        ? t('navExpenses')
        : t('useBoth');

  const firstShopName = shopTypes.length
    ? SHOP_TYPE_PRESETS.filter(p => shopTypes.includes(p.id))
        .slice(0, 2)
        .map(p => (language === 'ur' ? p.nameUr : p.nameEn))
        .join(', ')
    : t('openingNone');

  const lastBackupStr = prefs.lastBackupAt
    ? localDate(prefs.lastBackupAt.slice(0, 10), language)
    : t('never');

  return (
    <div className="page-content settings-content settings-with-nav v3-page-content" style={{ paddingTop: '20px' }}>
      <h1 className="v3-settings-screen-title v3-rise" style={{ '--rise-idx': 0 } as React.CSSProperties}>
        {t('settings')}
      </h1>

      {/* PROFILE */}
      <section className="settings-group v3-rise" style={{ '--rise-idx': 1 } as React.CSSProperties}>
        <h2 className="v3-settings-group-label">{t('profileSection')}</h2>
        <div className="v3-list-card">
          <button type="button" className="v3-setting-row" onClick={() => setShowProfileSheet(true)}>
            <span className="v3-cat-circle-40 v3-tint-green">
              <Store size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title" dir="auto">
                {settings.profile?.shopName?.trim() || t('shopName')}
              </strong>
              <span className="v3-setting-sub" dir="auto">
                {[settings.profile?.ownerName, settings.profile?.phone].filter(Boolean).join(' · ') ||
                  t('onboardingProfileStep')}
              </span>
            </span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </button>

          {useMode !== 'expenses' && (
            <button type="button" className="v3-setting-row" onClick={() => setShowShopTypeSheet(true)}>
              <span className="v3-cat-circle-40 v3-tint-amber">
                <Tag size={20} aria-hidden="true" />
              </span>
              <span className="v3-setting-meta">
                <strong className="v3-setting-title">{t('shopTypesLabel')}</strong>
              </span>
              <span className="v3-setting-val" dir="auto">{firstShopName}</span>
              <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
            </button>
          )}

          <button type="button" className="v3-setting-row" onClick={() => setShowModeSheet(true)}>
            <span className="v3-cat-circle-40 v3-tint-blue">
              <BookOpen size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('iUse')}</strong>
            </span>
            <span className="v3-setting-val">{modeLabel}</span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* APPEARANCE */}
      <section className="settings-group v3-rise" style={{ '--rise-idx': 2 } as React.CSSProperties}>
        <h2 className="v3-settings-group-label">{t('appearance')}</h2>
        <div className="v3-list-card">
          <button
            type="button"
            className="v3-setting-row"
            onClick={() => setShowLangSheet(true)}
          >
            <span className="v3-cat-circle-40 v3-tint-purple">
              <Globe2 size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('language')}</strong>
            </span>
            <span className="v3-setting-val">{settings.language === 'en' ? t('english') : t('urdu')}</span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </button>

          <div className="v3-setting-row">
            <span className="v3-cat-circle-40 v3-tint-neutral">
              <Moon size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('darkMode')}</strong>
            </span>
            <button
              type="button"
              className="toggle v3-switch-52"
              role="switch"
              aria-checked={settings.darkMode}
              aria-label={t('darkMode')}
              onClick={() => updateSettings({ darkMode: !settings.darkMode })}
            >
              <span />
            </button>
          </div>

          <button
            type="button"
            className="v3-setting-row"
            onClick={() => setNumberFormat(prefs.numberFormat === 'pk' ? 'intl' : 'pk')}
          >
            <span className="v3-cat-circle-40 v3-tint-neutral">
              <Hash size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('numberFormat')}</strong>
            </span>
            <span className="v3-setting-val" dir="ltr">
              {prefs.numberFormat === 'pk' ? '75,83,535' : '7,583,535'}
            </span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </button>
        </div>
      </section>

      {/* SECURITY */}
      <section className="settings-group v3-rise" style={{ '--rise-idx': 3 } as React.CSSProperties}>
        <h2 className="v3-settings-group-label">{t('security')}</h2>
        <div className="v3-list-card">
          <button
            type="button"
            className="v3-setting-row"
            onClick={() => {
              setShowPinModal(true);
              setPinValue('');
              setPinConfirm('');
              setPinError('');
            }}
          >
            <span className="v3-cat-circle-40 v3-tint-green">
              <Lock size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('appLockPin')}</strong>
            </span>
            <span className="v3-setting-val" style={{ color: pinActive ? 'var(--color-primary)' : undefined }}>
              {t(pinActive ? 'onLabel' : 'offLabel')}
            </span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </button>

          <div className="v3-setting-row">
            <span className="v3-cat-circle-40 v3-tint-neutral">
              <Eye size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('hideBalances')}</strong>
            </span>
            <button
              type="button"
              className="toggle v3-switch-52"
              role="switch"
              aria-checked={!!settings.hideBalances}
              aria-label={t('hideBalances')}
              onClick={() => updateSettings({ hideBalances: !settings.hideBalances })}
            >
              <span />
            </button>
          </div>
        </div>
      </section>

      {/* DATA */}
      <section className="settings-group v3-rise" style={{ '--rise-idx': 4 } as React.CSSProperties}>
        <h2 className="v3-settings-group-label">{t('data')}</h2>
        <div className="v3-list-card">
          <Link to="/settings/backup" className="v3-setting-row">
            <span className="v3-cat-circle-40 v3-tint-amber">
              <Database size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('backupAndRestore')}</strong>
            </span>
            <span className="v3-setting-val">{lastBackupStr}</span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </Link>

          <Link to="/settings/categories" className="v3-setting-row">
            <span className="v3-cat-circle-40 v3-tint-neutral">
              <BarChart3 size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('categoriesSection')}</strong>
            </span>
            <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
          </Link>

          {useMode !== 'expenses' && (
            <>
              <Link to="/summary" className="v3-setting-row">
                <span className="v3-cat-circle-40 v3-tint-green">
                  <BarChart3 size={20} aria-hidden="true" />
                </span>
                <span className="v3-setting-meta">
                  <strong className="v3-setting-title">{t('monthlySummary')}</strong>
                </span>
                <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
              </Link>

              <button type="button" className="v3-setting-row" onClick={() => setShowTemplateSheet(true)}>
                <span className="v3-cat-circle-40 v3-tint-blue">
                  <KeyRound size={20} aria-hidden="true" />
                </span>
                <span className="v3-setting-meta">
                  <strong className="v3-setting-title">{t('reminderTemplateLabel')}</strong>
                </span>
                <ChevronRight size={18} className="text-muted shrink-0" aria-hidden="true" />
              </button>
            </>
          )}
        </div>
      </section>

      {/* ABOUT */}
      <section className="settings-group v3-rise" style={{ '--rise-idx': 5 } as React.CSSProperties}>
        <h2 className="v3-settings-group-label">{t('about')}</h2>
        <div className="v3-list-card">
          <div className="v3-setting-row">
            <span className="v3-cat-circle-40 v3-tint-neutral">
              <Info size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">{t('currency')}</strong>
            </span>
            <span className="v3-setting-val" dir="ltr">{t('currencyLabel')} (PKR)</span>
          </div>
          <div className="v3-setting-row">
            <span className="v3-cat-circle-40 v3-tint-neutral">
              <Info size={20} aria-hidden="true" />
            </span>
            <span className="v3-setting-meta">
              <strong className="v3-setting-title">App Version</strong>
            </span>
            <span className="v3-setting-val">
              {t('appVersion')} ({typeof __COMMIT_HASH__ !== 'undefined' ? __COMMIT_HASH__ : 'dev'})
            </span>
          </div>
        </div>
        <p className="muted-copy text-center offline-notice">{t('offline')}</p>
      </section>

      {/* Developer Controls — ONLY in dev builds */}
      {import.meta.env.DEV && (
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
            {devOpen ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </button>
          <div className={`developer-body ${devOpen ? 'expanded' : ''}`}>
            <ReviewControls />
          </div>
        </section>
      )}

      {/* Embedded hidden Backup? No, /settings/backup route handles full Backup & CSV */}
      {false && <Backup embedded />}

      {/* Profile Bottom Sheet */}
      {showProfileSheet && (
        <BottomSheet title={t('profileSection')} onDismiss={() => setShowProfileSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px' }}>
            <div className="form-field">
              <label htmlFor="profile-shop">{t('shopName')}</label>
              <input
                id="profile-shop"
                className="form-control-input"
                value={settings.profile?.shopName ?? ''}
                onChange={e => updateSettings({ profile: { ...settings.profile, shopName: e.target.value } })}
                maxLength={100}
                dir="auto"
              />
            </div>
            <div className="form-field">
              <label htmlFor="profile-owner">{t('ownerName')}</label>
              <input
                id="profile-owner"
                className="form-control-input"
                value={settings.profile?.ownerName ?? ''}
                onChange={e => updateSettings({ profile: { ...settings.profile, ownerName: e.target.value } })}
                maxLength={100}
                dir="auto"
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
                    profile: { ...settings.profile, phone: formatPakistaniPhoneInput(e.target.value) },
                  })
                }
                placeholder="03XX-XXXXXXX"
              />
            </div>
            <button type="button" className="button button-primary v3-btn-52" onClick={() => setShowProfileSheet(false)}>
              {t('finish')}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Shop Type Bottom Sheet */}
      {showShopTypeSheet && (
        <BottomSheet title={t('shopTypesLabel')} onDismiss={() => setShowShopTypeSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px' }}>
            <div className="chip-wrap-row">
              {SHOP_TYPE_PRESETS.map(p => {
                const active = shopTypes.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`v3-pill-btn ${active ? 'is-active' : ''}`}
                    onClick={() => toggleShopType(p.id)}
                  >
                    {language === 'ur' ? p.nameUr : p.nameEn}
                  </button>
                );
              })}
            </div>
            <button type="button" className="button button-primary v3-btn-52" onClick={() => setShowShopTypeSheet(false)}>
              {t('finish')}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* I Use Mode Bottom Sheet */}
      {showModeSheet && (
        <BottomSheet title={t('iUse')} onDismiss={() => setShowModeSheet(false)}>
          <div className="onboarding-choice-stack" style={{ paddingBottom: '12px' }}>
            {(
              [
                { id: 'khata', key: 'navKhata' },
                { id: 'expenses', key: 'navExpenses' },
                { id: 'both', key: 'useBoth' },
              ] as Array<{ id: UseMode; key: 'navKhata' | 'navExpenses' | 'useBoth' }>
            ).map(opt => (
              <button
                key={opt.id}
                type="button"
                className={`onboarding-choice-btn ${useMode === opt.id ? 'is-active' : ''}`}
                onClick={() => {
                  void updateSettings({ useMode: opt.id });
                  setShowModeSheet(false);
                }}
              >
                <span>{t(opt.key)}</span>
                {useMode === opt.id && <Check size={18} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </BottomSheet>
      )}

      {/* Language Bottom Sheet */}
      {showLangSheet && (
        <BottomSheet title={t('language')} onDismiss={() => setShowLangSheet(false)}>
          <div className="onboarding-choice-stack" style={{ paddingBottom: '12px' }}>
            <button
              type="button"
              className={`onboarding-choice-btn ${settings.language === 'en' ? 'is-active' : ''}`}
              onClick={() => {
                void updateSettings({ language: 'en' });
                setShowLangSheet(false);
              }}
            >
              <span>{t('english')}</span>
              {settings.language === 'en' && <Check size={18} aria-hidden="true" />}
            </button>
            <button
              type="button"
              className={`onboarding-choice-btn urdu-label ${settings.language === 'ur' ? 'is-active' : ''}`}
              dir="rtl"
              onClick={() => {
                void updateSettings({ language: 'ur' });
                setShowLangSheet(false);
              }}
            >
              <span>{t('urdu')}</span>
              {settings.language === 'ur' && <Check size={18} aria-hidden="true" />}
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Reminder Template Bottom Sheet */}
      {showTemplateSheet && (
        <BottomSheet title={t('reminderTemplateLabel')} onDismiss={() => setShowTemplateSheet(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingBottom: '12px' }}>
            <p className="text-xs text-muted">{t('reminderTemplateHelp')}</p>
            <textarea
              className="form-control-textarea template-textarea"
              rows={3}
              aria-label={t('reminderTemplateLabel')}
              value={prefs.reminderTemplate ?? REMINDER_PRESETS.roman}
              onChange={e => setReminderTemplate(e.target.value)}
            />
            <div className="template-presets-row">
              <button type="button" className="template-preset-btn" onClick={() => setReminderTemplate(REMINDER_PRESETS.en)}>
                {t('presetEnglish')}
              </button>
              <button type="button" className="template-preset-btn" onClick={() => setReminderTemplate(REMINDER_PRESETS.ur)}>
                {t('presetUrdu')}
              </button>
              <button type="button" className="template-preset-btn" onClick={() => setReminderTemplate(REMINDER_PRESETS.roman)}>
                {t('presetRomanUrdu')}
              </button>
              <button type="button" className="template-preset-btn" onClick={() => setReminderTemplate(null)}>
                {t('resetDefault')}
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* PIN Setup Modal */}
      {showPinModal && (
        <Modal
          title={t(settings.pin ? 'changePin' : 'setPin')}
          onDismiss={() => setShowPinModal(false)}
          actions={
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              {pinActive && (
                <button
                  type="button"
                  className="button button-danger"
                  onClick={() => {
                    updateSettings({ pin: undefined });
                    setShowPinModal(false);
                  }}
                >
                  {t('removePin')}
                </button>
              )}
              <button type="button" className="button button-primary" style={{ flex: 1 }} onClick={savePin}>
                <Check aria-hidden="true" /> {t('save')}
              </button>
            </div>
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
                onChange={e => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
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
                onChange={e => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="••••"
                className="pin-digit-input"
              />
            </div>
            {pinError && <p className="field-error" role="alert">{pinError}</p>}
          </div>
        </Modal>
      )}
    </div>
  );
}
