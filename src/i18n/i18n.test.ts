import { test, expect } from 'vitest';
import en from './en.json';
import ur from './ur.json';
test('both dictionaries provide the same nonempty keys', () => {
  expect(Object.keys(en).sort()).toEqual(Object.keys(ur).sort());
  for (const value of [...Object.values(en), ...Object.values(ur)]) expect(value.trim()).not.toBe('');
});
test('core Flutter labels and Roman Urdu reminder stay exact', () => {
  expect(en.credit).toBe('Udhaar Diya');
  expect(en.payment).toBe('Payment Mili');
  expect(en.search).toBe('Search name or phone');
  expect(ur.app).toBe('کھاتہ مینیجر');
  expect(en.reminderTemplate).toBe('Assalam o Alaikum {name}, aap ka {amount} baqaya hai. Meherbani farma kar ada kar dein. Shukriya.');
  expect(ur.reminderTemplate).toBe(en.reminderTemplate);
});
