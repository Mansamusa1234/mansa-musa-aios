# Mansa Musa AIOS repair audit — 6 October 2026

Scope: source review, production deployment/log and environment-name inspection, anonymous browser reproduction, targeted regression tests. This is a repair audit, not a claim that every paid or authenticated customer journey has been proven.

## Verified findings and repairs

- Registration field component remounted on every keystroke: live reproduction retained only first letter. Moved component outside form; last name optional.
- Removed passkey buttons that created client-only challenges without server verification/session creation. Credentials and OAuth failures now reset loading and surface errors.
- Production configured Vercel KV names while rate limits/health code expected Upstash names. Support both using the writable token; no credential values changed.
- Subscription entitlement resolution recognises monthly/annual prices, legacy aliases, valid card-free Professional trials and expiry. Chat, dashboard, research and model hub share it.
- Chat now reads latest twenty messages, validates input, enforces free daily limit, chooses configured entitled models and reports provider failure instead of hanging completion promises. No provider credentials reset.
- Model preference/comparison APIs enforce entitlement; model hub reports real errors and displays actual automatic model. Gemini default updated after official retirement documentation.
- Billing trial button uses async request and refresh instead of navigating into raw JSON. Checkout return does not falsely assert payment. Plan change preserves actual Stripe status.
- API-key management reports failed fetch/create/revoke instead of silently claiming success. Generated keys have no documented external bearer API in this source; this remains a product gap.
- Connector test now requires admin authentication, actual rate limiting and a configured key. News and Stripe tests perform real read-only provider checks. Other legacy sample integrations require separate live validation.
- Resend errors count as unsent; configured sender alias recognised. Draft approval uses admin auth, metadata validation, atomic pending-state claim and provider idempotency. Social approval explicitly remains manual publication. New admin approval queue.
- HeyGen request migrated to documented v3 video creation/status. No paid video generated during audit.
- SMS webhook returns one escaped TwiML reply rather than sending twice or claiming delivery.
- Booking API validates business timezone, opening hours, weekday, duration/grid and conflicts; frontend uses business timezone across DST. Notifications continue via Next after.
- Blog newsletter submits to existing API, handles success/failure and retries.
- Compatible production dependency patches remove the high Axios and moderate fast-uri advisories found at initial audit.

## Validation

- `npm run test:repairs`: 25 passing targeted regression tests, rerun on 6 October.
- `npx tsc --noEmit`: passed.
- `npm run lint`: zero errors, 26 pre-existing warnings.
- `npm audit --omit=dev --json`: zero reported vulnerabilities at audit time, not a guarantee of security.
- Production build and post-deploy browser checks recorded in deployment handoff.

## Remaining live dependencies and limits

- Existing X automation received HTTP 401: account/key reauthorisation required; source patches cannot repair a rejected credential.
- TikTok client settings exist but publish access token absent. Other social OAuth scopes/accounts require validation before claiming publication.
- No live checkout payment, customer account creation, outbound campaign or paid generation performed. Stripe webhooks, provider account balances, real email delivery and authenticated journeys still need owner test sessions.
- Public receptionist plan enforcement, external API-key usage, concurrent quota reservation, multi-turn voice and several legacy connector samples need further product work; not certified as fully complete.
- Local Omarchy/OpenClaw/Ollama hardware cannot be reached from this workspace. Private bridge repair and documented owner commands are in Command Center PR4.
- No claim of sales/revenue, literal holographic 5D display, or universal bug elimination.

## Commerce follow-up

- Login credentials/2FA and portal/enterprise forms release loading after provider or network failure. Login returns buyers to pricing/billing; canonical email lookup includes legacy casing.
- Signup follow-up work uses Next after plus allSettled so one failed email does not abort independent tasks.
- Lead/exit forms report real API results; removed unimplemented downloadable-resource promises. Removed unsupported registration customer-count and compliance claims.
- Paid pricing buttons accurately describe subscriptions rather than promising an immediate checkout is a no-card trial.
- Checkout blocks duplicate subscriptions using local state and current Stripe data, reuses matching open sessions, expires conflicting open subscription sessions, and uses a short-lived idempotency key.
- Webhook status follows current Stripe status for completed checkout and successful/failed invoices. Repeat activation email uses provider idempotency; known subscription checkout replays skip repeated activation workflows. No durable event ledger added; concurrent event workflows/commission accounting require further work.
- First production repair deployed READY as a908c232c4436c2765c2a995629d51fd11f041d2. Live signup retained Darren-neil; anonymous admin, queue and chat APIs returned401; public health200/ok.
- Follow-up production build passed on 6 October after replacing the build-time Google font download with a system font stack. The remote main branch was verified still at the first repair commit before preparing this release.
- Laptop-local commit eb5da52 was not transferred into this workspace. This release includes the independently reviewed commerce fixes here; it does not claim to include every laptop-local audit change.
