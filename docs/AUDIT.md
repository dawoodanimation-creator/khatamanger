> Historical baseline. For audit fixes, current checks and deployment status, see [VERIFICATION.md](VERIFICATION.md).

# Khata Manager web preview — audit only

Date: **2026-10-19**. Baseline source commit: `aa31e521ee2927deee841e23a08667fb1aefcf72`.

**Gate: FAIL / not ready to claim shop-use readiness.** This audit found **17 existing defects: 5 P0, 10 P1, 2 P2**. A separate **13-item missing-feature backlog: 1 P0, 7 P1, 5 P2** is in [BACKLOG.md](BACKLOG.md). Combined open inventory: **30 items — 6 P0, 17 P1, 7 P2**. No findings were fixed, no new features were built and no deployment was made.

Work stayed in `/workspace/khata-preview`. Application source, tests, dependencies, build output and configuration were not changed. The Flutter project was not opened or modified in this audit. Only documentation and audit evidence were added. [PERSONAS.md](PERSONAS.md) contains two short assumption-based personas.

## Method, tools, skills and limits

- **Skill used:** [Sites](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md), specifically its local-preview reference, for serving/inspecting the existing production build. Audit-only instructions override its usual publishing workflow. The available executor/cloud skill catalogs were checked; **no dedicated approved UX, accessibility or testing skill was available**. No unrelated skill was claimed or installed.
- **Tools used, not skills:** source inspection, existing Vitest tests, existing Playwright with system Chromium, CDP CPU throttling, axe-core **4.10.3** loaded into isolated audit pages, screenshot review, and independent integer-money checks. No package was added.
- Browser audit used existing `dist/` via Vite preview at localhost:4173; no rebuild was needed. Fixtures contained only synthetic customers. The hosted site's last published URL is listed below, but the hosted site was **not re-tested or redeployed** in this audit.
- Performance: **500 customers / 5,000 transactions**, 4× CPU slowdown, 360×640; no other benchmark ran concurrently. This is a throttled Linux Chromium lab, **not a physical cheap Android phone**. Network throughput/RTT were not throttled; physical sunlight, on-screen keyboard, TalkBack, real user comprehension and flaky radio behavior are **not verified**.
- Screen/axe matrix: 360×640 and 412×915, English/Urdu, light/dark, seven routes each = **56 scans**. Axe found **4 serious color-contrast instances of one rule**, all on inactive language buttons in light Settings. No critical instance was returned. Axe also had color-contrast items needing manual review; a zero-violation scan would not establish full accessibility.
- Existing suite rerun: **36 tests passed in 8 files**. These tests do not cover all failures below. No new committed automated tests were written during this audit.
- Manual screenshot review: English light Home, Urdu dark credit form, and small-screen Urdu reminder. Other matrix screenshots and measured geometry support the review. Native dialogs were exercised for focus/geometry; **axe scans inside open dialogs were not run**.

### Reproducible evidence

| Evidence | Contents |
| --- | --- |
| [baseline.json](audit-evidence/baseline.json) | Baseline commit and hashes of 129 non-document files |
| [task-measurements.json](audit-evidence/task-measurements.json) | Three runs of each top-task variant, tap counts and automation times |
| [performance.json](audit-evidence/performance.json) | 500/5,000 fixture, CPU 4×, raw timings, DOM count and buried Add position |
| [risks.json](audit-evidence/risks.json) | Browser reproductions: lost tab update, corruption, reserved ID, identity, phone, duplicates, restore, double click, hidden focus, offline |
| [money.json](audit-evidence/money.json) | Actual source functions: decimals, huge display mismatch, accepted invalid dates, balance and deletion behavior |
| [accessibility.json](audit-evidence/accessibility.json) | Full 56-screen geometry/axe results, source version/hash, incomplete checks |
| [unit-test-run.txt](audit-evidence/unit-test-run.txt) | Current 36-test run |

## 1. Top tasks: taps and time

**Definition:** A tap is a pointer activation of a control or a field to focus it; keyboard keys are not counted. Optional note/date edits are omitted. All runs start with the named screen ready and the customer known. Three synthetic-customer runs per variant, CPU 4×, 360×640. Timings include app navigation, field focus, immediate `fill()` and visible completion; **typing/comprehension time is absent**. These are measured automation latency floors, not measured human task times. Scrolling is additional: Playwright auto-scrolled where needed, but manual swipe counts are **not verified**.

