import { maxAmountPaisa } from '../models/ledger';
export function parseAmount(input: string): number | null {
  const normalized = input.trim().replace(/[٠-٩۰-۹]/g, digit => {
    const code = digit.charCodeAt(0);
    return String(code >= 0x6f0 ? code - 0x6f0 : code - 0x660);
  });
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ''] = normalized.split('.');
  const value = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return value > 0 && value <= maxAmountPaisa ? value : null;
}
const wholeFormatter = new Intl.NumberFormat('en', { maximumFractionDigits: 0 });
/** Currency label comes from i18n, even when formatting outside React. */
export function money(paisa: number, currencyLabel: string): string {
  if (!Number.isSafeInteger(paisa)) throw new RangeError('Inexact money');
  const absolute = BigInt(paisa) < 0n ? -BigInt(paisa) : BigInt(paisa);
  const whole = wholeFormatter.format(absolute / 100n);
  return `${currencyLabel} ${whole}.${String(absolute % 100n).padStart(2, '0')}`;
}
