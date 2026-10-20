> Historical baseline. For audit fixes, current checks and deployment status, see [VERIFICATION.md](VERIFICATION.md).

# Final validation — all three preview steps complete

## Automated checks

- **36 Vitest tests passed in 8 files**, including 11 DOM feature flows and 2 light/dark color-contrast checks.
- **12 Playwright tests passed in actual Chromium**, including ten width/language/theme configurations and two full browser-flow/screenshot scenarios.
- `npm run typecheck`: passed, including browser test/config TypeScript.
- `npm run build`: passed.
- Translation parity: all 61 original Flutter entries in each locale remain exact.
- Flutter preservation: all 52 original source/config file hashes match; the Flutter project was not modified.

## Browser coverage

Home, customer detail, edit/new customer, credit/payment forms, settings, backup and reminder dialog were checked for horizontal overflow at 360, 390, 430 and 1280 pixels. Coverage includes English light, Urdu dark, and additional independent English-dark/Urdu-light cases. Fixtures exercise long names, long notes and maximum-size amounts.

Checks verify at least 48px button/switch touch targets, 16px form input text, theme/direction attributes, first-invalid-field focus, native modal Cancel focus, Escape dismissal, focus return, background-scroll restoration, and 125% browser zoom without horizontal overflow. Console page errors are collected during the screen matrix.

A real browser flow creates a customer, records an amount in Urdu digits and a payment, checks the exact reminder link, downloads and parses JSON, resets records, uploads the downloaded JSON with confirmation, and refreshes to verify persistence. External messages are not sent by tests.

## Visual review artifacts

Reference PNGs in `docs/screenshots/` were captured with local bundled fonts and reduced motion:

- mobile-home-en-light.png
- mobile-detail-en-light.png
- mobile-settings-ur-dark.png
- mobile-home-ur-dark.png
- desktop-home-ur-dark.png

The browser checks caught and prompted fixes for long-name overflow in a transaction explanation panel and unreliable initial focus in a native dialog.

## Practical limits

Chromium ran at mobile viewport sizes on Linux. This is not a physical iPhone/Android test and does not establish Safari/Firefox, screen-reader, onscreen keyboard or OS messaging-app behavior. The real phone owner should confirm those integrations during final review. Browsers control download destinations and cannot reliably report messaging-app installation. App data remains browser-local; hosting sign-in is separate from the app's offline ledger behavior.

The existing Flutter Android build/signing limitations are unchanged; this phase only completes the web preview. See `FLUTTER_HANDOFF.md` for a future authorized native visual port.
