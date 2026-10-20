# Preview → Flutter change log

The Flutter app at `/workspace/khata_manager` is read-only. This file tracks preview work and subsequent owner-requested changes. A preview baseline is **not** approval to apply it to Flutter.

## Status legend

`Preview baseline` · `Requested` · `Implemented in preview` · `Approved for Flutter` · `Applied to Flutter`

## Preview baseline — Step 1

- **Status:** Preview baseline
- **Request:** Create a separate mobile-first web preview, in three gated steps.
- **Implemented:** Vite/React/TypeScript/Tailwind/react-router; phone frame; navigation; exact model field mapping; integer-paisa calculations; English/Urdu JSON translations; localStorage settings; shared light/dark tokens; bundled Inter and Noto Nastaliq Urdu; milestone placeholders.
- **Visual baseline:** Retains the Flutter seed color `#086b57`, red receivables and green payables. A green outstanding card, book mark, warmer surfaces, rounded controls and an empty-state ledger illustration establish the requested web-review direction. Desktop phone hardware and review labels exist outside the app content.
- **Preserved:** All existing localized app strings, field names, amount parsing, balance direction, receivable/payable totals, history ordering and JSON schema.
- **Web-only behavior:** localStorage instead of Hive; route URLs instead of Flutter navigation. Balance totals fail rather than silently round beyond JavaScript's exact integer range.
- **Flutter targets if later approved:** lib/main.dart (ThemeData/font setup); lib/screens/home_screen.dart (summary card and spacing); lib/widgets/common.dart (shared visual components). Use src/theme/tokens.ts as the design-token source.
- **Do not port:** Phone frame, preview-only notices, development routes or browser storage.
- **Validation:** Ported balance and backup validation cases; storage/i18n checks; TypeScript and production build. See README for current milestone boundaries.
- **Flutter action:** None. Await review and a separate instruction.

## Owner-requested changes

Owner requests are recorded below as KM-001, KM-002 and KM-003. Earlier milestone records are retained as history.

Append one record for every subsequent request; never rewrite prior approval history:

```text
ID: KM-001
Request / date:
Screen / component:
Before:
Requested after:
Preview files changed:
Model / behavior / text impact:
English and Urdu copy:
Token changes:
Acceptance checks / results:
Status:
Flutter files and exact application steps:
Approval reference:
Applied to Flutter / verification:
```

## Original milestone plan (completed)

- Step 2: all forms/screens, customer/transaction persistence, reminders, backup/restore, demo/reset review controls.
- Step 3: responsive/dark/RTL polish and completed Flutter handoff notes.

The owner subsequently requested all remaining steps be completed; that approval is recorded in KM-003.

## KM-001 — Mobile review link

- **Request:** Provide an online preview link usable from a mobile phone; return to Flutter only after the web design is finalized.
- **Status:** Approved for preview hosting; no Flutter changes authorized.
- **Before:** Vite preview required a local machine or forwarded port.
- **After:** Publish the existing Step 1 preview with Sites using owner-private access.
- **Files:** `.openai/hosting.json`, `public/_redirects`, and preview documentation.
- **Behavior / text:** No app features or labels changed. SPA routing fallback supports direct route navigation. Existing localStorage remains browser-local and independent per origin/device.
- **Acceptance:** Existing tests/build; source push; deployment returns success and a live URL.
- **Flutter application:** None; this is web-hosting configuration only.


## KM-002 — Step 2 screens and features