Target: **≤3 taps and ≤10 seconds for repeated tasks**. The tap target is assessed below. The human 10-second target is **not verified for any task**; fast automation is not a substitute for a shopkeeper study.

| Task / start | Actual shortest tested sequence | Taps | Median automation time; range | Target / completion boundary |
| --- | --- | ---: | --- | --- |
| Add customer / Home | Add → name field → phone field → Save | 4 | **1.026 s**; 0.953–1.034 | Tap target fails; Add requires scrolling even in this small fixture |
| Record udhaar / Home | Customer → Udhaar Diya → amount field → Save | 4 | **1.294 s**; 1.248–1.417 | Tap target fails; excludes typing |
| Record payment / Home | Customer → Payment Mili → amount field → Save | 4 | **1.234 s**; 1.168–1.239 | Tap target fails; excludes typing |
| Record udhaar / selected customer detail | Udhaar Diya → amount field → Save | 3 | **0.940 s**; 0.907–1.347 | App tap target passes from this narrower start only |
| Record payment / selected customer detail | Payment Mili → amount field → Save | 3 | **1.030 s**; 0.857–1.111 | App tap target passes from this narrower start only |
| Reminder / Home | Customer → Send balance reminder → WhatsApp | 3 | **0.873 s**; 0.838–0.926 | Only an intercepted link handoff was measured. Actual composer Send adds at least one further action; OS handoff/send time **not verified** |
| Find customer / Home | Search field → matching result (type phone between) | 2 | **0.430 s**; 0.391–0.456 | Tap target passes for raw matching phone; normalization failure is A-11 |
| Backup / Home | Settings → Backup & restore → Export | 3 | **1.181 s**; 1.003–1.352 | To a parsed browser download only. Android file save/location actions and completed file persistence **not verified** |

**Do not game the gate:** count from Home and include the real messaging/file-save end state in the later human study. Keep selected-customer timings as a separately named repeat scenario. A-06 proposes reducing unnecessary navigation/focus without adding quick-entry features or removing financial context.

## 2. Screen-by-screen review

| Screen | Hierarchy, spacing, controls, language | Empty/loading/error/success and remaining risks |
| --- | --- | --- |
| Home/list/search | Clear summary → search → customers hierarchy. Red/green states include words, but **no balance-direction icon**. Measured visible controls meet 48px. At 500 customers Add is 46,613px down the page; no virtualization. Urdu direction works, money/phone isolate LTR; Latin customer data can still pick the Urdu font in some header contexts. | Friendly empty/no-match states exist. Existing data is not overwritten by an unreadable startup, but that screen has **zero recovery actions**. Startup/large-list work can be blank/blocking before first interaction. Save confirmation is only implicit in changed cards/balances. A-02, 06, 07, 10, 11, 16. |
| Add/edit customer | Name/phone/note labels and limits exist; fields are 16px and focus first invalid input. Required vs optional is mostly implicit except note. Large Save/Cancel controls and wrapping are sound in the matrix. | Validation/error state exists; failed storage keeps the form. Urdu/Arabic phone digits are rejected although amounts accept those digits. Identical name/phone can create duplicate accounts without warning. No explicit saved status. A-11, 14, 16. Draft recovery is BL-13. |
| Customer detail/history | Current balance is prominent; type/date/note/amount/running balance are shown. Credit/payment buttons are sticky and reachable after scrolling. Newest-first display and chronological balances are correct in normal cases. | Friendly empty history exists. Delete asks for confirmation, focuses Cancel and warns permanently, but does not identify whose history/balance will be destroyed. No transaction-level correction controls or undo exist. A-08, 10; BL-01–03. |
| Credit/payment form | Explains transaction direction, shows name, amount/date/note, but **not phone**: two people called Ali cannot be distinguished at commitment. Save says only “Save”, with no grouped amount/after-balance review. | Rejects zero/negative/excess decimals and focuses errors. An extra zero is a valid amount and posts immediately. A direct double click posted only one entry in the tested case. Error state exists, but blocking persistence cannot paint meaningful in-progress feedback before synchronous work returns. A-07–09, 16. |
| Reminder dialog | Exact Roman Urdu message and named customer/amount are visible. User chooses WhatsApp/SMS and sends themselves. In tested Urdu 360×640, Cancel was focused and fully within the dialog; no hidden-Cancel bug was found. | Bad WhatsApp normalization has an error path. Real installed messaging apps, actual Send, unsupported app behavior and iOS SMS-body handling are **not verified**. Balance direction still needs icon+word outside this dialog. No scheduled reminders, BL-09. |
| Settings | Large language buttons and 48px switch hit area are present. Urdu RTL, arrows and isolated currency work. | Inactive language text fails axe contrast in light mode (**4.3:1**, below 4.5:1). Field/control boundary contrast elsewhere is only **1.29:1 light / 1.48:1 dark**. These fail the intended bright-sunlight/low-vision use even though selected foreground/background token pairs passed old tests. A-12. |
| Backup/restore | Plain-text privacy help, file name and record counts exist. Restore has a clear replacement warning and Cancel. Manual export is nested behind an extra Settings subpage. | Reading/success/error states exist. Bad JSON is rejected; cancelling restore preserved the exact stored raw value. A semantically invalid date nevertheless reaches confirmation. Keyboard Tab reaches an invisible **1×1** file input after the visible import button. No last-backup/reminder feature exists. A-04, 06, 13, 15; BL-04. |
| Demo/reset | Separated as preview controls, warning before replacing data, and language/theme are preserved. Controls are large. | Confirmation exists; these controls are not suitable as production shop features and must remain web-review-only. No new feature is proposed here. |
| Startup/missing customer | Missing-customer route has a route back. Corrupt startup says data was not cleared. | Corrupt startup suppresses even the already-built import screen. The valid ID `new` is confused with the new-customer screen. A-02, 05. |

