import { describe, expect, test } from 'vitest';
import { formatMoney, formatWholeGrouping } from './numberFormat';

describe('numberFormat', () => {
  test('formats Pakistani lakh/crore grouping accurately', () => {
    expect(formatWholeGrouping(0n, 'pk')).toBe('0');
    expect(formatWholeGrouping(999n, 'pk')).toBe('999');
    expect(formatWholeGrouping(1234n, 'pk')).toBe('1,234');
    expect(formatWholeGrouping(7583535n, 'pk')).toBe('75,83,535');
    expect(formatWholeGrouping(9999999n, 'pk')).toBe('99,99,999');
    expect(formatWholeGrouping(123456789n, 'pk')).toBe('12,34,56,789');
  });

  test('formats International grouping accurately', () => {
    expect(formatWholeGrouping(7583535n, 'intl')).toBe('7,583,535');
    expect(formatWholeGrouping(9999999n, 'intl')).toBe('9,999,999');
  });

  test('formatMoney formats paisa with currency label and 2 decimals', () => {
    expect(formatMoney(758353550, 'Rs', 'pk')).toBe('Rs 75,83,535.50');
    expect(formatMoney(758353550, 'Rs', 'intl')).toBe('Rs 7,583,535.50');
    expect(formatMoney(-999999900, 'Rs', 'pk')).toBe('Rs 99,99,999.00');
  });
});
