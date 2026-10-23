# GitHub / Vercel deployment

## Confirmed current state

- Repository: https://github.com/dawoodanimation-creator/khatamanger
- Owner supplied this public repository. Its visibility was preserved.
- Latest app source was pushed successfully to `main`, initial app commit `d0c1049c2b40a432877bc2e3a0ad1f81ca051bde`.
- Source includes audit fixes, models, English/Urdu strings, tests, documentation and Vercel setup. Git metadata, Sites identity, environment files, dependencies and caches were excluded from the clean snapshot.
- Production build/TypeScript and 64 unit/DOM tests passed before upload. Evidence: `docs/verification-evidence/vercel-build.txt` and `vercel-unit-run.txt`.
- Vercel is connected, with discovered team `dawoodanimation-creator` (`team_kQFNkglrtVgVmBDIzP9HcRr8`).
- Creating the Git-linked project returned **403 Forbidden: You don't have permission to create the project**. A later project-list check still returned no matching project.
- No authenticated CLI fallback is configured. No automatic permission fix was asserted and the rejected creation request was not repeatedly retried unchanged.
- **No successful Vercel deployment/live URL exists yet.** GitHub upload is complete; hosting remains blocked by project-creation access.
- Work stayed in `/workspace/khata-preview`; Flutter was not accessed or modified. Existing Sites remote/deployment are unchanged.

## Prepared hosting configuration

`vercel.json` selects Vite, build command `npm run build`, output directory `dist`, and SPA fallback for direct customer/settings URLs. Assets are excluded from the fallback. No application environment variables, backend or paid service are needed.

## One-time dashboard action required

Open https://vercel.com/new in the intended account/team, import `dawoodanimation-creator/khatamanger`, then choose Deploy:

- Framework: Vite
- Root directory: `.`
- Build command: `npm run build`
- Output directory: `dist`

If the repo is not listed, allow the Vercel GitHub integration access to this repository. Do not paste tokens into chat or commit credentials. Send the resulting project/deployment URL so its build status, Home and direct routes can be verified. Do not assume a guessed `.vercel.app` address is live.

## Verification after deployment

Confirm the served commit matches the intended `main` revision and the deployment is READY. Verify `/`, `/customers/new`, `/settings`, `/settings/backup` and a real customer deep link; confirm JS/fonts load, refresh works and existing backup/restore operates. If deployment protection is present, use authorized access without weakening it.

The audit's remaining human/device checks and backlog are unchanged; deployment is a review preview, not certification for shop-use readiness. LocalStorage does not migrate between the old Sites URL and the new Vercel origin; use existing backup/restore if needed.