- **Request / approval:** Owner said `Continue` after reviewing the mobile Step 1 preview.
- **Status:** Implemented in preview; not approved/applied to Flutter.
- **Before:** Add/edit/detail/transaction/backup routes were milestone placeholders; only language/theme were editable.
- **After:** Customer create/edit/delete, credit/payment forms, newest-first transaction history with chronological running balances, exact reminder message and external links, validated JSON download/upload, and confirmed demo/reset controls. All records and settings survive refresh in localStorage.
- **Preview files:** src/screens/CustomerForm.tsx, CustomerDetail.tsx, TransactionForm.tsx, Backup.tsx; src/state/LedgerContext.tsx and mutations.ts; src/components/Modal.tsx and ReviewControls.tsx; utility validation/date/demo/reminder/file helpers; App routes, Home and Settings.
- **Data impact:** Customer/transaction/settings fields and JSON schema version 1 are unchanged. Deletion cascades to customer transactions. Import replaces all records and settings after validation/confirmation. Demo/reset preserve existing settings. Failed persistence keeps the form and current ledger intact.
- **Text:** All 61 original strings per locale remain exact. Added localized preview-only confirmation/status/date-validation/demo text. Roman Urdu reminders remain byte-for-byte equivalent to Flutter for the same name and balance.
- **Design/tokens:** Existing green direction retained. Added semantic danger/overlay colors and modal geometry tokens. New forms use existing control sizing; transaction cards show type, date, note, signed amount and running balance. Dialogs use native browser focus/escape support.
- **Web-specific behavior:** Browser file download/upload replaces Android's document picker. Export reports download started. Messaging links cannot reliably detect app installation. Demo controls and the phone frame should not be ported unless separately requested.
- **Acceptance checks:** 34 Vitest tests including 11 DOM feature-flow tests; TypeScript check; production build; translation parity and Flutter source hash checks. Native phone handoffs/visual rendering require owner review.
- **Flutter targets if changes are later approved:** lib/screens/customer_form_screen.dart (form layout), customer_detail_screen.dart (summary/cards/reminder preview), transaction_form_screen.dart (entry help/layout), settings_screen.dart (grouping), lib/widgets/common.dart (shared confirmation/balance styling), lib/main.dart (tokens). Existing business logic already matches; do not replace Hive with browser storage or add preview-only controls.
- **Flutter action:** None. Await Step 3/review feedback and explicit Flutter-port approval.


## KM-003 — Complete final polish and handoff

- **Request / approval:** Owner said “All steps ko complete karo.”
- **Status:** All three preview steps complete. Flutter remains unchanged and the visual port still requires an explicit instruction.
- **Before:** Functional Step 2 preview; detailed browser responsive/RTL/dark/focus checks and handoff were pending.
- **After:** Mobile input text avoids the common focus-zoom trigger; theme-switch hit area is 48px; Urdu heading spacing and English numeric isolation are corrected; safe-area padding and long-content wrapping are added. Navigation starts at the new screen's heading. Invalid forms focus the first field. Native dialogs explicitly focus Cancel, lock background scrolling, close with Escape and return focus to the trigger.
- **Observed browser fixes:** A long imported customer name caused horizontal overflow in the transaction explanation panel; it now wraps within a min-width-zero flex child. React's autoFocus did not reliably focus Cancel when a native dialog opened; an explicit post-showModal focus now does.
- **Preview files:** src/styles.css, src/theme/tokens.ts, App.tsx, components/Modal.tsx, Home.tsx, Settings.tsx, CustomerForm.tsx, TransactionForm.tsx; Playwright configuration/tests; docs/FLUTTER_HANDOFF.md and reference screenshots.
- **Text / data:** Original 61 Flutter strings per locale and all ledger fields/business rules remain unchanged. Only preview milestone labels indicate completion.
- **Tokens:** Input size 16; secondary small text 14 and smallest supporting text 12; min-width for wrapping identity; existing palette and component radii retained. Normal text/status pairs are checked for WCAG AA contrast in light and dark themes.
- **Acceptance:** Final unit/DOM/contrast suite; Chromium viewport/theme/locale matrix; actual download/upload/refresh flow; dialog focus/Escape/focus return; zoom/overflow; build and translation/hash parity. Screenshots are checked in docs/screenshots. Exact final results and hardware limits are in docs/VALIDATION.md.
- **Flutter application:** Follow docs/FLUTTER_HANDOFF.md after approval; adapt the visual layout/tokens only, retain Hive/Riverpod and native file/messaging integrations. Do not port the phone frame or preview controls.


## Audit remediation — 19 October 2026 (Pakistan time)

