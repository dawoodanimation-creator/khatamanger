# Final web-preview → Flutter handoff

The original preview milestones and the later audit-remediation code are implemented locally. Final release readiness is **not certified**: see VERIFICATION.md for tests, remaining human checks and the deployment limitation. This is **not authorization to modify Flutter**; the Flutter project was not accessed or changed during remediation.

## Source of truth

- Existing business rules and original copy: Flutter `lib/models/ledger.dart`, `lib/providers/ledger_provider.dart`, `lib/utils/strings.dart`, money/reminder helpers.
- Reviewed web visuals: `src/theme/tokens.ts`, `src/styles.css`, and `src/screens/`.
- Every request and preview-specific behavior: `docs/CHANGES.md` (KM-001 through KM-003, then A-01 through A-15). Later audit records supersede conflicting baseline claims.
- Current reference images: `docs/verification-evidence/screenshots/`; original reference history remains in `docs/screenshots/`.

## Screens and files to update after approval

| Web reference | Flutter target | Apply after approval |
| --- | --- | --- |
| Home.tsx / LedgerIllustration | screens/home_screen.dart / widgets/common.dart | Green receivables summary, search treatment, balance labels, customer cards, friendly empty illustration |
| CustomerForm.tsx | screens/customer_form_screen.dart | Shared field treatment, spacing, save/cancel layout, focus first invalid input |
| CustomerDetail.tsx | screens/customer_detail_screen.dart | Current-balance summary, transaction cards, type/date/note/signed amount/running balance, persistent credit/payment actions |
| TransactionForm.tsx | screens/transaction_form_screen.dart | Transaction explanation panel, large decimal amount input, date/note controls |
| Settings.tsx | screens/settings_screen.dart | Grouped language, theme, currency and backup sections |
| Backup.tsx / Modal.tsx | screens/settings_screen.dart / widgets/common.dart | Restore counts and confirmation hierarchy; continue to use native Android file picking |
| tokens.ts | main.dart / a shared theme utility | ColorScheme and theme extensions, typography, component dimensions |

## Token mapping

Use `tokens.colors.light` and `.dark` as separate schemes. Map `primary`/`onPrimary`, `surface`, `background`, `text`, `muted`, and `border` to the appropriate Material ColorScheme/component roles. Receivable (`owed`) and payable colors belong in a small ThemeExtension because they communicate ledger direction and should remain consistent across screens. Do not substitute Material error color for all financial states.

CSS colors with eight digits are `#RRGGBBAA`; Flutter Color takes `0xAARRGGBB`. Reorder the alpha bytes when converting overlay and translucent decoration colors. Six-digit colors use an opaque `FF` alpha.

| Foundation | Reviewed value |
| --- | --- |
| Brand seed | `#086b57` |
| Primary button minimum height | 56 logical pixels |
| Icon/switch touch target | 48 logical pixels; the visible switch track is smaller |
| Standard outer horizontal padding | 20 |
| Card padding | 16 or 20, following the reference screen |
| Control/card/hero radius | 14 / 20 / 24 |
| Mobile form input text | 16; preserve platform text scaling |
| English font | Inter, bundled weights 400/500/600/700 |
| Urdu font | Noto Nastaliq Urdu, bundled weights 400/700 |
| Urdu body line-height reference | 2.35; validate against Flutter text metrics |

Bundle the font assets and declare them in Flutter pubspec only when the visual port is authorized. Preserve their open-font licenses. Use Directionality/EdgeInsetsDirectional, logical alignment and SafeArea. Avoid tight letter spacing for Urdu. Numeric values and phone numbers remain isolated LTR; use Inter for Western digits. Allow text to grow/wrap under accessibility scaling instead of imposing fixed card heights.

## Preserve these behaviors exactly

- Customer fields: id/name/phone/note. Transaction fields: id/customerId/kind/amountPaisa/date/createdAt/note. Settings: language/darkMode.
- Integer paisa, original per-entry limit, original positive amount parsing and name/note limits. Phone digit normalization and restore calendar/phone checks were corrected by A-04/A-11; apply those explicit changes after approval.
- Credit adds, payment subtracts; advances are allowed. Outstanding excludes negative balances and payables are shown separately.
- Running balances in ascending date → creation time → ID order; reverse only the display.
- Confirmation before deletion, with customer transactions deleted together.
- Schema 1 JSON backups; validate before confirmation; restore customers, transactions AND settings.
- Existing Roman Urdu reminder text and phone normalization; the owner sends it through the messaging app.
- The baseline copy was originally unchanged. Audit A-10/A-15 intentionally replace direction/backup wording; A-01/A-09/A-14 add localized conflict/review/duplicate labels. Review the current en.json/ur.json and CHANGES records; do not claim blanket original-string parity.

## Do not port web-only machinery

