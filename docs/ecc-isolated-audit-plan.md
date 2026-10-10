# ECC isolated audit and integration plan

Status: PREPARATION ONLY — ECC not verified installed on user's laptop. This branch is not production.

## Scope and guardrails
- Base branch: main; working branch: ecc-audit-development.
- Do not merge, deploy, run production database migrations, alter Stripe live settings, or rotate secrets without explicit approval.
- Never commit tokens, credentials, customer data or generated .env files.
- Keep ECC execution local to a reviewed developer environment; do not execute downloaded scripts or hooks blindly.
- Run npm ci, lint, typecheck, tests, build, and dependency/security scans in an isolated environment before any PR merge.
- Validate Vercel preview uses non-production credentials and isolated data before exercising webhooks or migrations.

## Pull-request inventory (11 Oct 2026)
- #32 Stripe payment fulfillment / receptionist — draft, mergeable; 20 changed files. Needs Stripe test-mode end-to-end checkout -> signed webhook -> entitlement -> cancellation, and webhook idempotency review.
- #29 Abacus Market Gap Intelligence — draft, mergeable; 10 changed files. Needs authenticated runtime test, worker provenance verification, SSRF/URL validation, timeouts and fallback/source labelling.
- #28 Super Orchestrator — draft, merge conflict.
- #27 Proton Mail Bridge — draft, mergeable; assess credential handling and local-only trust boundary.
- #25 AI Marketing Team / Abacus — merge conflict.
- #24 SketricGen Brand Agent — mergeable.
- #23 AI Council — mergeable.
- #18 Paid Ads Growth Agent — merge conflict.
Mergeability is not security or runtime certification.

## Critical investigation
PR #32 includes an audit document claiming 62 public database tables lack RLS and direct database grants are overly broad. This is a reported finding, NOT independently verified here. Verify actual roles, privileges, consumers, and access paths before proposing least-privilege changes. Do not execute a bulk revoke/RLS migration against production.

## ECC installation (developer laptop; NOT installed by this commit)
Official source: https://github.com/affaan-m/ECC
Choose exactly ONE installation path for the chosen coding harness (Claude Code/Codex/etc.). Review the current upstream README, install scripts, hooks and requested permissions before installation. Do not layer plugin and manual installs. Verify plugin list/doctor after installation. ECC installation on a laptop cannot be confirmed by a GitHub commit.

## Acceptance gates
1. CI lint, typecheck, unit tests and production build green on branch.
2. Security review of authz, tenant isolation, secrets, input validation, webhook replay/idempotency and dependencies.
3. Stripe test-mode E2E verified with no live charges.
4. Abacus live-source provenance independently verified; fallback never misrepresented as live.
5. No production database modifications, no unreviewed hooks or CI permissions.
6. Owner approval required for merges/deployments.