### Accessibility and wording observations

- Visible app buttons/icon buttons/switch/language controls were ≥48px across all 56 measured screens; **this is a pass**, not a finding invented from a small visible switch track. The hidden keyboard-only input is a separate A-13 failure.
- No horizontal overflow was measured in the eight requested viewport/language/theme configurations. This does not verify an on-screen keyboard, physical sunlight, TalkBack or all imported content.
- Native reminder Cancel focus/geometry worked in the sampled 360×640 Urdu dialog. No modal regression was inferred from a full-page screenshot; measured viewport bounds are authoritative.
- Normal financial labels do not rely solely on color because words exist. The owner's stronger **icon + word** requirement is still unmet in `Balance` (A-10).
- English contains useful Roman Urdu credit/payment names; reminders use Roman Urdu, but a full Roman Urdu interface is absent (BL-12). Technical backup copy and implicit direction subjects need low-tech reader validation (A-15).

## 3. Mistakes, money and data safety

### Verified passes

- Credit 100.10 minus payment 30.10 gives **70.00** exactly in integer paisa; overpayment/payable direction and separate receivables are covered by the existing suite.
- Positive minimum **0.01** and ordinary decimals are accepted. Zero, negatives, exponent/commas and excess precision `1.005` are rejected rather than silently rounded. Urdu/Arabic digits work for amounts with an ASCII decimal point. `12٫34` with an Arabic decimal separator is rejected; accommodation for real keyboard behavior requires later review, not an assumption that all phone keyboards emit `.`.
- Per-entry maximum `9999999999.99` Rs parses exactly. Values above the limit are rejected. Aggregates outside safe integers are guarded, but display within the safe range can still round incorrectly (A-03).
- Backdated sample credit then later payment produces running balances **1,000 → 500 paisa** in chronological order. Display reversal does not change that math.
- Customer deletion removes that customer's transactions; other customers are preserved in existing tests. This is **not** verification of deleting a single transaction: there is no such operation.
- Same-form double click was exercised: one **100,000-paisa** entry posted, not two. This does not prove all retry/concurrency cases; stale-tab writes definitely lose an entry (A-01).
- Syntactically bad JSON is rejected, and restore Cancel preserved the original raw stored string. The overwrite warning is present. Unreadable localStorage is preserved rather than silently wiped.

### Confirmed failures / missing operations

