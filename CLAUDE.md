# Mansa Musa AI — agent instructions

Next.js 15 App Router + TypeScript, Prisma → Supabase Postgres (server-side only, no Supabase JS client), NextAuth v5, Stripe (stripe-node 17, API `2025-02-24.acacia`), Anthropic/OpenAI/Gemini/Grok/Mistral SDKs. Hosted on Vercel; production branch is `main`.

## Verify every change
```
npx tsc --noEmit -p .
npx eslint .                 # 0 errors required
npm run test:repairs         # node:test, tests/*repairs.test.cjs
npm run build
```
Tests load a single route/lib file through `ts.transpileModule` + `vm` with mocked `@/lib/*` imports; copy an existing `tests/*-repairs.test.cjs` fixture. Prove each new test fails on the old code.

## Conventions
- API routes: `auth()` → plan gate (`hasFeature(await getActivePlan(userId), "<feature>")`, gates in `src/lib/subscription.ts`) → `checkRateLimit(limiters.x, id)` → zod validation → work.
- Scope every record lookup by `userId` (or require ADMIN).
- Cron routes use `withCron` (`src/lib/cronUtils.ts`); it fails closed without `CRON_SECRET`.
- Stripe webhook payloads: read via `src/lib/stripePayload.ts` helpers (supports legacy and modern shapes).

## Hard rules
- Never merge PRs, deploy to production, change the production database, or touch Stripe/ad spend without owner approval. Work on a branch; open draft PRs.
- `prisma/sql/manual_*.sql` are reviewed scripts for the owner to run — never wire them into the build.
- Never print or commit secrets. `.env*` stays local.

Progress and open issues: `docs/PROGRESS_LOG.md`. Cost settings: `docs/COST_OPTIMISATION.md`.
