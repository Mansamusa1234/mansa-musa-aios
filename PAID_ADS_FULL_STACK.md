# Mansa Musa AI — Paid Ads Growth Agent

This module turns the existing Mansa Musa AI application into a cross-platform paid-advertising command centre.

## Architecture

```text
Meta Ads ─┐
Google Ads ├─> /api/ads/sync ─> campaign snapshots ─┐
TikTok Ads ┘                                        │
                                                   ├─> Growth Agent ─> decision log ─> approval queue ─> live provider mutation
Website conversions ─> /api/ads/conversion ───────┤
CRM leads <────────────────────────────────────────┤
Stripe checkout revenue ─> attribution events ────┤
Supabase (optional mirror) <───────────────────────┘
```

## Environment variables

### Meta Ads

```env
META_AD_ACCOUNT_ID=
META_ADS_ACCESS_TOKEN=
META_GRAPH_API_VERSION=v23.0
META_ADS_CURRENCY=GBP
```

Use a server-side Meta system-user token with only the permissions the application needs. Never expose it to browser code.

### Google Ads

```env
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=
GOOGLE_ADS_ACCESS_TOKEN=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_API_VERSION=v18
GOOGLE_ADS_CURRENCY=GBP
```

The API version is deliberately configurable. Update the environment variable when Google retires an API version instead of hard-coding credentials or versions in UI code.

### TikTok Ads

```env
TIKTOK_ADVERTISER_ID=
TIKTOK_ADS_ACCESS_TOKEN=
TIKTOK_ADS_CURRENCY=GBP
```

### Stripe revenue attribution

The existing `STRIPE_SECRET_KEY` is reused. When creating a Checkout Session, attach campaign attribution in metadata wherever possible:

```ts
metadata: {
  campaign_id: "<provider campaign id>",
  ad_platform: "META", // META | GOOGLE | TIKTOK
  utm_source: "facebook",
  utm_medium: "paid_social",
  utm_campaign: "<provider campaign id>",
  utm_content: "<creative id>"
}
```

The sync engine imports paid Checkout Sessions and de-duplicates them by Stripe Checkout Session ID.

### First-party website + CRM attribution

```env
ADS_OWNER_USER_ID=
ADS_CONVERSION_SECRET=
```

Server-to-server conversion example:

```http
POST /api/ads/conversion
Content-Type: application/json
x-mansa-conversion-secret: <ADS_CONVERSION_SECRET>

{
  "eventType": "LEAD",
  "campaignExternalId": "123456789",
  "platform": "META",
  "email": "customer@example.com",
  "name": "Customer name",
  "externalEventId": "lead-unique-id",
  "metadata": {
    "utm_source": "facebook",
    "utm_medium": "paid_social"
  }
}
```

`LEAD` events are also inserted into the existing Mansa Musa CRM. `PURCHASE` events update attributed campaign revenue and ROAS.

### Optional Supabase mirror

The core application remains on its existing Prisma/PostgreSQL data layer. Supabase is an optional analytics/warehouse mirror rather than a second source of truth.

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

Create these tables in Supabase if the mirror is enabled:

```sql
create table if not exists mansa_ad_campaigns (
  user_id text not null,
  platform text not null,
  external_id text not null,
  name text not null,
  status text,
  spend_cents bigint default 0,
  revenue_cents bigint default 0,
  impressions bigint default 0,
  clicks bigint default 0,
  conversions double precision default 0,
  ctr double precision default 0,
  cpa_cents bigint default 0,
  roas double precision default 0,
  daily_budget_cents bigint default 0,
  synced_at timestamptz default now(),
  primary key (user_id, platform, external_id)
);

create table if not exists mansa_ad_attribution_events (
  id text primary key,
  user_id text not null,
  event_type text not null,
  campaign_external_id text,
  platform text,
  amount_cents bigint default 0,
  currency text default 'GBP',
  email text,
  external_event_id text,
  metadata jsonb,
  created_at timestamptz default now()
);
```

Keep the Supabase service-role key server-side only.

## AI creative generation

`POST /api/ads/creative` accepts brand, offer, optional audience and platform. It uses `OPENAI_API_KEY` when configured, with `ADS_CREATIVE_MODEL` available as an optional model override. If OpenAI is unavailable, the deterministic Growth Agent creative generator is used instead.

Example:

```json
{
  "brand": "Mansa Musa AI",
  "offer": "AI operating system for growing businesses",
  "audience": "UK small business owners",
  "platform": "META"
}
```

## Operating workflow

1. Open `/paid-ads`.
2. Press **Sync Meta + Google + TikTok + Stripe**.
3. The platform stores cross-channel performance snapshots.
4. Press **Run Growth Agent**.
5. The optimizer records SCALE / REDUCE / HOLD / REFRESH CREATIVE recommendations.
6. Any recommendation that changes spend creates an existing `ApprovalRequest` record.
7. The user chooses **Reject** or **Approve & execute**.
8. Only after explicit approval does `/api/ads/actions` send a budget mutation to the ad platform.
9. The result is retained in the decision/audit record.

## Safety controls

- Provider access tokens are server-only environment variables.
- Live spend changes require explicit approval.
- Budget adjustments are percentage-based against the last synced provider budget.
- If the provider does not supply a writable budget resource or current budget, execution is refused rather than guessed.
- Stripe events are de-duplicated.
- Website conversion events can be protected with `ADS_CONVERSION_SECRET`.
- Supabase is optional; PostgreSQL/Prisma remains the application source of truth.

## Production automation

Once provider credentials are confirmed, call `POST /api/ads/sync` from the existing scheduler/cron infrastructure on an appropriate cadence (for example hourly). Analysis can also be scheduled, but live spend execution should remain approval-gated unless a later policy explicitly defines narrow, capped autonomous changes.
