# Audit remediation verification — 19 October 2026 (Pakistan time)

**Release gate: NOT MET.** A-01–A-15 have local implementation changes; all five existing P0 defects have focused regression coverage. A-15 representative-reader comprehension is still **not verified**, so that P1 validation remains open. Human ≤10-second completion, physical Android/IME/TalkBack/daylight, real messaging Send and phone Files-save completion are **not verified**. The unbuilt backlog still has **1 P0 + 7 P1 + 5 P2**; P2 A-16/17 also remain. No missing feature was built or silently waived.

Work stayed in `/workspace/khata-preview`; Flutter was not accessed or modified. Schema version 1 and all model fields remain. No backend, login, PIN, undo, transaction correction, scheduled reminder, PDF, shop switch or service-worker feature was added.

## Changes and evidence

Every existing defect has its own A-01–A-15 entry in [CHANGES.md](CHANGES.md); [FLUTTER_HANDOFF.md](FLUTTER_HANDOFF.md) maps every change for a later separately authorized native port. [AUDIT.md](AUDIT.md) is the historical baseline, not a current readiness certificate. [BACKLOG.md](BACKLOG.md) remains unimplemented.

- Unit/DOM regression suite: **64 passed in 9 files**. [Raw output](verification-evidence/unit-run.txt). Includes accepted maximum aggregate/display, decimals, invalid calendar dates/phones, normalized identities, ordinary balance/history/deletion, and DOM journeys. The jsdom lock shim is test-only; native browser locking is exercised separately.
- Production build and TypeScript: **passed**, [build output](verification-evidence/build.txt).
- Browser suite: **25 tests**: 5 focused audit regressions, 12 existing responsive/flow tests updated for intentional copy/actions, and 8 requested viewport/locale/theme journey configurations. Final result: **25/25 passed**, see [browser-run.txt](verification-evidence/browser-run.txt). No external message was sent.
- Requested matrix: **360×640 and 412×915 × English/Urdu × light/dark**. Each configuration creates a customer with Urdu-digit phone, records credit/payment, checks normalized search and exact reminder URLs, edits the customer, downloads/parses JSON, resets disposable records, restores with confirmation and refreshes. It checks overflow, control heights ≥48px, first-field/Cancel focus and language/direction. This is Chromium viewport emulation, not an Android device.
- Axe: **96 scans**, 12 screen/dialog states in each of 8 requested configurations, **0 reported violations**, including **0 serious/critical**. Delete/reset/restore dialogs are scanned while open. There are **18 incomplete rule instances requiring manual assessment**; they are not silently counted as passes. Detailed reports: `verification-evidence/axe-*.json`. Tests use installed `@axe-core/playwright`; version is recorded in each report.
- Screenshots: `verification-evidence/screenshots/`. Actual visual review of the 360px Home, credit and detail, plus 412px Settings contact sheets covers both locales/themes; numeric geometry covers the full matrix. Full-page screenshots place sticky footers at their current viewport position inside the larger image; this is not proof of a permanently obscured button. Physical keyboard/zoom/TalkBack integration is not established by screenshots.
- Local contrast assertions now include inactive language text on the muted surface and essential borders against surface/background/muted fills. Physical bright-sunlight legibility remains not verified.

## Money/data regression boundaries

A 9,008-entry accepted backup totaling `9007199254740991` paisa displays **Rs 90,071,992,547,409.91**, including the last paisa. Credit adds/payment subtracts, overpayment remains payable, and chronological running-history order is unchanged. Invalid ISO calendar days and invalid phones are rejected before restore. Imported ID `new` uses `/customer/new`; `/customers/new` still creates a customer.

All app writes cooperate through one Web Lock and re-read persisted data inside the lock. Concurrent reviewed-balance/identity changes fail with a localized conflict, preserve unsaved input, and permit explicit retry after reviewing fresh state. Settings patch only the changed field. Destructive delete/restore/demo/reset require the confirmed snapshot still to match. A valid confirmed recovery preserves unreadable raw storage in a separate quarantine key before replacing the ledger. Quota failures/no-lock contexts do not appear saved. Browsers without the origin-lock API are deliberately **read-only for commits** with an update-browser message; latest real-browser compatibility is not verified beyond Chromium.

These controls do not protect against another application, extension, DevTools or a legacy app version writing directly to the same storage key without the lock. No claim of encryption or forensic/security testing is made. Plain-text local data/exports remain a shared-phone risk in the backlog. Past-transaction correction/deletion/undo remains absent; its balance recalculation is **not implemented/not verified**.

## Task measurements

See [tasks.json](verification-evidence/tasks.json) and the retained measurement script. Three runs per task, 360×640, CPU 4×, production build. Taps count actual pointer activations; automatically focused fields do not add a tap. Immediate fills omit human typing/comprehension/IME. Times are automation latency floors, not a shopkeeper study.

| Home-start task | Measured app taps | Median automation ms |
| --- | ---: | ---: |
| Add customer | 3 | 412 |
| Record udhaar | 3 | 476 |
| Record payment | 3 | 473 |
| Reminder link handoff | 2 | 380 |
| Find/open customer | 2 | 230 |
| Parsed backup download | 2 | 285 |

