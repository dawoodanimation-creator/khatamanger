import { useState } from 'react';
import { useNavigate } from 'react-router';
import { BookOpen, ReceiptText, Layers, Check, Plus } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import type { Language, UseMode } from '../models/ledger';
import { formatPakistaniPhoneInput } from '../utils/phone';
import { SHOP_TYPE_PRESETS } from '../utils/shopPresets';

export function Onboarding({ onDismissed }: { onDismissed: () => void }) {
  const { t } = useI18n();
  const { ledger, updateSettings } = useLedger();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [language, setLanguage] = useState<Language>(ledger.settings.language);
  const [shopName, setShopName] = useState(ledger.settings.profile?.shopName ?? '');
  const [ownerName, setOwnerName] = useState(ledger.settings.profile?.ownerName ?? '');
  const [phone, setPhone] = useState(ledger.settings.profile?.phone ?? '');
  const [useMode, setUseMode] = useState<UseMode>(ledger.settings.useMode ?? 'both');
  const [shopTypes, setShopTypes] = useState<string[]>(ledger.settings.shopTypes ?? []);
  const [customShopTypes, setCustomShopTypes] = useState<string[]>(
    ledger.settings.customShopTypes ?? []
  );
  const [showCustomShop, setShowCustomShop] = useState(false);
  const [customShopInput, setCustomShopInput] = useState('');

  const needsShopStep = useMode !== 'expenses';
  const totalSteps = needsShopStep ? 4 : 3;

  function toggleShopType(id: string) {
    setShopTypes(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  }

  function addCustomShop() {
    const clean = customShopInput.trim().slice(0, 60);
    if (!clean) return;
    if (!customShopTypes.includes(clean)) {
      setCustomShopTypes(prev => [...prev, clean]);
    }
    setCustomShopInput('');
    setShowCustomShop(false);
  }

  async function handleSkip() {
    await updateSettings({ onboarded: true });
    onDismissed();
  }

  async function handleFinish(overrideMode?: UseMode) {
    const finalMode = overrideMode ?? useMode;
    const profile = {
      ...(shopName.trim() ? { shopName: shopName.trim() } : {}),
      ...(ownerName.trim() ? { ownerName: ownerName.trim() } : {}),
      ...(phone.trim() ? { phone: phone.trim() } : {}),
    };
    await updateSettings({
      language,
      onboarded: true,
      useMode: finalMode,
      ...(shopTypes.length > 0 ? { shopTypes } : {}),
      ...(customShopTypes.length > 0 ? { customShopTypes } : {}),
      ...(Object.keys(profile).length > 0 ? { profile } : {}),
    });
    onDismissed();
    if (finalMode === 'expenses') {
      navigate('/expenses', { replace: true });
    }
  }

  return (
    <div className="onboarding-overlay" role="dialog" aria-modal="true" aria-label={t('onboardingWelcome')}>
      <div className="onboarding-card">
        <div className="onboarding-top-row">
          <span className="onboarding-step-pill">
            {step} / {totalSteps}
          </span>
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

        {step === 4 && (
          <div className="onboarding-step-body">
            <p className="onboarding-subtitle">{t('onboardingShopTypeStep')}</p>
            <div className="chip-wrap-row onboarding-shop-grid">
              {SHOP_TYPE_PRESETS.map(preset => {
                const active = shopTypes.includes(preset.id);
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`choice-chip ${active ? 'is-active' : ''}`}
                    aria-pressed={active}
                    onClick={() => toggleShopType(preset.id)}
                  >
                    {language === 'ur' ? preset.nameUr : preset.nameEn}
                  </button>
                );
              })}
              {customShopTypes.map(cs => (
                <button
                  key={cs}
                  type="button"
                  className="choice-chip is-active"
                  onClick={() => setCustomShopTypes(prev => prev.filter(x => x !== cs))}
                >
                  {cs}
                </button>
              ))}
              <button
                type="button"
                className="choice-chip choice-chip-add"
                onClick={() => setShowCustomShop(v => !v)}
              >
                <Plus size={14} aria-hidden="true" />
                <span>{t('customShopType').replace(/^\+\s*/, '')}</span>
              </button>
            </div>
            {showCustomShop && (
              <div className="custom-chip-inline">
                <input
                  type="text"
                  className="form-control-input"
                  value={customShopInput}
                  onChange={e => setCustomShopInput(e.target.value)}
                  maxLength={60}
                  placeholder={t('customCategoryPlaceholder')}
                />
                <button type="button" className="button button-secondary" onClick={addCustomShop}>
                  {t('save')}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="onboarding-actions">
          {step < totalSteps ? (
            <button
              type="button"
              className="button button-primary"
              style={{ width: '100%' }}
              onClick={() => setStep(prev => (prev + 1) as 1 | 2 | 3 | 4)}
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
