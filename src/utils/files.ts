import { maxBackupBytes, type Ledger } from '../models/ledger';
import { decodeLedger, encodeLedger } from './backup';
import { ensureExactBalances } from '../state/mutations';
export function readBackupFile(file: File): Promise<Ledger> {
  if (file.size > maxBackupBytes) return Promise.reject(new Error('Backup too large'));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Unreadable file'));
    reader.onabort = () => reject(new Error('Read cancelled'));
    reader.onload = () => {
      try { resolve(ensureExactBalances(decodeLedger(String(reader.result)))); }
      catch (error) { reject(error); }
    };
    reader.readAsText(file, 'UTF-8');
  });
}
export function downloadBackup(ledger: Ledger): void {
  const blob = new Blob([encodeLedger(ledger)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `khata-backup-${new Date().toISOString().replaceAll(':', '-')}.json`;
  document.body.appendChild(link); link.click(); link.remove();
  // Mobile browsers can read the blob after the click handler returns.
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
