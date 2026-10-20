> **Audit remediation (19 October 2026):** A-01–A-15 implemented locally; current results, limits and 10-minute test script are in [docs/VERIFICATION.md](docs/VERIFICATION.md). The existing hosted preview has **not** been updated with these fixes; Sites packaging is unavailable here. Flutter was not accessed or modified.

# Khata Manager · Web preview

A separate React preview of `/workspace/khata_manager`. The Flutter project is read-only and has not been modified. App data stays in browser localStorage with no backend or paid services. Owner-private Sites hosting is enabled for mobile review; the hosting layer may ask you to sign in with the same ChatGPT account.

## Open the preview

```sh
cd /workspace/khata-preview
npm install
npm run dev
```

Open **http://localhost:5173** in the same machine's browser. In a remote workspace, use your editor's forwarded URL for port **5173**; your own machine's localhost is not the remote server. The dev server binds to `0.0.0.0`.

```sh
npm test
npm run build
npm run test:browser
```

Browser tests use `/usr/bin/chromium` when available. Otherwise run `npx playwright install chromium` once, or set `KHATA_CHROMIUM_PATH` to an installed Chromium executable. The Playwright suite starts Vite when needed and writes reference screenshots under `docs/screenshots/`.

The production bundle is in `dist/`. `npm run preview` serves it locally. Node 22.12+ (or a compatible newer version) is recommended.

## Current milestone: All three steps complete

Mobile preview: **https://khata-manager-mobile-preview.corallarch.chatgpt.site** (owner-private; use the same ChatGPT account if prompted).

Ready to click:

1. **Home → Load demo data** (or Settings → Load demo data). Confirm to create three sample customers: Ali owes Rs 2,500.00, Sana has a Rs 200.00 advance, and Bilal is settled. Demo data is never injected automatically.
2. Search by name or phone, then open a customer. Edit their name/phone/note without changing the transaction history.
3. **Udhaar Diya / Payment Mili** → amount, note, date → Save. Credit increases the balance; payment decreases it. Overpayment is allowed. Backdated entries receive chronological running balances even though the display is newest first.
4. For a positive balance, **Send balance reminder** opens a dialog with the exact Roman Urdu message and WhatsApp/SMS links. You send the message yourself in the external app.
5. **Settings → Backup & restore** → Export JSON backup downloads the full ledger. Import validates a selected JSON file, shows record counts, and confirms before replacing customers, transactions AND settings. Cancel leaves current data intact.
6. **Settings → Reset data** confirms before deleting preview customers/transactions. Demo/reset preserve language and theme.
7. Switch English / اردو or dark mode; refresh to verify that both settings and the ledger persist.
8. Delete a customer only after confirmation; their entire transaction history is deleted with them.

The phone is 402px wide on desktop and fluid at 360–430px on mobile. Fonts are bundled through npm, without runtime requests to Google Fonts. Dialogs use the browser's native focus/escape behavior. Data lives only in the current browser/origin; another phone/browser starts with its own empty ledger.

**Step 3 is complete:** responsive/RTL/dark-mode polish, large touch targets, focus management, browser checks and a detailed Flutter handoff. The Flutter app is unchanged. See `docs/FLUTTER_HANDOFF.md` and `docs/screenshots/` for the review/port references.

## Structure

```text
src/models/       Exact Flutter customer/transaction/settings fields
src/utils/        Balance, running history, amount parsing, JSON codec
src/i18n/         en.json, ur.json, typed translation helpers
src/theme/        tokens.ts: light/dark colors, typography, spacing, radii, layout
src/state/        LocalStorage repository and React settings state
src/components/   Header, balance labels, ledger illustration
src/screens/      Home, customer form/detail, transaction, settings, backup
e2e/              Chromium responsive and full browser-flow checks
docs/CHANGES.md   Running change log and Flutter application instructions
docs/PARITY.md    Source audit and parity contract
```

No sample customers are injected automatically. Browser data uses the separate key `khata-preview.ledger.v1`. Saving writes storage before changing UI state. Invalid existing data is reported and never silently erased. The JSON codec and upload/download UI follow Flutter schema version 1. Uploads larger than 20 MB or with invalid relationships are rejected before replacement. A browser storage failure does not navigate away from an unsaved form.

All user-facing strings live in the two JSON dictionaries. Existing Flutter strings were extracted without rewriting; new preview-only strings have separate keys. The app title and browser theme color are set from i18n and theme tokens.

## Validation limits

Vitest covers balance/backup rules and end-to-end DOM interactions for forms, transactions, reminders, import confirmation, demo/reset, persistence, search and Urdu. TypeScript/Vite builds the production bundle. Chromium browser tests additionally check 360/390/430px and desktop layouts, both languages/themes, long names and large amounts, touch sizing, native dialog focus/Escape, zoom, real JSON download/upload and refresh persistence. Screenshots provide a visual reference. This is desktop Chromium at mobile viewport sizes, not a physical iPhone/Android device; system keyboards, assistive technology and external messaging handoffs still need a real-device check. Browsers cannot reliably detect whether a messaging app is installed; share links preserve the Flutter targets and exact message. The export success notice means the download was started; the browser controls where it is saved.
