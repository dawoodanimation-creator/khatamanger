import { test, expect } from 'vitest';
import { reminderLink, reminderMessage, whatsAppPhone } from './reminders';
const customer = { id: 'ali', name: 'Ali Khan', phone: '03001234567', note: '' };
test('reminder preserves Flutter Roman Urdu text and exact paisa display', () => {
  expect(reminderMessage(customer, 12345)).toBe('Assalam o Alaikum Ali Khan, aap ka Rs 123.45 baqaya hai. Meherbani farma kar ada kar dein. Shukriya.');
});
test('WhatsApp normalizes Pakistani and international prefixes', () => {
  expect(whatsAppPhone('0300 123-4567')).toBe('923001234567');
  expect(whatsAppPhone('+923001234567')).toBe('923001234567');
  expect(whatsAppPhone('00923001234567')).toBe('923001234567');
  expect(whatsAppPhone('+971501234567')).toBe('971501234567');
  expect(whatsAppPhone('01234567')).toBeNull();
});
test('share links encode text and are unavailable for settled/payable balances', () => {
  const link = new URL(reminderLink(customer, 12345, true)!);
  expect(link.origin + link.pathname).toBe('https://wa.me/923001234567');
  expect(link.searchParams.get('text')).toBe(reminderMessage(customer, 12345));
  expect(decodeURIComponent(reminderLink(customer, 12345, false)!)).toBe(`sms:03001234567?body=${reminderMessage(customer, 12345)}`);
  expect(reminderLink(customer, 0, true)).toBeNull();
  expect(reminderLink(customer, -100, false)).toBeNull();
});