Owner instruction: continue after Step 1, fix existing P0 then P1 at the root; no new features and no Flutter edits. The earlier baseline claims about unchanged strings and validation are historical; the records below explicitly supersede them for these audit fixes. P2 A-16/17 and BL-01–13 remain unimplemented. These remediation changes are local only; the hosted preview has not been updated because Sites packaging is unavailable. See VERIFICATION.md. No Flutter approval is implied.

### A-01 — P0 — Repository / all writes

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** A stale tab overwrote complete snapshots, silently losing entries.
- **After / root fix:** Serialize every write with an origin-wide Web Lock, re-read saved data inside it, patch only changed settings, and reject stale identity/balance/destructive confirmations. Conflicts retain form input. Unsupported lock contexts fail closed with a localized explanation.
- **Preview files:** src/state/LedgerContext.tsx; src/state/storage.ts; all mutation callers
- **Model / behavior:** Web-specific locking/revision checks; ledger/backup schema stays 1.
- **English / Urdu copy:** conflictError, lockUnavailable, saveNotCompleted; both locales
- **Tokens:** No token change.
- **Acceptance:** Concurrent browser additions (with explicit retry if balance changed), mixed settings, stale delete/restore, no-lock and quota regressions.
- **Flutter application after separate approval:** Use one serialized Hive repository boundary; compare transaction review/customer revision and destructive confirmation snapshot. Do not port navigator.locks/localStorage.
- **Applied to Flutter:** No; project not accessed or modified.

### A-02 — P0 — Startup / backup recovery

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Corrupt localStorage blocked every route including existing import.
- **After / root fix:** Offer existing restore from the startup error, permit validated/confirmed recovery, and quarantine the unreadable raw value before replacement. A failed quarantine/write never silently wipes the original.
- **Preview files:** src/App.tsx; src/state/LedgerContext.tsx; src/screens/Backup.tsx
- **Model / behavior:** Extra web-only quarantine key; no new recovery service or backup feature.
- **English / Urdu copy:** previewStorageError; both locales
- **Tokens:** Existing controls/tokens reused.
- **Acceptance:** Browser: bad import and Cancel preserve raw corruption; valid confirmed import restores data and preserves a raw quarantine copy.
- **Flutter application after separate approval:** Route Hive-open failure to existing native restore; preserve unreadable storage before replacement. Keep native file pickers.
- **Applied to Flutter:** No; project not accessed or modified.

### A-03 — P0 — Shared money formatter

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** An accepted safe-integer total ending .91 displayed .90.
- **After / root fix:** Split BigInt integer paisa into grouped whole rupees and a two-digit remainder. Reuse the formatter instance.
- **Preview files:** src/utils/money.ts
- **Model / behavior:** Formatting only; no floating division, rounding policy or currency change.
- **English / Urdu copy:** Existing currencyLabel only
- **Tokens:** None.
- **Acceptance:** 9,008-entry accepted backup totals MAX_SAFE_INTEGER and displays .91, positive/negative/zero/minimum checks.
- **Flutter application after separate approval:** Format integer quotient/remainder in Dart; do not route money through double.
- **Applied to Flutter:** No; project not accessed or modified.

### A-04 — P0 — Backup validation

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Date.parse normalized February 30; arbitrary phone text passed.
- **After / root fix:** Validate ISO shape and the actual calendar day, timestamp fields and supported year range. Reuse shared phone validation before any restore confirmation/write.
- **Preview files:** src/utils/backup.ts; src/utils/dates.ts; src/utils/phone.ts
- **Model / behavior:** Schema stays 1. Supported forms: ISO date-only, local ISO timestamp, Z/offset ISO timestamp. Malformed/non-ISO dates and invalid phone strings reject the whole backup.
- **English / Urdu copy:** Existing badBackup with simpler wording
- **Tokens:** None.
- **Acceptance:** Invalid dates/phones rejected; leap dates and documented timestamp variants accepted; invalid file leaves ledger unchanged.
- **Flutter application after separate approval:** Apply equivalent strict schema/calendar/phone validation before native restore, including leap-day cases. Do not silently normalize impossible days.
- **Applied to Flutter:** No; project not accessed or modified.

