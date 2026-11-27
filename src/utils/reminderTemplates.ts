import type { Customer } from '../models/customer';
import type { ProfileSettings } from '../models/ledger';
import { translate } from '../i18n';
import { formatMoney } from './numberFormat';
import { latinDigits } from './phone';
import { whatsAppPhone } from './reminders';
import type { NumberFormatMode } from './uiPrefs';

export const REMINDER_PRESETS = {
  en: 'Assalam o Alaikum {name}, your balance of {amount} is due. Please pay at your earliest convenience. Thank you.',
  ur: 'السلام علیکم {name}، آپ کے ذمے {amount} بقایا ہے۔ برائے مہربانی جلد ادائیگی فرما دیں۔ شکریہ۔',
  roman:
    'Assalam o Alaikum {name}, aap ka {amount} baqaya hai. Meherbani farma kar ada kar dein. Shukriya.',
} as const;

export function formatReminderWithTemplate(
  template: string | null,
  customerName: string,
  formattedAmount: string
): string {
  if (!template || !template.trim()) {
    return translate('en', 'reminderTemplate', { name: customerName, amount: formattedAmount });
  }
  return template.replace(/\{name\}/g, customerName).replace(/\{amount\}/g, formattedAmount);
}

export function buildCustomReminderMessage(
  customer: Customer,
  balance: number,
  template: string | null,
  numberFormat: NumberFormatMode,
  currencyLabel: string,
  profile?: ProfileSettings
): string {
  const formattedAmount = formatMoney(balance, currencyLabel, numberFormat);
  const base = formatReminderWithTemplate(template, customer.name, formattedAmount);
  const sigParts = [profile?.shopName, profile?.ownerName, profile?.phone].filter(Boolean);
  return sigParts.length > 0 ? `${base} (${sigParts.join(' - ')})` : base;
}

export function buildCustomReminderLink(
  customer: Customer,
  balance: number,
  whatsapp: boolean,
  template: string | null,
  numberFormat: NumberFormatMode,
  currencyLabel: string,
  profile?: ProfileSettings
): string | null {
  if (balance <= 0) return null;
  const phone = whatsapp
    ? whatsAppPhone(customer.phone)
    : latinDigits(customer.phone).replace(/[^0-9+]/g, '');
  if (!phone) return null;
  const message = buildCustomReminderMessage(
    customer,
    balance,
    template,
    numberFormat,
    currencyLabel,
    profile
  );
  return whatsapp
    ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    : `sms:${phone}?body=${encodeURIComponent(message)}`;
}
