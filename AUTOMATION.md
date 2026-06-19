# Autonomous replies & payments — Mansa Musa Kitchen & Lounge

This is the "agents run it" layer: incoming emails, reviews, social comments/DMs and
customer messages are read, a reply is written in your brand voice, and it's **either
sent automatically or queued for your approval** — based on a safety dial you control.

## How a message flows
```
 inbound (email / review / social / WhatsApp / SMS)
        │   POST /inbound  (or the scheduler polling reviews)
        ▼
 backend/automation.py  ── reads config/automation.yaml
        │   1. master switch on?      (AUTO_REPLY_ENABLED)
        │   2. quiet hours?
        │   3. guardrails ok?         (keywords, star rating, length)
        ▼
   ┌─────────────┐         ┌──────────────────────────┐
   │  AUTO  → send via official API (email/FB/Google/WhatsApp/SMS)
   └─────────────┘         └──────────────────────────┘
   ┌─────────────┐
   │  DRAFT → queued in tasks as 'awaiting_approval' (you click approve)
   └─────────────┘
```
Everything is logged to `agent_actions` either way.

## The autonomy dial — `config/automation.yaml`
Each channel is `off` / `draft` / `auto`. Defaults shipped:

| Channel | Default | Why |
|---------|---------|-----|
| `review_positive` (4–5★) | **auto** | A warm thank-you is safe to send itself |
| `review_negative` (1–3★) | **draft** | Never argue in public without a human |
| `email_customer` | **auto** | Hours/menu/booking questions — but escalates refunds, illness, complaints |
| `email_supplier` | **draft** | Money & contracts — you approve |
| `social_comment` / `social_dm` | **auto** | Short, friendly, on-brand; escalates abuse/complaints |
| `whatsapp_customer` / `sms_customer` | **auto** | Booking confirmations, quick answers |

Guardrails per channel: `escalate_keywords` (e.g. refund, allergic, food poisoning, lawyer)
force a draft; star thresholds gate reviews; `max_words` keeps replies tight. `quiet_hours`
stops automated sends overnight (they queue instead).

## Two master switches (in `.env`)
- `AUTO_REPLY_ENABLED=false` → **safe mode**: everything drafts, nothing sends. Keep it
  here until you've watched the drafts for a few days.
- `ALLOW_AUTO_PUBLISH=false` → same idea for proactive social *posting*.

Flip them to `true` only when you trust the output.

## Connecting inbound sources
Point each provider's webhook at `POST https://api.mansamusainitiative.co.uk/inbound`
with header `X-Webhook-Secret: <your WEBHOOK_SECRET>` and a body like:
```json
{ "channel": "email_customer", "text": "Are you open Sunday?",
  "sender": "guest@example.com", "sender_name": "Sam", "reply_to": "guest@example.com" }
```
- **Email:** Resend/your inbox provider → inbound parse webhook → `/inbound`.
- **Reviews:** the scheduler already polls Tripadvisor (`--run-now review_autoreply`);
  add Google review pull the same way. Channel auto-set by star rating.
- **Facebook/Instagram comments & DMs:** Meta webhook → map to `social_comment`/`social_dm`
  (include `comment_id` so replies post to the right thread).
- **WhatsApp:** Meta WhatsApp webhook → `whatsapp_customer`.

## Payments (the fintech bit) — Stripe Payment Links
`POST /payments/link` creates a hosted Stripe checkout URL you can text or email —
ideal for **catering deposits, event tickets, pre-orders**. No checkout page to build.
```bash
curl -X POST https://api.mansamusainitiative.co.uk/payments/link \
  -H 'content-type: application/json' \
  -d '{"description":"Catering deposit — 40 guests","amount_gbp":150,"quantity":1}'
# -> { "status":"created", "url":"https://buy.stripe.com/..." }
```
Needs `STRIPE_SECRET_KEY` (separate from the read-only reporting key). Money settles into
your normal Stripe payouts. The Finance/Revenue agents already read takings for the dashboard.

## Honest limits
- "Auto" replies still depend on each platform's **official API + your tokens**. Until those
  are connected, an `auto` decision safely falls back to a draft (it can't send without a route).
- I deliberately keep complaints, refunds, illness, suppliers and negative reviews on **draft**.
  Fully autonomous replies to those would damage the business and breach platform norms — the
  agents prepare them, you press send.