### A-05 — P0 — Customer routes

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Imported customer ID new collided with the add-customer route.
- **After / root fix:** Use canonical /customer/:id URLs for existing customer actions; retain /customers/new for creation and non-conflicting legacy customer routes.
- **Preview files:** src/utils/routes.ts; src/App.tsx
- **Model / behavior:** Browser routing only; imported IDs are preserved.
- **English / Urdu copy:** None
- **Tokens:** None.
- **Acceptance:** Reserved-ID fixture opens its detail and records credit successfully.
- **Flutter application after separate approval:** Keep create navigation distinct from any customer identifier; use typed native navigation arguments.
- **Applied to Flutter:** No; project not accessed or modified.

### A-06 — P1 — Home, forms, detail reminders, Settings backup

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Add was at the end of the list; ordinary Home tasks required four taps and nested screens.
- **After / root fix:** Keep existing Add sticky/reachable, focus the first entry field, expose existing reminder message/channel choices inline, and embed the existing backup controls in Settings while retaining the direct backup route.
- **Preview files:** src/screens/Home.tsx; CustomerForm.tsx; TransactionForm.tsx; CustomerDetail.tsx; Settings.tsx; Backup.tsx; src/App.tsx; src/styles.css
- **Model / behavior:** No quick-entry feature or new messaging capability. Human/IME/OS timing still requires verification.
- **English / Urdu copy:** Existing reminder and backup labels, saveCredit/savePayment
- **Tokens:** Existing sticky/safe-area tokens.
- **Acceptance:** Measured app taps: add/credit/payment 3 each, find/reminder handoff/backup download 2 each; no claim about completed OS Send or file-save actions.
- **Flutter application after separate approval:** Use a persistent Add action, first-field focus, inline native reminder choices and existing backup controls on Settings. Re-measure one-handed with Android keyboard.
- **Applied to Flutter:** No; project not accessed or modified.

### A-07 — P1 — Balances, list and persistence

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Repeated C×T scans, uncached formatters and row remounts stalled 500/5,000 records.
- **After / root fix:** Build and cache grouped balances/totals/history once per immutable record revision; memoize rows; let content-visibility window offscreen rendering. Retain memoized rows during search and use native hidden wrappers for unmatched records, excluding them from focus/accessibility. Serialize only at the persistence boundary.
- **Preview files:** src/utils/balance.ts; money.ts; src/state/mutations.ts; storage.ts; src/screens/Home.tsx; src/styles.css
- **Model / behavior:** All records remain available; no pagination, truncation or new filters. Browser-managed rendering windowing retains DOM nodes; it is not DOM recycling.
- **English / Urdu copy:** None
- **Tokens:** customerRowEstimate 94px; actual heights remain content-driven.
- **Acceptance:** Production CPU4x fixture: search/clear p95 under 200ms, Add visible, exact balances preserved. Raw samples/limits in verification-evidence/performance.json.
- **Flutter application after separate approval:** Derive a balance/history index once per Riverpod record revision; use ListView.builder and keyed widgets; retain full accessible search results. Do not copy CSS windowing to Flutter.
- **Applied to Flutter:** No; project not accessed or modified.

### A-08 — P1 — Transaction and customer-delete context

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Only a name identified an entry; generic delete warning omitted identity, balance and entry count.
- **After / root fix:** Shared CustomerContext displays name and phone on forms/review/delete. Delete also shows balance direction/amount and history count; Cancel remains initially focused.
- **Preview files:** src/components/CustomerContext.tsx; CustomerDetail.tsx; TransactionForm.tsx
- **Model / behavior:** No deletion policy change or undo feature.
- **English / Urdu copy:** Existing labels; untrusted identity text uses dir=auto and isolated phone.
- **Tokens:** Existing spacing/typography.
- **Acceptance:** Same customer phone is present at entry/deletion; delete confirmation identity, count, Cancel and isolated deletion checked.
- **Flutter application after separate approval:** Shared customer identity widget plus destructive summary; keep Cancel initial focus and cascade only chosen customer.
- **Applied to Flutter:** No; project not accessed or modified.

