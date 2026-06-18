# Phase 2 — Connecting the platforms (official APIs only)

The OS now has real connectors for **Facebook, Instagram, TikTok, Google Business
Profile, and WhatsApp**. Each one performs the documented API call when its keys
are in `.env`, and falls back to a safe DRAFT when they're not. Nothing here logs
into an account, scrapes, or shares passwords — that's what gets accounts banned.

Workflow stays: **agent drafts → you approve in the dashboard → it posts via the API**
(or set an agent to `auto_publish: true` + `ALLOW_AUTO_PUBLISH=true` to skip approval).

---

## 1. Facebook Page + Instagram (one Meta app)

1. Go to **developers.facebook.com** → Create App → type *Business*.
2. Add the **Facebook Login** and **Instagram Graph API** products.
3. Connect your Page, and link your Instagram **Business/Creator** account to that Page.
4. Request these permissions (App Review needed to go live for non-admins):
   `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`,
   `instagram_content_publish`.
5. Generate a **long-lived Page access token**.
6. Fill `.env`:
   ```
   META_PAGE_ID=...
   META_PAGE_ACCESS_TOKEN=...
   META_IG_BUSINESS_ID=...
   ```
- Facebook: text or photo posts both work.
- Instagram: **requires** an image/video URL — pass `media_url` in the agent context.

## 2. TikTok

1. **developers.tiktok.com** → create app → add **Content Posting API** (scope `video.publish`).
2. Until TikTok audits your app, posts can only be `SELF_ONLY` (private). Keep
   `TIKTOK_PRIVACY=SELF_ONLY` for testing; switch after approval.
3. TikTok is **video-only** — supply a public MP4 URL as `media_url`.
4. `.env`: `TIKTOK_ACCESS_TOKEN=...`

## 3. Google Business Profile

1. **Google Cloud Console** → enable the *Business Profile* APIs.
2. Set up OAuth for the Google account that owns the listing; get an access token
   (in production, store a **refresh token** and mint access tokens hourly).
3. `.env`:
   ```
   GOOGLE_BUSINESS_ACCOUNT_ID=accounts/123...
   GOOGLE_BUSINESS_LOCATION_ID=locations/456...
   GOOGLE_OAUTH_TOKEN=...
   ```
- `publish_local_post` creates an offer/update post.
- `reply_to_review` posts your drafted review reply.

## 4. WhatsApp Cloud API

1. **developers.facebook.com** → your Meta app → add **WhatsApp**.
2. Get a test phone number id + token (then register your business number).
3. `.env`: `WHATSAPP_PHONE_NUMBER_ID=...`, `WHATSAPP_TOKEN=...`
4. **Policy that matters:** outside a customer-initiated 24-hour window you may
   only send **pre-approved template messages** to users who **opted in**. Free
   text only works inside an open 24h conversation. The connector supports both.

---

## Try it (once keys are in `.env`)

```bash
# Auto-publish a marketing slot (only fires if ALLOW_AUTO_PUBLISH=true)
python scheduler/daily_workflow.py --run-now 09:00

# Approve-and-publish a reviewed draft via the API
curl -X POST localhost:8000/publish -H 'content-type: application/json' \
  -d '{"channel":"facebook","content":"Tonight: live highlife + suya platters. Book now.","media_url":null}'

# Send a WhatsApp booking confirmation (inside 24h window)
curl -X POST localhost:8000/whatsapp/send -H 'content-type: application/json' \
  -d '{"to":"4477...","content":"Your table for 4 at 7pm is confirmed. See you tonight!"}'

# Send an opt-in broadcast via an approved template
curl -X POST localhost:8000/whatsapp/send -H 'content-type: application/json' \
  -d '{"to":"4477...","template":"weekend_special","lang":"en_GB"}'
```

A `blocked` status in the response just means that platform's keys aren't set yet —
the content is still saved as a draft, nothing is lost.