A wrong amount with an extra zero is accepted as valid and cannot be corrected through transaction history. That is a mistake-prevention issue in the existing form (A-09), plus a separate **new-capability backlog blocker BL-01**. No edit/delete/undo was built to make the audit pass. Deleting a past transaction and checking its recalculated balance is **not verified / not implemented**, not a passing test.

Two open tabs reproduced a silent lost credit: start `[10000]`, tab A adds `1000` → `[10000,1000]`; stale tab B adds `2000` → **`[10000,2000]`**, where `[10000,1000,2000]` was required.

A schema-valid **1,413,298-byte** backup with 9,008 legal credit entries passes exact-balance validation and totals `9007199254740991` paisa. The expected display is **Rs 90,071,992,547,409.91**, but current formatting shows **.90**. This is a real accepted input, not an out-of-range invented number.

`2020-02-30T00:00:00.000` is accepted and interpreted as **1 March**, and a customer phone `not a phone` passes backup decoding. Backup relationship/type checks alone are insufficient.

### Privacy / shared phone

Ledger data and exported files contain names, phones, notes and money in plain text. The backup help correctly says so. Private hosting limits access to the page, but does not hide an already-open ledger or encrypt browser storage/downloads. Hide balances and optional PIN/idle lock are absent: **BL-05/06**, backlog only. No security feature was added. Automated exfiltration/security penetration testing was **not run**.

### Shaky internet

After a successful load, client navigation worked offline. A reload failed with `ERR_INTERNET_DISCONNECTED`; reconnecting preserved data. No service-worker/offline shell was found. Treat offline reopening as **BL-07**, not as an implemented fix or a guarantee about the private hosted site's authentication/cache behavior. Physical radio conditions and the live-host offline path are **not verified**.

## 4. 500-customer / 5,000-transaction performance

Fixture: **863,943 bytes** of serialized JSON. DOM count: **5,072** elements. Timings below are actual production-preview measurements with 4× CDP CPU slowdown; no real-phone equivalence is claimed.

| Operation | Samples | Median | Maximum / sampled p95 | What was measured |
| --- | ---: | ---: | ---: | --- |
| Home reload / ready | 3 | **2,797 ms** | **3,028 ms** | Reload request through 500 cards attached and two animation frames; includes local page load, not only computation |
| Search to one match | 8 | **204 ms** | **252 ms** | Input event through two animation frames |
| Clear search back to 500 | 7 | **843 ms** | **1,374 ms** | Input event through two frames and full list repaint |
| Save credit with 5,000 existing entries | 1 | **913 ms** | n=1, no percentile claim | Save click through updated detail/history |

A sampled p95 with 7–8 observations is simply the largest observation, not a robust field percentile. Repeated full-ledger scans, repeated money formatter creation, rendering all cards and synchronous full-snapshot persistence explain the code-level risk (A-07). Initial Add location: **y=46,612.9px**, height 56px; it was not in the 640px viewport (A-06). Do not confuse passing DOM geometry/overflow tests with acceptable one-handed access.

## 5. Existing-defect register

Each item is **open**. Priority follows the owner's definition; an infrequent but accepted wrong-money case is still P0. Proposed fixes below are recommendations only, not code changes or approval to add backlog capabilities.

### A-01 — P0 — All saves: stale tabs silently erase a new credit

- **What happens / evidence:** Two initialized tabs overwrite whole snapshots from stale in-memory state. The first tab's 10 Rs credit disappeared after the second posted 20 Rs. `risks.json:staleTabs`; `src/state/LedgerContext.tsx:27–44`, `state/storage.ts`.
- **Exact root fix:** Put every mutation behind one shared, concurrency-aware repository commit. Validate the last persisted revision and serialize cooperating tab writes with a supported origin-wide lock; on conflict, preserve unsaved form input and force an explicit reload/retry instead of overwriting. Restore/delete/settings must use the same path. Do not silently merge destructive operations or add a backend.
- **Verify:** Two tabs interleave add/payment/delete/restore and stale settings saves; no transaction disappears, balances equal the serialized operations, conflicts are visible and form values survive. Also test a fallback where the origin-lock API is unavailable.

### A-02 — P0 — Startup: corrupt storage blocks every task, including restore