### A-09 — P1 — Transaction amount review / save

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Extra zero posted via a generic Save without a projected result.
- **After / root fix:** Inline exact amount/action/after-balance/customer review sits next to Save udhaar/payment. A balance changed since the shown review rejects the commit for review/retry; one stable transaction ID and immediate ref guard prevent duplicate activation.
- **Preview files:** src/screens/TransactionForm.tsx; src/state/LedgerContext.tsx
- **Model / behavior:** No arbitrary amount threshold, extra routine modal, correction or undo was introduced.
- **English / Urdu copy:** reviewEntry, saveCredit, savePayment, balanceRangeError; both locales
- **Tokens:** Review uses shared surface/border/spacing tokens.
- **Acceptance:** 1000 previews 1,000 and resulting 1,100 on a 100 balance; .01/overpayment math covered; double click posts once; concurrent reviewed-balance change cannot silently commit a different result.
- **Flutter application after separate approval:** Show formatted amount and projected signed balance with identity next to the commit action; use one transaction id and serialized commit; re-review on changed balance.
- **Applied to Flutter:** No; project not accessed or modified.

### A-10 — P1 — Shared current / running / list balance

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Direction words existed, but no balance-direction icon.
- **After / root fix:** Add distinct incoming/outgoing/settled icons with explicit direction words in shared Balance; decorative icons are aria-hidden. Urdu now explicitly names the customer as debtor/payee.
- **Preview files:** src/components/Balance.tsx; src/styles.css; src/i18n/ur.json
- **Model / behavior:** Money signs/calculation unchanged.
- **English / Urdu copy:** owesYou=گاہک سے لینا ہے; youOwe=گاہک کو دینا ہے
- **Tokens:** Existing semantic colors + iconSmall.
- **Acceptance:** Positive/negative/zero labels/icons checked by source/unit/browser; requested matrix no serious axe issues. Real TalkBack remains not verified.
- **Flutter application after separate approval:** Port shared directional icon+word presentation to every Balance widget, preserving numeric LTR and semantic money colors.
- **Applied to Flutter:** No; project not accessed or modified.

### A-11 — P1 — Phone validation / search / reminder

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Formatted +92 phone did not match 03/Urdu-digit queries.
- **After / root fix:** One phone helper normalizes Western/Urdu/Arabic digits, separators and comparable international/Pakistani prefixes. Keep display formatting; reuse helper in form/backup validation, duplicate detection, search and reminder URLs.
- **Preview files:** src/utils/phone.ts; validation.ts; reminders.ts; customerIdentity.ts; src/screens/Home.tsx
- **Model / behavior:** Raw display phone is retained. Search still returns all matches; no auto-selection or phone-only merging.
- **English / Urdu copy:** Existing validation text
- **Tokens:** None.
- **Acceptance:** 03/+92/0092/300 forms, both digit scripts, separators, partial phones, international validation and name queries covered.
- **Flutter application after separate approval:** Share a phone-normalization helper between existing native form/search/reminder/restore logic; preserve display phone and all matching customers.
- **Applied to Flutter:** No; project not accessed or modified.

### A-12 — P1 — Shared theme / control states

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Inactive language text was 4.3:1; input boundaries below 3:1.
- **After / root fix:** Darken light muted text and use stronger essential-border colors in both schemes; test inactive text on surfaceMuted and borders against adjacent fills.
- **Preview files:** src/theme/tokens.ts; src/theme/contrast.test.ts
- **Model / behavior:** No theme toggle or feature change.
- **English / Urdu copy:** None
- **Tokens:** Light muted #52665c, border #76877c; dark border #80998a.
- **Acceptance:** Token text/border contrast assertions and requested browser/axe matrix; outdoor/low-vision hardware testing not verified.
- **Flutter application after separate approval:** Apply corresponding light/dark text and input-border roles in ThemeData; verify actual component states, text scaling and daylight.
- **Applied to Flutter:** No; project not accessed or modified.

