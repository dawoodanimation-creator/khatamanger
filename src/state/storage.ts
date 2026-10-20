import { decodeLedger, encodeLedger } from '../utils/backup';
import { emptyLedger, type Ledger } from '../models/ledger';
import { ensureExactBalances } from './mutations';
export const STORAGE_KEY = 'khata-preview.ledger.v1';
let cachedRaw: string | null | undefined;
let cachedLedger: Ledger | undefined;
export function decodeStored(raw: string | null): Ledger {
  if (cachedLedger && raw === cachedRaw) return cachedLedger;
  const ledger = ensureExactBalances(raw === null ? emptyLedger() : decodeLedger(raw));
  cachedRaw = raw; cachedLedger = ledger;
  return ledger;
}
export function readLedger(storage: Pick<Storage, 'getItem'>): Ledger { return decodeStored(storage.getItem(STORAGE_KEY)); }
export function writeLedger(storage: Pick<Storage, 'setItem'>, ledger: Ledger): void {
  const raw = encodeLedger(ledger);
  storage.setItem(STORAGE_KEY, raw);
  cachedRaw = raw; cachedLedger = ledger;
}
export class CommitConflict extends Error {}
export class LockUnavailable extends Error {}
/** All cooperating tabs use the same origin-wide lock; unsupported contexts fail closed. */
export async function serializedWrite<T>(write: () => T): Promise<T> {
  if (!navigator.locks?.request) throw new LockUnavailable();
  return navigator.locks.request(`${STORAGE_KEY}.write`, { mode: 'exclusive' }, write);
}
