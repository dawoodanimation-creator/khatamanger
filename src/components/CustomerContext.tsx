import type { Customer } from '../models/customer';
/** Same identity at entry, review and destructive confirmation. */
export function CustomerContext({ customer }: { customer: Customer }) {
  return <div className="customer-context"><strong dir="auto">{customer.name}</strong><p><bdi dir="ltr">{customer.phone}</bdi></p></div>;
}
