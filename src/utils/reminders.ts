import type { Customer } from '../models/customer';
import { translate } from '../i18n';
import { latinDigits } from './phone';
import { money } from './money';
export function reminderMessage(customer: Customer, balance: number): string {
  // Roman Urdu deliberately stays identical in both interface languages.
  return translate('en', 'reminderTemplate', { name: customer.name, amount: money(balance, translate('en', 'currencyLabel')) });
}
export function whatsAppPhone(phone: string): string | null {
  let digits = latinDigits(phone).replace(/[^0-9]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}
export function reminderLink(customer: Customer, balance: number, whatsapp: boolean): string | null {
  if (balance <= 0) return null;
  const phone = whatsapp ? whatsAppPhone(customer.phone) : latinDigits(customer.phone).replace(/[^0-9+]/g, '');
  if (!phone) return null;
  const message = reminderMessage(customer, balance);
  return whatsapp ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}` : `sms:${phone}?body=${encodeURIComponent(message)}`;
}
