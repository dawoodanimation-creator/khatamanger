import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, ReceiptText, Layers, Check } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import type { Language, UseMode } from '../models/ledger';
import { formatPakistaniPhoneInput } from '../utils/phone';

export function Onboarding({ onDismissed }: { onDismissed: () => void }) {
  const { t } = useI18n();
  const { ledger, updateSettings } = useLedger();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [language, setLanguage] = useState<Language>(ledger.settings.language);
  const [shopName, setShopName] = useState(ledger.settings.profile?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(ledger.settings.profile?.ownerName ?? '');
  const [phone, setPhone] = useState(ledger.settings.profile?.phone ?? '');
  const [useMode, setUseMode] = useState<UseMode>(ledger.settings.useMode ?? 'both');

  async function handleSkip() {
    await updateSettings({ onboarded: true });
    onDismissed();
  }

  async function handleFinish() {
    const profile = {
      ...(shopName.trim() ? { shopName: shopName.trim() } : {}),
      ...(ownerName.trim() ? { ownerName: ownerName.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    };
    await updateSettings({
      language,
      onboarded: true,
      useMode,
      ...(Object.keys(profile).length > 0 ? { profile } : {}),
    });
    onDismissed();
    if (useMode === 'expenses') {
      navigate('/expenses', { replace: true });
    }
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('onboardingWelcome')}>
      <div className="onboarding-card">
        <div className="onboarding-top-row">
          <span className="onboarding-step-pill">{step} / 3</span>
          <button type="button" className="text-link-quiet" onClick={() => void handleSkip()}>
            {t('skip')}
          </button>
        </div>

        <h1 className="onboarding-title">{t('onboardingWelcome')}</h1>

        {step === 1 && (
          <div className="onboarding-step-body">
            <p className="onboarding-subtitle">{t('onboardingLanguageStep')}</p>
            <div className="onboarding-choice-stack">
              <button
                type="button"
                className={`onboarding-choice-btn ${language === 'en' ? 'is-active' : ''}`}
                onClick={() => {
                  setLanguage('en');
                  void updateSettings({ language: 'en' });
                }}
              >
                <span>English</span>
                {language === 'en' && <Check size={18} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={`onboarding-choice-btn urdu-label ${language === 'ur' ? 'is-active' : ''}`}
                dir="rtl"
                onClick={() => {
                  setLanguage('ur');
                  void updateSettings({ language: 'ur' });
                }}
              >
                <span>اردو</span>
                {language === 'ur' && <Check size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step-body">
            <p className="onboarding-subtitle">{t('onboardingProfileStep')}</p>
            <div className="form-field">
              <label htmlFor="onb-shop">{t('shopName')}</label>
              <input
                id="onb-shop"
                className="form-control-input"
                value={shopName}
                onChange={e => setShopName(e.target.value)}
                maxLength={100}
                dir="auto"
                placeholder={t('shopName')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="onb-owner">{t('ownerName')}</label>
              <input
                id="onb-owner"
                className="form-control-input"
                value={ownerName}
                onChange={e => setOwnerName(e.target.value)}
                maxLength={100}
                dir="auto"
                placeholder={t('ownerName')}
              />
            </div>
            <div className="form-field">
              <label htmlFor="onb-phone">{t('phone')}</label>
              <input
                id="onb-phone"
                className="form-control-input"
                type="tel"
                inputMode="tel"
                dir="ltr"
                value={phone}
                onChange={e => setPhone(formatPakistaniPhoneInput(e.target.value))}
                placeholder="03XX-XXXXXXX"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step-body">
            <p className="onboarding-subtitle">{t('onboardingUseStep')}</p>
            <div className="onboarding-choice-stack">
              <button
                type="button"
                className={`onboarding-choice-btn ${useMode === 'khata' ? 'is-active' : ''}`}
                onClick={() => setUseMode('khata')}
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={18} aria-hidden="true" />
                  <span>{t('useKhataOnly')}</span>
                </span>
                {useMode === 'khata' && <Check size={18} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={`onboarding-choice-btn ${useMode === 'expenses' ? 'is-active' : ''}`}
                onClick={() => setUseMode('expenses')}
              >
                <span className="flex items-center gap-2">
                  <ReceiptText size={18} aria-hidden="true" />
                  <span>{t('useExpensesOnly')}</span>
                </span>
                {useMode === 'expenses' && <Check size={18} aria-hidden="true" />}
              </button>
              <button
                type="button"
                className={`onboarding-choice-btn ${useMode === 'both' ? 'is-active' : ''}`}
                onClick={() => setUseMode('both')}
              >
                <span className="flex items-center gap-2">
                  <Layers size={18} aria-hidden="true" />
                  <span>{t('useBoth')}</span>
                </span>
                {useMode === 'both' && <Check size={18} aria-hidden="true" />}
              </button>
            </div>
          </div>
        )}

        <div className="onboarding-actions">
          {step < 3 ? (
            <button
              type="button"
              className="button button-primary"
              style={{ width: '100%' }}
              onClick={() => setStep(step === 1 ? 2 : 3)}
            >
              {t('next')}
            </button>
          ) : (
            <button
              type="button"
              className="button button-primary"
              style={{ width: '100%' }}
              onClick={() => void handleFinish()}
            >
              {t('finish')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
