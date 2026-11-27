import type { TranslationKey } from '../i18n';
import { maxAmountPaisa } from '../models/ledger';
import type { Customer } from '../models/customer';
import { validPhone } from './phone';

export type CustomerErrors = Partial<
  Record<
    'name' | 'phone' | 'note' | 'address' | 'whatsappPhone' | 'creditLimit' | 'defaultDueDays' | 'category',
    TranslationKey
  >
>;

export function validateCustomer(
  customer: Pick<
    Customer,
    'name' | 'phone' | 'note' | 'address' | 'whatsappPhone' | 'creditLimitPaisa' | 'defaultDueDays' | 'category'
  >
): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!customer.name.trim() || customer.name.trim().length > 100) errors.name = 'nameRequired';
  if (!validPhone(customer.phone)) errors.phone = 'phoneInvalid';
  if (customer.note.length > 500) errors.note = 'noteInvalid';
  if (customer.category !== undefined && customer.category.trim().length > 60) {
    errors.category = 'categoryInvalid';
  }
  if (customer.address !== undefined && customer.address.length > 200) {
    errors.address = 'addressInvalid';
  }
  if (customer.whatsappPhone !== undefined && customer.whatsappPhone.trim().length > 0) {
    if (!validPhone(customer.whatsappPhone)) errors.whatsappPhone = 'phoneInvalid';
  }
  if (customer.creditLimitPaisa !== undefined) {
    if (
      !Number.isInteger(customer.creditLimitPaisa) ||
      customer.creditLimitPaisa <= 0 ||
      customer.creditLimitPaisa > maxAmountPaisa
    ) {
      errors.creditLimit = 'creditLimitInvalid';
    }
  }
  if (customer.defaultDueDays !== undefined) {
    if (
      !Number.isInteger(customer.defaultDueDays) ||
      customer.defaultDueDays < 1 ||
      customer.defaultDueDays > 3650
    ) {
      errors.defaultDueDays = 'dueDaysInvalid';
    }
  }
  return errors;
}
