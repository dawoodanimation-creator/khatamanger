import { useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router';
import { BookOpen, ShieldCheck, Lock } from 'lucide-react';
import { useI18n } from './i18n';
import { useLedger } from './state/LedgerContext';
import { UiPrefsProvider } from './state/UiPrefsContext';
import { themeVariables, tokens } from './theme/tokens';
import { Home } from './screens/Home';
import { Settings } from './screens/Settings';
import { CustomerForm } from './screens/CustomerForm';
import { CustomerDetail } from './screens/CustomerDetail';
import { TransactionForm } from './screens/TransactionForm';
import { Backup } from './screens/Backup';
import { MonthlySummary } from './screens/MonthlySummary';
export default function App() {
  const { t, language, direction } = useI18n();
  const { ledger, loadError, storageError } = useLedger();
  const location = useLocation();
  const [unlocked, setUnlocked] = useState(false);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [swUpdateReady, setSwUpdateReady] = useState(false);

  useEffect(() => {
    const onSwUpdate = () => setSwUpdateReady(true);
    window.addEventListener('khata-sw-update', onSwUpdate);
    return () => window.removeEventListener('khata-sw-update', onSwUpdate);
  }, []);

  const isLocked = Boolean(ledger.settings.pin && !unlocked);

  function tryUnlock(pinCandidate = enteredPin) {
    if (pinCandidate === ledger.settings.pin) {
      setUnlocked(true);
      setPinError('');
      setEnteredPin('');
    } else {
      setPinError(t('pinIncorrect'));
      setEnteredPin('');
    }
  }

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = direction;
    document.title = t('app');
    document.documentElement.dataset.theme = ledger.settings.darkMode ? 'dark' : 'light';
    for (const [key, value] of Object.entries(themeVariables(ledger.settings.darkMode))) document.documentElement.style.setProperty(key, value);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', tokens.colors[ledger.settings.darkMode ? 'dark' : 'light'].primary);
  }, [language, direction, ledger.settings.darkMode, t]);
  useEffect(() => {
    const main = document.getElementById('preview-app');
    if (main) main.scrollTop = 0;
    document.scrollingElement?.scrollTo?.({ top: 0, behavior: 'instant' });
    const primaryField = main?.querySelector<HTMLInputElement>('[data-entry-focus]');
    if (primaryField) { primaryField.focus({ preventScroll: true }); return; }
    const heading = main?.querySelector<HTMLElement>('h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus({ preventScroll: true });
  }, [location.pathname]);
  return <UiPrefsProvider><div className="preview-layout">
    <aside className="preview-intro text-center"><div className="preview-eyebrow flex items-center justify-center gap-3"><span className="preview-dot" />{t('previewLabel')}<span className="stage-badge">{t('previewStep')}</span></div>
      <h2>{t('previewTitle')}</h2><p>{t('previewDescription')}</p>
    </aside>
    <div className="phone-frame"><div className="phone-screen"><div className="phone-sensor" aria-hidden="true" />
      <main className="phone-app" key={location.pathname} id="preview-app" aria-label={t('app')}>
        {isLocked ? (
          <div className="page-content empty-state flex flex-col items-center text-center" style={{ margin: 'auto 0' }}>
            <span className="foundation-icon" style={{ marginBottom: '16px' }}><Lock aria-hidden="true"/></span>
            <h2>{t('pinLock')}</h2>
            <p>{t('enterPinToUnlock')}</p>
            <div style={{ marginTop: '24px', width: '100%', maxWidth: '280px' }}>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                autoFocus
                value={enteredPin}
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setEnteredPin(val);
                  if (val.length === 4) tryUnlock(val);
                }}
                placeholder="••••"
                style={{
                  textAlign: 'center',
                  fontSize: '32px',
                  letterSpacing: '12px',
                  width: '100%',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              />
              {pinError && <p className="field-error" style={{ marginTop: '8px' }} role="alert">{pinError}</p>}
              <button
                type="button"
                className="button button-primary"
                style={{ marginTop: '16px' }}
                onClick={() => tryUnlock()}
              >
                {t('unlock')}
              </button>
            </div>
          </div>
        ) : loadError && location.pathname !== '/settings/backup' ? <div className="page-content empty-state"><BookOpen/><h1>{t('loadError')}</h1><p>{t('previewStorageError')}</p><Link className="button button-primary" to="/settings/backup">{t('import')}</Link></div>
          : <><Routes>
            <Route path="/" element={<Home/>}/><Route path="/settings" element={<Settings/>}/>
            <Route path="/summary" element={<MonthlySummary/>}/>
            <Route path="/customers/new" element={<CustomerForm/>}/>
            <Route path="/customer/:customerId" element={<CustomerDetail/>}/>
            <Route path="/customer/:customerId/edit" element={<CustomerForm/>}/>
            <Route path="/customer/:customerId/credit" element={<TransactionForm kind="credit"/>}/>
            <Route path="/customer/:customerId/payment" element={<TransactionForm kind="payment"/>}/>
            <Route path="/customers/:customerId" element={<CustomerDetail/>}/>
            <Route path="/customers/:customerId/edit" element={<CustomerForm/>}/>
            <Route path="/customers/:customerId/credit" element={<TransactionForm kind="credit"/>}/>
            <Route path="/customers/:customerId/payment" element={<TransactionForm kind="payment"/>}/>
            <Route path="/settings/backup" element={<Backup/>}/>
            <Route path="*" element={<div className="page-content empty-state"><h1>{t('notFound')}</h1><Link to="/" className="button button-primary">{t('home')}</Link></div>}/>
          </Routes>{swUpdateReady && <div className="undo-snackbar" role="status"><span>{t('updateAvailable')}</span><button type="button" className="undo-snackbar-btn" onClick={() => window.location.reload()}>{t('reload')}</button></div>}{storageError && <p className="storage-error" role="alert">{t(storageError)}</p>}</>}
      </main><div className="phone-home-bar" aria-hidden="true" />
    </div></div>
    <footer className="preview-footer text-center"><p>{t('previewScope')}</p><p className="flex items-center justify-center gap-2"><ShieldCheck aria-hidden="true"/>{t('previewFooter')}</p></footer>
  </div></UiPrefsProvider>;
}
