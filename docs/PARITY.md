# Flutter parity contract

## Source audit

Read before implementation: README.md, lib/models/ledger.dart, lib/providers/ledger_provider.dart, every lib/screens file, lib/widgets/common.dart, lib/main.dart, and all lib/utils files. There is **no `lib/l10n` directory**; `lib/utils/strings.dart` is the localization source. The 61 existing keys in each language were extracted exactly into `src/i18n/en.json` and `ur.json`. English/Urdu language labels and the currency label were centralized from Flutter's inline labels. Additional preview-only keys are separate.

## Data mapping (unchanged)

| Flutter | TypeScript | Fields |
| --- | --- | --- |
| Customer | Customer | id, name, phone, note |
| LedgerTransaction | LedgerTransaction | id, customerId, kind, amountPaisa, date, createdAt, note |
| TransactionKind | TransactionKind | credit / payment |
| AppSettings | AppSettings | language: en / ur; darkMode: boolean |
| Ledger | Ledger | customers, transactions, settings |

Dates use Flutter-compatible ISO strings in JSON. No balance is stored on a customer. Credit increases the balance; payment decreases it; overpayment is permitted. Positive is receivable (red); negative is payable (green); zero is settled. Outstanding sums only positive customer balances; advances are totaled separately. History sorts ascending by date, createdAt, then ID, with the display reversed in Step 2. Running balances are calculated before display reversal.

Amounts use integer paisa. Maximum per entry is 999999999999 paisa. Parsing accepts Western, Arabic and Urdu digits, a decimal point, and up to two decimal places. It rejects comma separators, exponent notation, zero and negative amounts, matching Flutter. Western money formatting uses `Rs`, commas and two decimal places in both locales.

JavaScript safety detail: aggregations throw if a total would exceed Number.MAX_SAFE_INTEGER instead of silently rounding. This does not change normal ledger arithmetic; Dart native integers have a larger exact range. Preserve this guard in the web preview rather than accepting inaccurate totals.

The JSON codec keeps schemaVersion 1, exportedAt, customers, transactions and settings. It rejects files above 20 MB, invalid types/settings/amounts, duplicate IDs and orphan transactions. Like the Dart decoder, it ignores unknown object fields. The upload/download interface is implemented in Step 2. Normal browser dates are used; exotic invalid ISO date normalization can differ from Dart.

## Form rules implemented in Step 2

- Name: trim, required, max 100 characters.
- Phone: trim; `^\+?[0-9 ()\-]{7,30}$`; 7–15 digits, max 30 characters; display LTR.
- Note: optional, max 500 characters, save trimmed.
- Date: today or earlier, earliest 1900-01-01.
- Customer deletion: confirm with existing deleteCustomer/deleteWarning strings; remove all associated transactions.
- Reminders only for positive balances. Preserve exact Roman Urdu template, including the customer's name, `Rs` prefix and two decimal places. Pakistani `03` numbers normalize to `92`; international / 00 prefixes follow the Flutter helper.
- Restore replaces customers, transactions **and settings** only after validation and explicit confirmation.

## Milestone boundaries

Step 1 established the foundation. Step 2 implements all listed screens/features using the same field names, validation, balance rules and existing app text. Demo/reset are explicitly web-preview controls; sample names/notes are localized when loaded and are then stored as customer data. Date input uses the browser date picker rather than Flutter’s Material date picker. Reminders display the exact message before handing off to a messaging app; browser app-install detection is not reliable. Export uses a browser download and reports that the download started rather than claiming a completed filesystem save. Step 3 polishes the preview after feedback. No milestone edits Flutter without a separate instruction.
