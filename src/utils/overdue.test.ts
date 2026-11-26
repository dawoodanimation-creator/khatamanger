import { describe, expect, test } from 'vitest';
import type { LedgerTransaction } from '../models/transaction';
import { calculateCustomerOverdue } from './overdue';

function tx(
  id: string,
  kind: 'credit' | 'payment',
  amountPaisa: number,
  date: string,
  dueDate?: string
): LedgerTransaction {
  return {
    id,
    customerId: 'c1',
    kind,
    amountPaisa,
    date,
    createdAt: `${date}Z`,
    note: '',
    dueDate,
  };
}

describe('calculateCustomerOverdue (FIFO)', () => {
  const today = '2026-11-26';

  test('handles no due dates and future due dates', () => {
    const res = calculateCustomerOverdue(
      [
        tx('1', 'credit', 50000, '2026-11-01T10:00:00.000'),
        tx('2', 'credit', 30000, '2026-11-10T10:00:00.000', '2026-11-26'),
      ],
      today
    );
    expect(res.isOverdue).toBe(false);
    expect(res.overdueTotalPaisa).toBe(0);
    expect(res.earliestDueDate).toBeNull();
  });

  test('applies partial payment to oldest credit first', () => {
    const res = calculateCustomerOverdue(
      [
        tx('1', 'credit', 100000, '2026-11-01T10:00:00.000', '2026-11-10'),
        tx('2', 'credit', 50000, '2026-11-05T10:00:00.000', '2026-11-15'),
        tx('3', 'payment', 60000, '2026-11-08T10:00:00.000'),
      ],
      today
    );
    expect(res.isOverdue).toBe(true);
    expect(res.overdueTotalPaisa).toBe(90000);
    expect(res.earliestDueDate).toBe('2026-11-10');
    expect(res.overdueCredits.get('1')).toEqual({ dueDate: '2026-11-10', unpaidPaisa: 40000 });
    expect(res.overdueCredits.get('2')).toEqual({ dueDate: '2026-11-15', unpaidPaisa: 50000 });
  });

  test('exact payment clears oldest overdue credit completely', () => {
    const res = calculateCustomerOverdue(
      [
        tx('1', 'credit', 100000, '2026-11-01T10:00:00.000', '2026-11-10'),
        tx('2', 'credit', 50000, '2026-11-05T10:00:00.000', '2026-11-28'),
        tx('3', 'payment', 100000, '2026-11-12T10:00:00.000'),
      ],
      today
    );
    expect(res.isOverdue).toBe(false);
    expect(res.overdueTotalPaisa).toBe(0);
    expect(res.overdueCredits.size).toBe(0);
  });

  test('multiple credits with overpayment spilling into second credit', () => {
    const res = calculateCustomerOverdue(
      [
        tx('1', 'credit', 100000, '2026-11-01T10:00:00.000', '2026-11-05'),
        tx('2', 'credit', 80000, '2026-11-03T10:00:00.000', '2026-11-12'),
        tx('3', 'payment', 130000, '2026-11-15T10:00:00.000'),
      ],
      today
    );
    expect(res.isOverdue).toBe(true);
    expect(res.overdueCredits.has('1')).toBe(false);
    expect(res.overdueCredits.get('2')).toEqual({ dueDate: '2026-11-12', unpaidPaisa: 50000 });
    expect(res.overdueTotalPaisa).toBe(50000);
    expect(res.earliestDueDate).toBe('2026-11-12');
  });
});
