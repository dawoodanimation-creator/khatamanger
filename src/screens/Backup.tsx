import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload, FileJson, ShieldCheck } from 'lucide-react';
import { Header } from '../components/Header';
import { Modal } from '../components/Modal';
import { useI18n } from '../i18n';
import { useLedger } from '../state/LedgerContext';
import type { Ledger } from '../models/ledger';
import { downloadBackup, readBackupFile } from '../utils/files';
export function Backup({ embedded = false }: { embedded?: boolean }) {
  const { ledger, restore, revision, loadError, writeError } = useLedger();
  const { t } = useI18n();
  const input = useRef<HTMLInputElement>(null);
  const [candidate, setCandidate] = useState<{ ledger: Ledger; name: string; revision: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const reading = useRef(false);
  function exportBackup() {
    setError(''); setMessage('');
    try { downloadBackup(ledger); setMessage(t('downloadStarted')); }
    catch { setError(t('error')); }
  }
  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file || reading.current) return;
    reading.current = true; setBusy(true); setError(''); setMessage('');
    try { const imported = await readBackupFile(file); setCandidate({ ledger: imported, name: file.name, revision }); }
    catch (failure) { setError(t(failure instanceof RangeError ? 'safeBalanceError' : 'badBackup')); }
    finally { reading.current = false; setBusy(false); }
  }
  async function apply() {
    if (!candidate) return;
    if (busy) return;
    setBusy(true);
    try {
      if (await restore(candidate.ledger, candidate.revision)) {
        // The imported locale may differ from the current locale.
        setCandidate(null); setMessage(''); setError(''); setRestored(true);
      } else setError(t(writeError()));
    } catch { setError(t('error')); }
    finally { setBusy(false); }
  }
  const [restored, setRestored] = useState(false);
  return <>{!embedded && <Header title={t('backup')} backTo={loadError ? "/" : "/settings"}/>}<div className={embedded ? "backup-content" : "page-content backup-content"}>
    {embedded && <h2>{t('backup')}</h2>}
    {loadError && <p className="field-error" role="alert">{t('previewStorageError')}</p>}
    <section className="backup-intro"><span className="foundation-icon"><ShieldCheck/></span><p>{t('backupHelp')}</p></section>
    <section className="settings-card backup-actions"><button type="button" className="button button-primary" disabled={busy || loadError} onClick={exportBackup}><Download/>{t('export')}</button>
      <button type="button" className="button button-secondary" disabled={busy} onClick={() => { setRestored(false); input.current?.click(); }}><Upload/>{t('import')}</button>
      <input ref={input} type="file" tabIndex={-1} className="sr-only" accept=".json,application/json" aria-label={t('import')} onChange={pickFile}/>
    </section>
    {busy && <p role="status" className="inline-message">{t('fileReading')}</p>}
    {message && <p role="status" className="inline-message">{message}</p>}
    {restored && <p role="status" className="inline-message">{t('imported')}</p>}
    {error && !candidate && <p className="field-error" role="alert">{error}</p>}
    <p className="muted-copy">{t('offline')}</p>
    {candidate && <Modal title={t('restoreTitle')} onDismiss={() => { setCandidate(null); setError(''); }} actions={<button type="button" className="button button-danger" disabled={busy} onClick={apply}>{t('restore')}</button>}>
      <p>{t('restoreWarning')}</p><div className="backup-file"><FileJson/><div><span>{t('fileSelected')}</span><strong>{candidate.name}</strong></div></div>
      <dl className="backup-counts"><div><dt>{t('customers')}</dt><dd>{candidate.ledger.customers.length}</dd></div><div><dt>{t('entries')}</dt><dd>{candidate.ledger.transactions.length}</dd></div></dl>
      {error && <p className="field-error" role="alert">{error}</p>}
    </Modal>}
  </div></>;
}
