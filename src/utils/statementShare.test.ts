import { describe, expect, test } from 'vitest';
import type { Customer } from '../models/customer';
import type { HistoryEntry } from './balance';
import { buildStatementWhatsAppText, statementWhatsAppLink } from './statementShare';

describe('statementShare', () => {
  const customer: Customer = { id: 'c1', name: 'Ali Khan', phone: '03001234567', note: '' };
  const history: HistoryEntry[] = Array.from({ length: 25 }, (_, i) => ({
    transaction: {
      id: `t${i + 1}`,
      customerId: 'c1',
      kind: i % 2 === 0 ? 'credit' : 'payment',
      amountPaisa: (i + 1) * 10000,
      date: `2026-11-${String((i % 25) + 1).padStart(2, '0')}T10:00:00.000`,
      createdAt: '2026-11-01T10:00:00.000Z',
      note: '',
    },
    balancePaisa: 100000,
  }));

  test('includes only last 20 entries and formats numbers according to preference', () => {
    const text = buildStatementWhatsAppText(customer, history, 758353500, 'Rs', 'pk', 'en');
    expect(text).toContain('Ali Khan');
    expect(text).toContain('Rs 75,83,535.00');
    expect(text).toContain('Last 20 entries');
    expect(text.match(/^• /gm)).toHaveLength(20);
  });

  test('builds wa.me link with normalized Pakistani phone', () => {
    const link = statementWhatsAppLink(customer, history, 100000, 'Rs', 'intl', 'en');
    expect(link).toContain('https://wa.me/923001234567?text=');
  });
});
