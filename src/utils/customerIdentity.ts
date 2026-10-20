import type { Customer } from '../models/customer';
import { comparablePhone } from './phone';
export function likelyDuplicates(customers: Customer[], customer: Pick<Customer, 'id' | 'name' | 'phone'>): Customer[] {
  const name = customer.name.trim().normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ');
  return customers.filter(c => c.id !== customer.id && c.name.trim().normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ') === name && comparablePhone(c.phone) === comparablePhone(customer.phone));
}
