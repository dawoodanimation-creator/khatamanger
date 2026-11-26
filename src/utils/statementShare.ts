import type { Customer } from '../models/customer';
import type { Language } from '../models/ledger';
import type { HistoryEntry } from './balance';
import { localDate } from './dates';
import { formatMoney } from './numberFormat';
import { whatsAppPhone } from './reminders';
import type { NumberFormatMode } from './uiPrefs';

export function buildStatementWhatsAppText(
  customer: Customer,
  history: HistoryEntry[],
  currentBalance: number,
  currencyLabel: string,
  numberFormat: NumberFormatMode,
  language: Language
): string {
  const isUrdu = language === 'ur';
  const recent = history.slice(-20);
  const lines: string[] = [];

  lines.push(
    isUrdu
      ? `*کھاتہ مینیجر - حساب کی تفصیل*`
      : `*Khata Manager - Account Statement*`
  );
  lines.push(`${isUrdu ? 'گاہک' : 'Customer'}: ${customer.name}`);
  lines.push(
    `${isUrdu ? 'موجودہ بقایا' : 'Current balance'}: ${formatMoney(
      currentBalance,
      currencyLabel,
      numberFormat
    )}`
  );
  lines.push('');

  if (recent.length > 0) {
    lines.push(isUrdu ? `*آخری ${recent.length} اندراجات:*` : `*Last ${recent.length} entries:*`);
    for (const entry of recent) {
      const tx = entry.transaction;
      const sign = tx.kind === 'credit' ? '+' : '-';
      const label =
        tx.kind === 'credit'
          ? isUrdu
            ? 'ادھار'
            : 'Udhaar'
          : isUrdu
          ? 'وصولی'
          : 'Payment';
      lines.push(
        `• ${localDate(tx.date, language)} | ${label} ${sign}${formatMoney(
          tx.amountPaisa,
          currencyLabel,
          numberFormat
        )}`
      );
    }
  }

  return lines.join('\n');
}

export function statementWhatsAppLink(
  customer: Customer,
  history: HistoryEntry[],
  currentBalance: number,
  currencyLabel: string,
  numberFormat: NumberFormatMode,
  language: Language
): string {
  const text = buildStatementWhatsAppText(
    customer,
    history,
    currentBalance,
    currencyLabel,
    numberFormat,
    language
  );
  const phone = whatsAppPhone(customer.phone);
  return phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;
}
