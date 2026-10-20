/** Shared input/search/share normalization. Keep the customer's display formatting. */
export function latinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, digit => String(digit.charCodeAt(0) >= 0x6f0 ? digit.charCodeAt(0) - 0x6f0 : digit.charCodeAt(0) - 0x660));
}
export function validPhone(value: string): boolean {
  const normalized = latinDigits(value.trim());
  const count = normalized.replace(/\D/g, '').length;
  return /^\+?[0-9 ()\-]{7,30}$/.test(normalized) && count >= 7 && count <= 15;
}
export function comparablePhone(value: string): string {
  let digits = latinDigits(value).replace(/\D/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (/^03\d{9}$/.test(digits)) digits = `92${digits.slice(1)}`;
  if (/^3\d{9}$/.test(digits)) digits = `92${digits}`;
  return digits;
}
export function phoneMatches(phone: string, query: string): boolean {
  if (!/^[+\d٠-٩۰-۹ ()-]+$/.test(query)) return false;
  const needle = comparablePhone(query);
  if (!needle) return false;
  const rawHaystack = latinDigits(phone).replace(/\D/g, '');
  const rawNeedle = latinDigits(query).replace(/\D/g, '');
  const canonical = comparablePhone(phone);
  const local = /^923\d{9}$/.test(canonical) ? `0${canonical.slice(2)}` : canonical;
  return rawHaystack.includes(rawNeedle) || canonical.includes(needle) || local.includes(rawNeedle);
}
