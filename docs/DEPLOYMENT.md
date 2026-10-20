# GitHub / Vercel deployment — 20 October 2026 (Pakistan time)

## Current state

- Working directory: `/workspace/khata-preview` only. Flutter was not accessed or changed.
- GitHub authenticated identity verified: `dawoodanimation-creator`.
- Requested new private repository: `khata-preview`.
- Repository creation attempted with the connected GitHub credentials; GitHub rejected it: `Resource not accessible by integration (createRepository)`. **The agent could not create a repository.** The owner subsequently created the repository linked below.
- Vercel connection is now confirmed. Owner supplied repository https://github.com/dawoodanimation-creator/khatamanger ; verified empty, public, with push access. Its visibility is preserved. Deployment is in progress.
- Existing Sites remote/deployment are unchanged. No Vercel live URL exists yet.

## Prepared and validated

- `vercel.json`: Vite framework, `npm run build`, `dist` output, SPA fallback for customer/settings deep links, assets excluded from fallback.
- `.gitignore`: local `.vercel` state and generated source ZIP excluded, alongside existing dependencies/cache/env/build exclusions.
- Production build/TypeScript passed: `docs/verification-evidence/vercel-build.txt`.
- Unit/DOM suite passed, 64 tests: `docs/verification-evidence/vercel-unit-run.txt`.
- Hosting setup adds no application features. Previous audit/human-test limitations still apply; this is a preview deployment, not a certified shop-use release.
- `khata-preview-source.zip`: portable source/config/docs, excluding Git metadata, dependencies, build output, caches, local env files and Sites identity. Extract into an empty repository directory; do not commit the ZIP itself.

## Required access to finish

1. Create an **empty private** GitHub repository named `khata-preview` at https://github.com/new and supply its URL, or grant repository-creation capability through an approved account connection. The current connected integration cannot do it.
2. Connect Vercel to this chat/account. No plaintext credentials should be pasted into chat or committed.
3. With access verified: push the reviewed source to the new repository, import/link it in Vercel, keep the free plan/no paid services, deploy, and verify Home plus direct `/customers/new`, `/settings`, and customer-detail routes.
4. Record the actual repository URL, commit SHA and successful Vercel deployment URL here. Until then, do not claim upload/deployment complete.

If doing the Vercel import manually: Add New → Project → import the new GitHub repository; framework Vite, root directory `.`, build command `npm run build`, output `dist`. No application environment variables are required. Keep the repository private; no real ledger data belongs in the repository. LocalStorage data does not migrate between the old Sites URL and the new Vercel origin; use the existing backup/restore flow if needed.
