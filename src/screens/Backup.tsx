import { useRef, useState, type ChangeEvent } from 'react';
import { Download, Upload, FileJson, CheckCircle2 } from 'lucide-react';
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
  const [candidate, setCandidate] = useState<{
    ledger: Ledger;
    name: string;
    revision: string | null;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [restored, setRestored] = useState(false);
  const reading = useRef(false);

  function exportBackup() {
    setError('');
    setMessage('');
    try {
      downloadBackup(ledger);
      setMessage(t('downloadStarted'));
    } catch {
      setError(t('error'));
    }
  }

  async function pickFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || reading.current) return;

    reading.current = true;
    setBusy(true);
    setError('');
    setMessage('');

    try {
      const imported = await readBackupFile(file);
      setCandidate({ ledger: imported, name: file.name, revision });
    } catch (failure) {
      setError(t(failure instanceof RangeError ? 'safeBalanceError' : 'badBackup'));
    } finally {
      reading.current = false;
      setBusy(false);
    }
  }

  async function apply() {
    if (!candidate || busy) return;
    setBusy(true);

    try {
      if (await restore(candidate.ledger, candidate.revision)) {
        setCandidate(null);
        setMessage('');
        setError('');
        setRestored(true);
      } else {
        setError(t(writeError()));
      }
    } catch {
      setError(t('error'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {!embedded && (
        <Header title={t('backup')} backTo={loadError ? '/' : '/settings'} />
      )}

      <div className={embedded ? 'backup-embedded' : 'page-content backup-content'}>
        {loadError && (
          <p className="field-error" role="alert">
            {t('previewStorageError')}
          </p>
        )}

        {/* Backup Actions Card */}
        <div className="backup-card">
          <p className="backup-description-text">{t('backupHelp')}</p>

          <div className="backup-buttons-row">
            <button
              type="button"
              className="button button-primary backup-primary-btn"
              disabled={busy || loadError}
              onClick={exportBackup}
            >
              <Download size={18} aria-hidden="true" />
              <span>{t('export')}</span>
            </button>

            <button
              type="button"
              className="button button-secondary backup-secondary-btn"
              disabled={busy}
              onClick={() => {
                setRestored(false);
                input.current?.click();
              }}
            >
              <Upload size={18} aria-hidden="true" />
              <span>{t('import')}</span>
            </button>

            <input
              ref={input}
              type="file"
              tabIndex={-1}
              className="sr-only"
              accept=".json,application/json"
              aria-label={t('import')}
              onChange={pickFile}
            />
          </div>

          {busy && (
            <p role="status" className="inline-message">
              {t('fileReading')}
            </p>
          )}
          {message && (
            <p role="status" className="inline-message inline-success">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{message}</span>
            </p>
          )}
          {restored && (
            <p role="status" className="inline-message inline-success">
              <CheckCircle2 size={16} aria-hidden="true" />
              <span>{t('imported')}</span>
            </p>
          )}
          {error && !candidate && (
            <p className="field-error" role="alert">
              {error}
            </p>
          )}
        </div>

        {/* Only show offline note once if not embedded */}
        {!embedded && <p className="muted-copy text-center">{t('offline')}</p>}

        {/* Restore Confirmation Modal */}
        {candidate && (
          <Modal
            title={t('restoreTitle')}
            onDismiss={() => {
              setCandidate(null);
              setError('');
            }}
            actions={
              <button
                type="button"
                className="button button-danger"
                disabled={busy}
                onClick={apply}
              >
                {t('restore')}
              </button>
            }
          >
            <p>{t('restoreWarning')}</p>
            <div className="backup-file">
              <FileJson size={28} aria-hidden="true" />
              <div>
                <span>{t('fileSelected')}</span>
                <strong>{candidate.name}</strong>
              </div>
            </div>
            <dl className="backup-counts">
              <div>
                <dt>{t('customers')}</dt>
                <dd>{candidate.ledger.customers.length}</dd>
              </div>
              <div>
                <dt>{t('entries')}</dt>
                <dd>{candidate.ledger.transactions.length}</dd>
              </div>
            </dl>
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
          </Modal>
        )}
      </div>
    </>
  );
}
