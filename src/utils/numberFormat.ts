import type { NumberFormatMode } from './uiPrefs';

export function formatWholeGrouping(whole: bigint, mode: NumberFormatMode): string {
  const digits = (whole < 0n ? -whole : whole).toString();
  if (digits.length <= 3) return digits;

  if (mode === 'intl') {
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  // Pakistani / South Asian lakh-crore grouping: last 3 digits, then groups of 2.
  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);
  const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${groupedRest},${lastThree}`;
}

export function formatMoney(
  paisa: number,
  currencyLabel: string,
  mode: NumberFormatMode = 'pk'
): string {
  if (!Number.isSafeInteger(paisa)) throw new RangeError('Inexact money');
  const absolute = BigInt(paisa) < 0n ? -BigInt(paisa) : BigInt(paisa);
  const whole = formatWholeGrouping(absolute / 100n, mode);
  const fraction = String(absolute % 100n).padStart(2, '0');
  return `${currencyLabel} ${whole}.${fraction}`;
}
