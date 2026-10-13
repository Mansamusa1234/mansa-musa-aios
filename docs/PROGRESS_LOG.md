# Engineering Progress Log

Branch: `audit/production-readiness-20261013` (from `origin/main` @ 3a3fa85). Not pushed, not deployed.

## 2026-10-13

### Completed and verified
| Change | Commit | Verification |
|---|---|---|
| Next.js 15.5.25 → 15.5.27 (cache-poisoning advisories), sharp 0.35.5, source-map-js 1.2.2 | a8142ba | `npm audit --omit=dev`: 0 vulnerabilities |
| ESLint: CommonJS test files no longer fail lint (7 errors → 0) | a8142ba | `eslint .` exit 0 |
| **Security:** cron auth failed open when `CRON_SECRET` unset (`Bearer undefined` accepted). Now fail-closed + constant-time compare | abf7afc | New regression test fails on old code, passes on fix |
| Manual Supabase RLS lockdown script with pre-check and rollback (NOT applied) | a182dfb | Review only |

Gate on this branch: `tsc` ✅ · `eslint` 0 errors ✅ · `test:repairs` 27/27 ✅ · `next build` ✅

### Audits performed
- **Org/user isolation (app layer):** every `[id]` API route checked for IDOR. All scope by `userId` or require ADMIN. No issues found.
- **Unauthenticated routes:** 36 routes have no session check. All are intentionally public (auth flows, webhooks, public booking) or cron (now fail-closed).
- **Live site (read-only):** `/`, `/login`, `/pricing` 200; `/dashboard` → `/login` when signed out; `/api/health` reports `ok` (database and auth checks passing in production).

### Pull request triage (merged onto current main locally, then tsc / lint / tests)
| PR | Status | Finding |
|---|---|---|
| #34 X/HeyGen cron guards | **Ready** | Clean merge, all checks + full build pass. Note: X posting stops until `SOCIAL_X_ENABLED=true`. |
| #33 Playwright free-plan smoke | Likely ready | Clean merge, checks pass. Code not yet reviewed. |
| #32 Stripe fulfilment repair | **Needs Stripe test-mode run** | Upgrades Stripe SDK 17 → 23 and API version to `2026-09-30.endive`; also reverts Next to 15.5.25 (would undo the security patch). Rebase needed. |
| #23 AI Council | **Broken** | `next build` fails: `/arena/page` collides with existing `/(dashboard)/arena/page`. Also: no plan gating on up to 11 paid model calls/request; raw provider errors returned to users. |
| #24 SketricGen embed | **Security concern** | Injects arbitrary vendor script (from env) on every page incl. admin/billing/CRM. Should be limited to marketing pages. |
| #27 Proton Bridge, #29 Market Gap | Merge clean, checks pass | Code not yet reviewed. |
| #18 Paid Ads, #25 Marketing Team | Conflict | `.env.example` only (trivial). |
| #28 Super Orchestrator | Conflict | `content-queue/[id]/route.ts`, which is the approval workflow recently hardened on main; needs careful resolution. |

### Outstanding / not yet verified
- Remaining dev-only advisories (braces/micromatch via Tailwind 3) need the Tailwind v4 migration (breaking).
- Integrations (Vercel, Supabase, Stripe, Abacus, n8n, Metricool, OpenClaw, Parachute, Gmail, M365, social): **not tested**. No CLI credentials on this machine. The "Mansa Musa AI" MCP server failed to connect (ngrok endpoint 404).
- RLS status in Supabase unknown until STEP 1 of `prisma/sql/manual_supabase_rls_lockdown.sql` is run.
- Feature completion (Council, Arena, Model Hub, Marketplace, CRM, voice, search), Replica Skill review: not started.
- Local branch `fix/auth-signup-checkout-build` (eb5da52, never pushed) appears superseded by main; preserved as `backup/eb5da52-local-auth-fixes`.
