import type { TranslationKey } from '../i18n';
import { validPhone } from './phone';
import type { Customer } from '../models/customer';
export type CustomerErrors = Partial<Record<'name' | 'phone' | 'note', TranslationKey>>;
export function validateCustomer(customer: Pick<Customer, 'name' | 'phone' | 'note'>): CustomerErrors {
  const errors: CustomerErrors = {};
  if (!customer.name.trim() || customer.name.trim().length > 100) errors.name = 'nameRequired';
  if (!validPhone(customer.phone)) errors.phone = 'phoneInvalid';
  if (customer.note.length > 500) errors.note = 'noteInvalid';
  return errors;
}