### A-13 — P1 — Backup file picking / keyboard

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** A clipped 1×1 input was an invisible extra Tab stop.
- **After / root fix:** Keep the visible Import button as keyboard activation path and set the delegated labeled file input tabIndex=-1.
- **Preview files:** src/screens/Backup.tsx
- **Model / behavior:** Programmatic file selection and validation remain unchanged.
- **English / Urdu copy:** Localized import label preserved on input
- **Tokens:** None.
- **Acceptance:** Browser picker/restore flows pass; tabindex asserted; physical TalkBack/Android picker not verified.
- **Flutter application after separate approval:** Use the existing visibly focused native import action; do not port hidden HTML inputs.
- **Applied to Flutter:** No; project not accessed or modified.

### A-14 — P1 — Customer save / duplicates

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Identical name and equivalent phone silently created two khatas.
- **After / root fix:** Use shared normalized name+phone checks to review a likely duplicate, link the existing account, and require explicit intent for a separate account. Repository rechecks acknowledged duplicate IDs under the write lock.
- **Preview files:** src/utils/customerIdentity.ts; src/screens/CustomerForm.tsx; src/state/LedgerContext.tsx
- **Model / behavior:** No unique-name/phone rule, silent merge, or new account-management feature.
- **English / Urdu copy:** duplicateTitle, duplicateHelp, createSeparate, reviewExisting; both locales
- **Tokens:** Existing confirmation/context tokens.
- **Acceptance:** Equivalent-format duplicate prompts; Cancel preserves records; deliberate separate account saves; distinct identities/shared numbers remain possible.
- **Flutter application after separate approval:** Reuse normalized identity comparison before native save and confirm intended duplicates without enforcing unique family phone numbers.
- **Applied to Flutter:** No; project not accessed or modified.

### A-15 — P1 — Backup wording

- **Request / status:** Audit remediation, 19 October 2026; implemented in preview. External verification limits remain in VERIFICATION.md.
- **Before:** Decision labels required understanding Export/Import JSON.
- **After / root fix:** Use Save backup file / Restore from backup file and Urdu equivalents. Explain where a file can be saved, plain-text privacy and full replacement in existing help/confirmation.
- **Preview files:** src/i18n/en.json; src/i18n/ur.json
- **Model / behavior:** No Roman Urdu locale, reminder scheduling or automatic backup feature.
- **English / Urdu copy:** export/import/backupHelp/restoreWarning/badBackup/previewStorageError; both locales
- **Tokens:** None.
- **Acceptance:** Automated labels, downloads, cancellation and restore pass. Representative reader comprehension and physical Files-app task are NOT VERIFIED; this P1 validation remains open.
- **Flutter application after separate approval:** Review these exact strings with Urdu/Roman-Urdu shopkeepers before replacing native copy; retain localized .json in secondary help only.
- **Applied to Flutter:** No; project not accessed or modified.


## KM-004 — GitHub repository and Vercel hosting

- **Request / date:** Owner requested a new repository and Vercel deployment, 20 October 2026 (Pakistan time).
- **Scope:** Existing web preview only; no new app features or Flutter changes.
- **Hosting setup:** Vite build to dist; SPA route fallback in vercel.json preserves direct customer/settings URLs, with assets served normally. Ignore local .vercel state.
- **Repository requested:** New private dawoodanimation-creator/khata-preview. Creation was attempted but GitHub returned `Resource not accessible by integration (createRepository)`; no repository or push was completed. Existing Sites remote is unchanged.
- **Validation / deployment:** See DEPLOYMENT.md for actual results and any connection blocker.
- **Flutter action:** None.

- **Access update:** Owner supplied https://github.com/dawoodanimation-creator/khatamanger after repository-creation permission failed. Verified empty repository with push access. User-created repository is public; visibility is preserved. Vercel connection is now confirmed. Publish a clean source snapshot without Sites metadata/history, caches, env files or credentials.
