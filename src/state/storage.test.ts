import { test, expect } from 'vitest';
import { readLedger, writeLedger } from './storage';
import { emptyLedger } from '../models/ledger';
test('settings and data survive a storage reload', () => {
  const memory = new Map<string, string>();
  const storage = { getItem: (key: string) => memory.get(key) ?? null,
    setItem: (key: string, value: string) => { memory.set(key, value); } };
  const saved = { ...emptyLedger(), settings: { language: 'ur' as const, darkMode: true } };
  writeLedger(storage, saved);
  expect(readLedger(storage)).toEqual(saved);
});
test('unreadable data is rejected rather than silently reset', () => {
  expect(() => readLedger({ getItem: () => 'broken json' })).toThrow();
});