- **What happens / evidence:** Invalid local JSON shows only the startup error. Even `/settings/backup` has **0 interactive actions**. Raw data is preserved, but a non-technical owner cannot use the existing import recovery path. `risks.json:corruptStorage`; `src/App.tsx:39`, `LedgerContext.tsx:28`.
- **Exact root fix:** Keep a quarantined copy of unreadable raw data; route startup recovery to the **already-existing** validated backup import flow. Permit confirmed restore through the repository even when initial decoding failed, without a silent reset. No PIN, cloud backup or new recovery service is authorized.
- **Verify:** Invalid JSON, unsupported schema, unavailable storage and safe-integer rejection do not erase raw data. Existing import is reachable; bad imports leave it unchanged; confirmed valid backup restores records/settings; quota failures remain recoverable.

### A-03 — P0 — Money display: division by 100 loses a paisa at large valid totals

- **What happens / evidence:** Accepted safe-integer total `9007199254740991` displays `.90` instead of `.91`. The 9,008-entry fixture is under the 20 MB import limit. `money.json:largeLedgerFormat`; `src/utils/money.ts:13–16`.
- **Exact root fix:** Format integer rupees and remainder paisa without converting the total to a floating-point rupee amount. Use integer/BigInt quotient/remainder and grouping for the whole part; preserve absolute display and direction labels separately.
- **Verify:** Compare exact formatted strings at per-entry max, safe-integer boundary, every remainder 00–99 near that boundary, negative balances and backup round trip. Check both locales and all summary/history/reminder surfaces.

### A-04 — P0 — Backup decoding: invalid calendar data is silently accepted

- **What happens / evidence:** February 30 reaches restore confirmation and is interpreted as March 1. Invalid phone text also passes decode. `money.json:backupValidation`, `risks.json:backupGuards`; `src/utils/backup.ts:13–17,27–36`.
- **Exact root fix:** Validate the documented ISO representations and real calendar fields before replacement; keep ledger-date and creation-timestamp semantics distinct. Reuse canonical phone/name/note validation after digit normalization. Reject invalid records instead of normalizing dates silently; do not reject legitimate leading customer advances or historical dates merely for being unusual.
- **Verify:** Leap/non-leap days, bad month/day, incomplete dates, timestamp offset boundaries, invalid phone and valid Flutter-compatible backups. Rejection must preserve the exact previous stored snapshot; confirmation still precedes every valid overwrite.

### A-05 — P0 — Customer navigation: valid ID `new` opens a different task

- **What happens / evidence:** Valid restored customer ID `new` generates `/customers/new`, which opens Add customer with no credit action. `risks.json:reservedCustomerId`; `src/utils/routes.ts`, `src/App.tsx:42–43`.
- **Exact root fix:** Use an unambiguous canonical detail URL, separate from the create route; centralize generation in `customerPath` and keep safe legacy links where possible. Do not silently change imported IDs or discard valid customers.
- **Verify:** Imported IDs `new`, Unicode, spaces and reserved URI characters can open detail/edit/credit/payment on click and hard refresh, without triggering a create form.

### A-06 — P1 — Navigation/reach: primary task disappears below the customer list

- **What happens / evidence:** Add is at y≈46,613px with 500 customers. Home-to-credit/payment and add require 4 control taps, before keyboard/scroll gestures. Backup and reminder completion add OS actions beyond the three app taps. `performance.json`, `task-measurements.json`; Home/route/form/backup layouts.
- **Exact root fix:** Keep the **existing Add action** in a reachable sticky/shared action area. Give existing forms a deliberate initial-field focus policy without losing accessible customer context. Flatten existing backup actions into Settings and expose existing messaging-channel actions without unnecessary intermediate navigation where this preserves message review. This is rearranging existing actions, not adding quick entry, stored channel preferences or automation.
- **Verify:** From Home at both viewport sizes, perform known-customer repeated tasks with recorded control taps, swipes, keyboard and real OS completion. Android focus policy must actually open the keyboard where intended. Do not declare ≤10s from automation-only numbers.

### A-07 — P1 — Large ledgers: full-list work stalls input and persistence

