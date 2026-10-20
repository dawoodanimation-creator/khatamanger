import { useRef, useState } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import { demoRecords } from '../utils/demo';
import { Modal } from './Modal';
export function ReviewControls({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const { replaceRecords, revision, writeError } = useLedger();
  const confirmedRevision = useRef(revision);
  const saving = useRef(false);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState<'demo' | 'reset' | null>(null);
  const [message, setMessage] = useState('');
  async function apply() {
    if (saving.current) return;
    saving.current = true; setBusy(true);
    try {
      const saved = await replaceRecords(action === 'demo' ? demoRecords(t) : { customers: [], transactions: [] }, confirmedRevision.current);
      if (saved) { setMessage(t(action === 'demo' ? 'demoLoaded' : 'dataReset')); setAction(null); }
      else setMessage(t(writeError()));
    } catch { setMessage(t('error')); }
    finally { saving.current = false; setBusy(false); }
  }
  return <section className={compact ? 'review-controls compact-controls' : 'settings-card review-controls'} id="preview-controls">
    {!compact && <><h2>{t('previewOnly')}</h2><p className="muted-copy">{t('reviewHelp')}</p></>}
    <button type="button" className="button button-secondary" onClick={() => { confirmedRevision.current = revision; setMessage(''); setAction('demo'); }}><FlaskConical/>{t('loadDemo')}</button>
    {!compact && <button type="button" className="button button-danger-outline" onClick={() => { confirmedRevision.current = revision; setMessage(''); setAction('reset'); }}><RotateCcw/>{t('resetData')}</button>}
    {message && <p className="inline-message" role="status">{message}</p>}
    {action && <Modal title={t(action === 'demo' ? 'demoTitle' : 'resetTitle')} onDismiss={() => setAction(null)} actions={
      <button type="button" className={`button ${action === 'reset' ? 'button-danger' : 'button-primary'}`} disabled={busy} onClick={apply}>{t(action === 'demo' ? 'loadDemo' : 'resetData')}</button>}>
      <p>{t(action === 'demo' ? 'demoWarning' : 'resetWarning')}</p>{message && <p className="field-error" role="alert">{message}</p>}
    </Modal>}
  </section>;
}
