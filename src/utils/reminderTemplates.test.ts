import { describe, expect, test } from 'vitest';
import type { Customer } from '../models/customer';
import {
  buildCustomReminderLink,
  formatReminderWithTemplate,
  REMINDER_PRESETS,
} from './reminderTemplates';

describe('reminderTemplates', () => {
  const customer: Customer = { id: 'c1', name: 'Sana', phone: '03001234567', note: '' };

  test('replaces {name} and {amount} placeholders in custom templates', () => {
    const msg = formatReminderWithTemplate(REMINDER_PRESETS.en, 'Sana', 'Rs 75,83,535.00');
    expect(msg).toContain('Sana');
    expect(msg).toContain('Rs 75,83,535.00');
  });

  test('falls back to default template when custom template is null', () => {
    const msg = formatReminderWithTemplate(null, 'Sana', 'Rs 500.00');
    expect(msg).toBe('Assalam o Alaikum Sana, aap ka Rs 500.00 baqaya hai. Meherbani farma kar ada kar dein. Shukriya.');
  });

  test('builds WhatsApp link with custom Urdu template', () => {
    const link = buildCustomReminderLink(customer, 758353500, true, REMINDER_PRESETS.ur, 'pk', 'Rs');
    expect(link).toContain('https://wa.me/923001234567?text=');
    expect(decodeURIComponent(link!)).toContain('Rs 75,83,535.00');
  });
});