- **What happens / evidence:** Clearing search took up to 1.374s; Home ready took 3.028s; one entry save took 0.913s. Totals and each card repeatedly scan transactions; all 500 cards render. `performance.json`; balance helpers, Home and `ensureExactBalances`/snapshot persistence.
- **Exact root fix:** Derive a customer-balance index/totals once per ledger revision, reuse formatter instances and memoized customer rows, and window/recycle the existing list without hiding its accessible navigation/actions. Avoid recalculating all histories for an unaffected edit and avoid synchronous duplicate serialization. Keep money-validation guarantees and the single persistence boundary.
- **Verify:** Same 500/5,000 fixture at CPU 4×; record input-to-paint and save traces. Proposed regression budgets: search/clear p95 ≤200ms and no unexplained >1s UI lock, while the human top-task ≤10s gate is measured separately. Stress repeated mutations and verify exact totals after optimization.

### A-08 — P1 — Financial/destructive context: the same name is not enough

- **What happens / evidence:** Transaction form shows only name, not phone. Delete confirmation has neither name, phone, balance nor entry count. Two Ali Khans cannot be distinguished at commitment. `risks.json:identityAndDelete`.
- **Exact root fix:** Shared customer-context component shows name plus phone/last digits on credit/payment and destructive dialogs. Delete confirmation explicitly identifies the customer, amount direction and transaction count while retaining Cancel as initial focus.
- **Verify:** Two same-name/different-phone customers; confirm each form/dialog clearly identifies the selected ID, both locales/themes. Cancel changes nothing; only the confirmed customer's records are deleted.

### A-09 — P1 — Amount review: an extra zero posts without clear financial confirmation

- **What happens / evidence:** Typing 1000 instead of 100 posts 100,000 paisa immediately. Save says only “Save”; the projected result is not reviewed beside that action. No past-entry correction exists (BL-01). `risks.json:extraZeroAndDoubleTap`; TransactionForm.
- **Exact root fix:** Reuse exact money/balance logic for an inline, localized amount + action + resulting-balance summary adjacent to the existing Save, with customer identity from A-08. Keep a single commit/idempotency path. Do not invent arbitrary “large amount” thresholds or add an extra modal to every routine entry merely to meet a checklist.
- **Verify:** 100 vs 1000, 0.01, overpayment and Urdu digits visibly produce the correct summary before posting. Same-form repeated activation still posts once. Correction/undo remains separately gated backlog work, not a hidden addition.

### A-10 — P1 — Balance semantics: icon + word requirement is unmet

- **What happens / evidence:** `Balance` has amount and words but zero icons. Transaction-type arrows elsewhere do not identify the current/running balance direction. `accessibility.json:balanceIcons`, `src/components/Balance.tsx`.
- **Exact root fix:** Extend the shared existing Balance presentation with distinct receivable/payable/settled icons plus explicit direction words. Keep accessible text as the source of meaning and hide redundant decorative icon speech. Consider clearer Urdu “گاہک سے لینا ہے / گاہک کو دینا ہے” through copy review.
- **Verify:** Positive, negative and zero on Home/detail/history in monochrome and both locales; a screen reader announces unambiguous direction once. Never use icon/color alone.

### A-11 — P1 — Phone entry/search: a valid customer's number can appear absent

- **What happens / evidence:** `+92 (300) 123-4567` does not match `03001234567` or `3001234567`; Urdu digit `۰۳۰۰۱۲۳۴۵۶۷` is rejected in the phone field. `risks.json:phoneSearch,urduPhone`.
- **Exact root fix:** Normalize supported digit scripts and comparable phone separators/prefixes in one shared phone helper, reused by existing form validation, search and reminder normalization. Preserve the displayed/raw phone as needed; don't silently identify two different people solely by a short suffix.
- **Verify:** Western/Urdu/Arabic digits, 03/+92/0092 and spaced/dashed forms find the same stored Pakistani number. International numbers remain valid, no false single-person auto-selection, and existing name search still works.

### A-12 — P1 — Contrast: current token tests miss an actual serious failure

