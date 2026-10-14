# Engineering Progress Log

Branch: `audit/production-readiness-20261013` (from `origin/main` @ 3a3fa85). Pushed as **draft PR #35** (preview only). Not merged, not deployed to production.

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
- Third-party integrations: not yet verified end to end.
- Database permission hardening: reviewed script prepared (`prisma/sql/manual_supabase_rls_lockdown.sql`), pending owner verification.
- Feature completion (Council, Arena, Model Hub, Marketplace, CRM, voice, search): not started.
- Local branch `fix/auth-signup-checkout-build` (eb5da52, never pushed) appears superseded by main; preserved as `backup/eb5da52-local-auth-fixes`.

## 2026-10-14

### Completed and verified
| Change | Commit | Verification |
|---|---|---|
| Pushed branch, opened draft PR #35 (secret scan of diff clean) | — | Preview build only; schema script exits unless `VERCEL_ENV=production`; crons run only in production |
| **P0 revenue:** Stripe webhook accepts modern (Basil/Dahlia) and legacy (Acacia) payloads on stripe-node 17. Ported from #32 without its SDK 17→23 upgrade, coupon changes or Next.js downgrade | 3815c8b | New tests fail 3/19 on old handler, pass on fix. Gate: tsc ✅ eslint 0 errors ✅ tests 32/32 ✅ build ✅ |

Bugs fixed by 3815c8b (live if the Stripe endpoint sends modern payloads, which #32's audit indicates):
- `customer.subscription.deleted`: periods moved to items, giving Invalid Date → webhook 500 → **cancelled customers kept paid access**.
- `invoice.*`: `invoice.subscription` moved to `parent.subscription_details` → renewals, affiliate renewal commissions and failed-payment downgrades silently skipped.
- `checkout.session.completed` granted access on unpaid async payments; `async_payment_succeeded` (already subscribed live) was ignored.


### PR #32 status update
Webhook fixes are now in #35. What remains unique to #32: the Stripe SDK/API upgrade, coupon `promotion` shape, and receptionist plan gating. The receptionist gating is worth porting next; the SDK upgrade still needs a Stripe test-mode run.

### Further P0 revenue / cost repairs (2026-10-14)
| Change | Commit | Verification |
|---|---|---|
| AI receptionist (chat, config, widget, voice, SMS) requires Starter+; lead email kept alive via `after()`. Ported from #32 | 01372f5 | New tests fail 2/2 on old code; gate green |
| `/api/workforce/chat`: Starter+ gate (`workforce_csuite` was declared but never enforced), per-user rate limit, zod validation, prototype-key roles rejected; UI shows server errors | 0faa7e8 | New tests fail 2/3 on old code; tsc ✅ eslint 0 errors ✅ tests 37/37 ✅ build ✅ |
| `CLAUDE.md` + `AGENTS.md` project instructions; `docs/COST_OPTIMISATION.md` | this commit | Docs |

Behaviour change to note before merging #35: Free users lose access to the AI receptionist and the C-suite workforce chat, matching the plan gates declared in `src/lib/subscription.ts`.

## 2026-10-14: Launch verification
| Change | Commit | Verification |
|---|---|---|
| Local end-to-end subscription journey (Docker Postgres + real Stripe SDK on stripe-mock v0.205.0): signup → Free blocked from paid AI → checkout → tampered webhook rejected → signed webhook fulfils → Starter uses AI → cancellation revokes | 6d0d064 | **7/7 pass** on this branch; **4/7 fail on `main`** |
| Daily social pipeline: cron queues one draft/day (no direct publishing); HeyGen only when `SOCIAL_HEYGEN_ENABLED=true`; approval schedules per-network Metricool posts with UTM links (drafts by default); Metricool rejection keeps the draft pending | 9d05315 | 6 new tests; real local app: cron 401 without secret, queued once per day, admin approval OK |
| First-touch UTM → Stripe checkout and subscription metadata (revenue attribution) | 9d05315 | New test incl. unsafe-value stripping |
| Approval queue shows video preview / rendering status | this commit | tsc, eslint |

Gate: tsc ✅ · eslint 0 errors ✅ · test:repairs 44/44 ✅ · test:journey 7/7 ✅ · build ✅

Not yet verified against real services (credentials required): Stripe test mode, Metricool API, HeyGen render, Anthropic/Abacus calls.

> Operational notes (tooling, accounts, open security items) are kept in the owner's private workspace, not in this public repository.