Target app tap counts are met for the tested common path. Real messaging Send and Android file-save completion may require additional actions; those end-to-end targets are **not verified**. Autofocus/one-hand behavior with the physical keyboard must be checked. Do not declare human ≤10s passed from these timings.

## 500 customers / 5,000 transactions

See [performance.json](verification-evidence/performance.json), with raw samples and a retained reproduction script. Production Chromium, 360×640, 4× CPU, synthetic records; no simultaneous browser test/CPU benchmark. The fixture has the same record counts as the baseline, but synthetic names/amounts differ; this is a scale comparison, not a byte-for-byte replay.

| Measure | Baseline | Fixed-build measurement |
| --- | ---: | ---: |
| Home ready median | 2,797 ms | 1717 ms |
| Search p95 | 252 ms | 77 ms |
| Clear search p95 | 1,374 ms | 96 ms |
| Save, n=1 | 913 ms | 222 ms |
| Add button initial Y | 46,613 px, offscreen | 568 px; 56px tall, visible |

Eight search/clear samples, three Home samples and one Save sample; p95 uses nearest-rank, and the small samples are not a production SLA. No network throughput/RTT throttle or physical cheap-phone run. Browser-managed content visibility retains accessible offscreen rows; unmatched search rows use native hidden semantics, not truncated results or a new pagination feature. This optimization does **not** reduce DOM count like a recycler.

## Skills and deployment

Skills actually read/used: **Sites local-preview/publishing guidance** and **cloud-environment-runtime**. No dedicated approved UX/accessibility/testing skill was available. Playwright, Vitest and axe are tools, not claimed skills. No sub-agents were used.

**Remediation is local only; live deployment not completed.** The Sites source/packaging helper referenced by the read skill was not installed/exposed in this execution environment. The native credential response did not accept automatic private publication (`publish_on_push_accepted: false`); no automatic push/deploy was assumed. No source push, fake archive reference, audience change or unverified deployment was substituted. Build artifacts are ready locally in `dist/`.

Last published preview, **still the pre-remediation version**: https://khata-manager-mobile-preview.corallarch.chatgpt.site . It may require the same ChatGPT login. Do not use that deployment as proof the fixes are live. No live-site browser verification was run.

Local run: `npm install && npm run dev`. A browser on the same machine can use Vite's local URL; localhost in this remote workspace is **not** a mobile-accessible link. Publishing the validated artifact with supported Sites packaging remains blocked by the missing helper.

## Ten-minute manual script (disposable data only)

Use the fixed local build or a **verified updated deployment**, not the unchanged URL above. Export and check any real ledger first; preferably use a separate disposable browser profile. Count taps/swipes and stopwatch time from Home, including typing, keyboard, OS messaging and Files steps.

| Minute | Task / expected result |
| --- | --- |
| 0–1 | Open the fixed build on cheap Android; check current version/source, English/light, 360–430px width and daylight. Confirm disposable data. |
| 1–2 | Add two Ali Khans with different phones. Record taps/time. Correct identity must remain obvious; Add remains reachable on a long list. |
| 2–3 | Credit 100.10, payment 30.10. Before Save, read customer phone/action/amount/result. Expect **70.00 owed to you**. Compare Home-start and selected-detail-start times. |
| 3–4 | Type 1000 then 100 without saving: confirm review changes clearly. Save a backdated 0.01 credit; final **70.01**. Inspect chronological running balances. No transaction correction/undo exists. |
| 4–5 | On disposable data, open two tabs, post 10 in A then 20 in B. If a conflict appears, verify input survives, read updated balance then explicitly retry. Both acknowledged entries must remain. Open delete, change this customer in the other tab, then confirm: stale deletion must refuse. |
| 5–6 | Switch Urdu/dark. Read direction words plus icons; check phone/money direction, wrapping, keyboard and one-hand reach. Search Western/Urdu digits and 03/+92/0092 equivalents. |
| 6–7 | Open WhatsApp/SMS for a number you control. Verify target and exact message. Cancel without sending unless intentionally testing your own number. Count app handoff vs OS Send separately. |
| 7–8 | Save backup and locate it in Files. Explain “save” versus “restore” without coaching. Import bad JSON: nothing changes. Choose a valid disposable backup, inspect replacement counts/warning, Cancel then confirm deliberately. |
| 8–9 | Try equivalent name/phone duplicate: review existing khata, Cancel, then intentionally create separate only in disposable data. Check delete identity/balance/count and Cancel. Increase text size, use keyboard/TalkBack, inspect focus/contrast/RTL and all action reach. |
| 9–10 | Refresh and reopen; records/settings persist. Test weak/offline network separately: offline reload is a known unbuilt backlog item, not a passing PWA feature. Record task times, comprehension problems and device details; stop and report failures. |

If a task fails, record it honestly. Do not “correct” test records with invented offsetting money entries. Representative Urdu/Roman-Urdu comprehension, human timing and hardware checks must be completed before closing A-15 and the final readiness gate.