- **What happens / evidence:** axe flagged inactive language text at **4.3:1** in light Settings, four configurations. Input boundaries are **1.29:1 light / 1.48:1 dark** against their fill; label/background contrast alone does not make the input shape visible in sunlight. `accessibility.json`; shared tokens/CSS.
- **Exact root fix:** Correct inactive control text/surface token pair to ≥4.5:1 and give essential input/control boundaries ≥3:1 against adjacent fills. Scope structural/decorative borders separately if needed. Expand tests to computed component states, not just a hand-picked palette subset.
- **Verify:** axe in both languages/themes, including selected/inactive/hover/focus/error states; independent non-text contrast calculations; manually review outside/low-vision conditions. Axe's incomplete contrast items must be reviewed rather than counted as passes.

### A-13 — P1 — Backup keyboard path: invisible file input is an extra focus stop

- **What happens / evidence:** Tab goes Export → Import → a clipped **1×1** file input. It has a label, but its focus indicator is not visibly usable. `risks.json:hiddenFileTabStop`; Backup's `sr-only` input.
- **Exact root fix:** Keep the existing visible import button as the single keyboard activation path; remove the delegated file input from sequential tab order, without breaking programmatic picking or its accessible labeling relationship.
- **Verify:** Keyboard reaches only visibly focused controls; Enter/Space on Import opens picking, Cancel restores focus, selection still validates, TalkBack/keyboard behavior is checked on device.

### A-14 — P1 — Duplicate customer creation can split the same khata

- **What happens / evidence:** Same name/phone saved twice, creating two independent balances without warning. `risks.json:duplicateCustomer`.
- **Exact root fix:** Before the existing save commits, use shared normalized identity checks to flag a likely duplicate and direct the user to review the existing account. Do not enforce globally unique names/phones without a policy: family/shared numbers can be legitimate. Use the existing confirmation/context pattern for an intentional duplicate if allowed.
- **Verify:** Exact/reformatted-number duplicates are noticed; a legitimate same-name/different-number customer remains possible. No silent merging and no lost transactions.

### A-15 — P1 — Backup wording is too technical for the stated user

- **What happens / evidence:** “Export JSON backup / Import JSON backup” and its Urdu JSON labels assume file-format knowledge. A full Roman Urdu interface is not present. This is an **expert/persona risk; actual comprehension is not verified**, not a claim that a user study failed.
- **Exact root fix:** Simplify existing labels/help to a concrete “Save backup file / Restore from backup file” concept with reviewed Urdu equivalents. Explain replacement in the same plain language. Keep file-format details in secondary help, not the decision label. Do not build BL-12's new locale in this fix.
- **Verify:** Two representative Urdu/Roman-Urdu readers identify save vs replace, locate the downloaded file and explain the warning without coaching. Measure comprehension/task time; all new text goes through existing i18n.

### A-16 — P2 — Save success is implicit, making a retry plausible

- **What happens / evidence:** Customer/entry save navigates and changes balances but gives no explicit saved status naming the committed action. The owner may not see a newly alphabetized customer or the new history row. Source review; no actual duplicate from a fast same-form double click was observed.
- **Exact root fix:** Provide a concise localized status for the already-completed save (customer/action/amount), announced once with role=status. Never announce success before persistence. Do not add undo/drafts as part of this polish item.
- **Verify:** Success is visible/announced after save, not on Cancel/storage failure; duplicate activation does not produce duplicate announcements or ledger entries.

### A-17 — P2 — Urdu date entry still follows browser date-format conventions

- **What happens / evidence:** In the English-browser audit, the Urdu form shows native date `10/19/2026` while the interface is RTL Urdu. Ambiguous dates such as 01/02 need clearer interpretation. **User misunderstanding and physical-device picker behavior are not verified.** Screenshot `360-ur-dark-credit.png`.
- **Exact root fix:** Keep the native date picker, but label/explain the selected calendar date using the existing localized date formatter; do not introduce a custom picker or new due-date feature. Preserve ISO ledger dates and original validation.
- **Verify:** Browser locales en-US/en-GB with Urdu UI show an unambiguous selected date and save the same intended ISO day. Backdating and cross-device restore remain correct.

## 6. Fix order and scope boundary