Keep Hive and Riverpod in Flutter. Do not copy localStorage, browser routes, Blob downloads, browser dialog implementation, Playwright tests, desktop phone hardware, development labels or demo/reset controls into the production Flutter app unless requested. The web preview's JavaScript-safe-number guard compensates for a browser numeric limit; Flutter native integer arithmetic already has a wider exact range.

## Verification when the port is requested

Run existing Flutter balance/storage/widget tests, flutter analyze, and Android builds with the owner's SDK/signing setup. Compare each screen against the reference images, then test real Urdu font shaping/text scaling, keyboard insets, system back, native dialogs, Android document providers and WhatsApp/SMS handoff. The native Flutter project has not been built or changed during this web-preview phase.


## Audit remediation port map — 19 October 2026 (Pakistan time)

No native files were read in this remediation; targets below are the previously documented mapping, not a newly verified native-code patch plan. Apply only after a separate Flutter-port instruction. Model fields and schemaVersion 1 remain unchanged. All 15 records include exact before/after, files, copy, tokens and acceptance in CHANGES.md.

| IDs | Native application steps | Do not copy from web |
| --- | --- | --- |
| A-01 | One serialized repository write path; preserve fresh concurrent writes; verify customer identity and reviewed balance before commit; compare destructive-confirmation snapshot; retain unsaved form on conflicts; patch only changed settings. | navigator.locks, localStorage snapshots, browser-tab events; use Hive/Riverpod/native lifecycle equivalents. |
| A-02 | Existing restore remains reachable on startup-storage failure; validate/confirm first, preserve unreadable original before replacement; failed preservation/storage never wipes source. | Browser quarantine-key naming/hidden file input. Native recovery storage requires native design/testing after authorization. |
| A-03 | Format signed integer paisa using integer quotient and remainder, grouping whole rupees; test every paisa at large totals. | BigInt/Intl syntax and JS safe-number cap; retain native integer range. |
| A-04 | Strictly validate actual ISO calendar day, leap dates, time fields/year range and normalized phone before confirmation. Accept documented ISO date-only/local/Z/offset backups; reject impossible dates as a whole file. | Date.parse normalization and browser FileReader/Blob. |
| A-05 | Keep creation navigation separate from all customer IDs, including `new`. | `/customer/` web routes; use native typed routes. |
| A-06 | Persistent existing Add action, first-entry-field focus, existing reminder message/channel choices inline, existing backup controls directly in Settings. Re-measure Home-to-completion, including native Send/Files actions and keyboard. | Browser autofocus guarantees, phone frame; no quick-entry shortcut feature added. |
| A-07 | Cache grouped balances/totals/history per immutable ledger revision; keyed ListView.builder, accessible complete search results, no repeated C×T scans or whole-history validation per row. Reuse formatters; benchmark same fixture on device. | CSS content-visibility/hidden wrappers/cache assumptions or using demo CPU4x as Android proof. |
| A-08 | Shared name+phone identity in transaction/review/delete, balance direction and count before delete, Cancel initially focused. | HTML bdi/dialog mechanics; use Directionality/Semantics/native focus. |
| A-09 | Inline exact amount/action/projected balance adjacent to action-specific Save, same customer context, one commit id and duplicate-activation guard. Changed balance requires re-review/retry. | Browser refs/locks; no amount thresholds or every-save confirmation modal. |
| A-10 | Shared incoming/outgoing/settled icon plus explicit word at all balances; exclude decorative icon speech; use updated Urdu words. | Color-only semantics. |
| A-11 | Shared Western/Urdu/Arabic digit and phone-prefix/separator normalization across form/search/reminder/restore/duplicate review. Keep displayed phone, all matching customers and manual selection. | Automatic phone-only account selection/merging. |
| A-12 | Updated light muted #52665c, light border #76877c, dark border #80998a. Verify actual text states >=4.5:1 and essential control boundaries >=3:1, both themes. | Assuming a passing token test guarantees daylight legibility. |
| A-13 | Existing visible native restore action has clear focus and usable file picker/cancel return. | Hidden 1×1 HTML input. |
| A-14 | Same normalized name+phone warns before save, links existing khata and requires explicit intent for separate account. Recheck under repository serialization; no forced uniqueness for family phones. | New transaction-correction/account-merge features; none built. |
| A-15 | Port simplified backup/save/restore and replacement/help wording only after Urdu/Roman-Urdu reader comprehension review. Keep readable-file privacy warning. | Marking expert copy review as a completed user study. |

**Unimplemented:** P2 A-16 saved-status polish / A-17 date interpretation; all BL-01–13. In particular, transaction correction/undo/PIN/hidden balances/auto-backup/offline reopening were not added. These cannot be silently counted as resolved or ported as part of the fixes. The zero-open-P0/P1 release gate is blocked by the backlog and unverified representative-user checks.
