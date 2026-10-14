# Release and rollback procedure

Production is the Vercel project `mansamusaai`, deployed from `main`. Only the owner approves a merge to `main`.

## Gate (automatic)
`.github/workflows/release-gate.yml` runs on every PR to `main` and on `main` itself. Any failure blocks the release:
secret scan · `npm audit` (production deps, high/critical) · `tsc` · ESLint (0 errors) · unit and security regression tests ·
subscription, tenant-isolation and Preview-database-guard tests on real Postgres + stripe-mock · production build.
Make **Release gate / gate** a required status check on `main` so a red gate cannot be merged.

## Before merging
1. Release gate green on the PR head commit.
2. Preview deployment for that commit is Ready; spot-check `/`, `/login`, `/pricing`, `/api/health`.
3. Note the current production deployment URL (Vercel → Deployments → Production) — this is the rollback target.
4. Production env: confirm `SOCIAL_DIRECT_PUBLISH` and `SOCIAL_PUBLISH_NETWORKS` are what you intend (both off/empty means nothing is posted).

## Release
Merge the PR (squash or merge commit). Vercel builds and promotes it to production automatically.

## Verify (within 15 minutes)
- `/api/health` returns `ok`; sign-in works; `/pricing` → checkout opens.
- Vercel → Logs: no new 5xx spike. Sentry: no new error group.
- Next 09:00 UTC: `/api/cron/social-post` logs `queued` and the draft appears in **Admin → Approval queue** as PENDING; nothing is posted.

## Roll back
- **Fast (no code change):** Vercel → Deployments → previous production deployment → **Promote to Production** (instant, reversible).
- **Code:** `git revert -m 1 <merge-commit>` on a branch → PR → gate green → merge.
- The PR adds no database migration, so rollback needs no data change.

## Environment separation
- Production secrets live only in Vercel Production (sensitive values, not readable back).
- Preview uses `PREVIEW_DATABASE_URL` when set; otherwise it is **read-only** against `DATABASE_URL` (`src/lib/previewDbGuard.ts`), so Preview tests cannot change customer records.
- Preview diagnostics write only to the Vercel build log (team access), never to served files.

## Credential rotation
Rotate in the provider, update the Vercel variable (Production and/or Preview), then redeploy:
Stripe (secret key, webhook secret), `NEXTAUTH_SECRET`/`AUTH_SECRET` (signs every user out), `CRON_SECRET`, Meta/Instagram,
YouTube OAuth client, `ABACUS_API_KEY`, `BLOB_READ_WRITE_TOKEN` (also the GitHub Actions secret). Never paste values into issues, PRs or chat.

## Incident response
1. Contain: Promote the last good deployment; set `SOCIAL_DIRECT_PUBLISH=false`; rotate any exposed credential.
2. Assess: Vercel logs, Sentry, Stripe events, Supabase logs for the affected window.
3. Notify: if personal data was exposed, assess UK GDPR breach reporting (ICO within 72 hours where required).
4. Fix forward through a PR that passes the release gate; record the incident in the progress log.

## This release (PR #35)
**Database migration: none.** No schema change, so rollback needs no data change.

**Environment variables** (names only; values live in Vercel):
| Variable | Where | Purpose |
|---|---|---|
| `NEXTAUTH_SECRET` or `AUTH_SECRET` | Production, Preview | Session and 2FA challenge signing. 2FA now fails closed without it. |
| `CRON_SECRET` | Production | Cron routes fail closed without it. |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_STARTER`, `STRIPE_PRICE_PROFESSIONAL`, `STRIPE_PRICE_ENTERPRISE` | Production (live), Preview (**test mode only**) | Billing. |
| `PREVIEW_DATABASE_URL` | Preview | Isolated database; without it Preview is read-only. |
| `SOCIAL_DIRECT_PUBLISH`, `SOCIAL_PUBLISH_NETWORKS` | Production | Off/empty means approval never posts. Add a network only after approving its first post. |
| `SOCIAL_VIDEO_BASE_URL` | Production | Public Blob store base URL for the daily video. |
| `BLOB_READ_WRITE_TOKEN` | GitHub Actions secret | Daily video upload. |
| `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET` (`YOUTUBE_REDIRECT_URI` optional) | Production | YouTube; connect once at `/api/auth` as admin. |
| `NEXT_PUBLIC_LAUNCH_PROMO_CODE` | Production | Shows the launch banner only once the code exists in Stripe. |

**Behaviour changes customers will notice**
- Free trial and checkout need a verified email. Unverified users see how to resend the link in Settings. Login is unchanged.
- Free accounts can still view and delete their CRM, booking, WhatsApp and email-automation data but cannot create new items.
- The launch banner and its countdown are hidden until a real promotion code is configured.

**Smoke checks after deploy** (no writes to customer data): run `node scripts/smoke-check.mjs https://www.mansamusainitiative.com` (exit code 1 on any failure), covering:
`/`, `/pricing`, `/login`, `/register` return 200 · `/api/health` returns `ok` or `degraded` (never `error`) · `/dashboard` redirects to `/login` when signed out · `/_diagnostics/*` returns 404 · `/api/cron/social-post` without the secret returns 401.