1. **Data integrity first:** A-01 shared commit/concurrency; A-02 recovery into existing restore; A-04 validation before any replacement; A-03 exact display; A-05 canonical routing. All five P0 must be fixed and regression-tested before UI polish.
2. **Shared identity and safe financial review:** A-08, A-09, A-10 and A-14. Use shared context/balance/commit components. BL-01 correction and BL-02/03 undo are still new-feature backlog, not implied fixes.
3. **Access and input at the root:** A-12 tokens/states, A-13 delegated input focus, A-11 phone helper.
4. **Task speed and reach:** A-07 derived indexes/list/persistence performance, then A-06 reachable actions and reduced existing navigation/focus overhead. Re-measure the same fixture and real-device tasks.
5. **Comprehension:** A-15 copy/user check; then optional P2 A-16/17 after P0/P1.
6. **Step 3 later:** Add permanent automated regression coverage, full top-journey Playwright matrix, open-dialog axe scans, physical-phone checks and per-ID CHANGES/FLUTTER_HANDOFF updates. No such source edits were made in this audit.

## 7. Gate scorecard

| Gate | Current result |
| --- | --- |
| 0 open P0/P1 defects | **FAIL:** 5 P0 + 10 P1 existing defects open |
| Missing required capabilities resolved without new features | **Blocked by scope:** backlog includes 1 P0 + 7 P1; approval needed before building them, and they cannot be silently waived as passed |
| All existing tests pass | **PASS for existing suite:** 36/36; not coverage of the full gate |
| No serious automated accessibility violations | **FAIL:** 4 serious rule instances across 56 screens; incomplete checks remain |
| Top tasks ≤3 taps | **FAIL** from Home for add/credit/payment; reminder/send and backup/OS completion not fully measured |
| Human repeated tasks ≤10s | **Not verified**; automated timing floors only |
| Real cheap Android / one hand / sunlight / IME / TalkBack | **Not verified** |
| Preview and Flutter untouched | **Verified for preview non-document hashes**; no Flutter access was performed in this audit |

## 8. Existing preview link and 10-minute manual script

Last published preview (unchanged): **https://khata-manager-mobile-preview.corallarch.chatgpt.site**. Private hosting may require the same ChatGPT account. This audit did not re-check the hosted deployment; local production-fixture measurements are distinguished above.

Use a disposable test profile/ledger, not live shop data. If testing in a profile with real data, export and independently check a backup first; do not run the known lost-update reproduction against that ledger. Times below are a **manual test agenda**, not measured task results.

| Minute | Action and what to check |
| --- | --- |
| 0–1 | Open the link on the phone, sign in if required, choose English/light. Verify the starting ledger is disposable. Prepare a stopwatch; count field/button taps separately from typing and swipes. |
| 1–2 | Add two test customers with the same name but distinct test phone numbers. Search by phone. Check whether the correct customer is obvious and whether Save is reachable one-handed. |
| 2–3 | Open one customer; credit 100.10, payment 30.10. Expect **70.00 owed to you**. Note tap/time from Home and from already-selected detail separately. |
| 3–4 | Add a backdated credit 0.01. Final balance **70.01**; inspect chronological running balances despite newest-first display. Type an extra-zero amount but Cancel; inspect whether its consequence was clear before Save. |
| 4–5 | In disposable data only, open the same ledger/customer in two tabs, add 10 in A then 20 in stale B. This is a **known data-loss failure**: note whether the 10 entry vanishes. Do not pretend it passed. |
| 5–6 | Switch Urdu/dark; inspect money/phone LTR, direction words and missing icons. Try an Urdu-digit phone on a new form; note the known validation failure. |
| 6–7 | Open reminder, check exact customer/amount and target number. Open a composer only for a number you control and Cancel without sending. Record app taps separately from OS Send actions. |
| 7–8 | Export JSON and locate the downloaded file in the phone's Files app. Try a malformed file: it must not replace data. Restore a valid disposable backup only after reading its overwrite warning. |
| 8–9 | Increase text size, open the keyboard and use the app in the actual lighting conditions. Inspect language button contrast, input boundaries, visible focus and one-hand reach. Check whether Cancel remains accessible in dialogs. |
| 9–10 | Close/reopen with shaky/offline data conditions, then reconnect and verify stored data. Restore any original backup if real-profile testing was unavoidable. Record failures and stop; do not repair records with invented payments. |

## Stop point

**Step 1 audit complete. No app-code fixes, new features, dependency changes or deployment.** The next work must follow the reviewed P0→P1 order and the backlog boundary; this report does not certify that the release gate has passed.
