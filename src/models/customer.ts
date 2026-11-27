/** Mirrors lib/models/ledger.dart Customer with additive optional v2 fields. */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  note: string;
  category?: string;
  address?: string;
  whatsappPhone?: string;
  creditLimitPaisa?: number;
  defaultDueDays?: number;
}
