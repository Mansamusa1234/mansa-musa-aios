# Production commerce audit — 7 October 2026

## Implemented

- Upgrade stripe-node to 23.0.0 and explicitly pin requests to 2026-09-30.endive, verified against https://docs.stripe.com/api/versioning. Preserve compatibility with existing Acacia and Dahlia webhook payloads; the existing live endpoint retains its own version.
- Read item-level billing periods and invoice parent.subscription_details.subscription. Renewal, failed payment, cancellation and plan changes now handle modern Stripe shapes without ignoring subscription IDs or writing invalid dates.
- Handle checkout.session.async_payment_succeeded. Checkout completion only fulfills paid or no-payment-required sessions. Check that the customer belongs to the mapped application user.
- Enable eligible dynamic payment methods, propagate ownership metadata to the subscription, use flexible billing for new subscriptions and supply a stable integration identifier. Existing subscriptions are not migrated or canceled.
- Update promotion-code administration for the modern promotion.coupon shape.
- Enforce paid receptionist entitlement on configuration, widget configuration, chat, voice and SMS. Existing valid Professional trials retain access through the shared entitlement resolver.
- Keep receptionist lead notifications alive with Next after and await the send.

## Live configuration changes

The MMILF live webhook endpoint is enabled at https://www.mansamusainitiative.com/api/stripe/webhook and includes checkout.session.completed and checkout.session.async_payment_succeeded alongside the existing subscription and invoice events. Product IDs, existing prices, subscribers and balances are unchanged.

## Validation

- 31 regression tests passed before the final real-SDK signature regression was added; the signature regression then passed in the targeted suite.
- TypeScript passed. ESLint: zero errors, 26 existing warnings.
- Production build passed, with existing NextAuth/jose Edge API warnings.
- Current production /api/health returned HTTP 200 / status ok. Anonymous billing-admin requests returned 403.
- Resend domain verified, sending enabled. No email or purchase was sent to prove delivery or paid access.

## Blocking security work — NOT APPLIED

62 public database tables lack RLS. Direct anon/authenticated grants include read/write and TRUNCATE on sensitive tables, including password reset tokens, email verification tokens, API keys and content queues.

Source uses NextAuth + server-side Prisma; no browser Supabase client was found. Table owner postgres and service_role bypass RLS. The proposed production permission migration was removed from this application release and was not applied.

Automatic approval review rejected the production migration because revoking privileges and enabling RLS across every public table carries production-wide compatibility and availability risk. No permission changes were applied. Owner approval and verification of the runtime database role and other direct API consumers are required before applying it. The build does not execute this migration.

## Other limits

- A real authenticated checkout and payment-to-entitlement journey still needs a sandbox or owner-driven test. Signed fixture tests verify handler behavior, not a real charge.
- The app's direct X automation returned 401; HeyGen returned insufficient-credit 402. Metricool's separate Instagram/Facebook/TikTok connection does not supply these application credentials.
- LinkedIn identity verification and Metricool's paid X connection were deferred by the owner. YouTube is available to connect using the owning Google account.
- Durable webhook event-level workflow deduplication, atomic concurrent usage quotas, external bearer API-key endpoints, voice conversational memory and validation of each advertised external integration remain outside this repair release; no claim of complete certification or revenue is made.
