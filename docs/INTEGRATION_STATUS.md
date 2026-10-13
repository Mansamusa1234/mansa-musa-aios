# Integration Status

> Audited: 2026-10-13
> Never expose secrets in this file. Status only.

---

## Core Infrastructure

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| GitHub | Source control, CI | Mansamusa1234 | YES | YES | YES | Free tier | None |
| Vercel | Hosting / deployment | mansamusa1234 (project: mansa-musa-aios) | YES | YES | YES (preview confirmed) | Pay per use | Verify prod env vars set |
| Supabase | PostgreSQL database | mansamusainitiative.com | YES | YES | UNKNOWN (no live test) | Free/Pro tier | Verify RLS policies — 62 public tables flagged without RLS |
| Prisma | ORM | embedded | YES | n/a | YES (schema complete) | Free | None |

---

## Payment

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| Stripe | Subscriptions, billing | mansamusainitiative | YES | YES | PARTIAL | % of revenue | Verify live price IDs in Vercel match Stripe dashboard |

---

## AI Providers

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| Anthropic | Primary AI (Claude) | via API key | YES | CONFIGURED | UNKNOWN live | Pay per token | Set ANTHROPIC_API_KEY in Vercel production |
| OpenRouter | Multi-model routing | via API key | CONFIGURED | CONFIGURED | UNKNOWN live | Pay per token | Set OPENROUTER_API_KEY in Vercel |
| xAI / Grok | AI Council member | via API key | CONFIGURED | CONFIGURED | UNKNOWN live | Pay per token | Set XAI_API_KEY in Vercel |
| Google Gemini | AI Council member | via API key | CONFIGURED | CONFIGURED | UNKNOWN live | Pay per token | Set GEMINI_API_KEY in Vercel |
| HeyGen | Video generation | via API key | CONFIGURED | BROKEN | BROKEN (HTTP 402) | Pay per video | Recharge HeyGen credits; set HEYGEN_API_KEY; re-enable SOCIAL_HEYGEN_ENABLED=true |
| Abacus | Market research, agents | via API key | NOT CONNECTED | NOT CONNECTED | UNKNOWN | TBD | Complete Abacus integration — see PRs #25, #29 |

---

## Email

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| Resend | Transactional email | ai@mansamusainitiative.com | CONFIGURED | CONFIGURED | UNKNOWN live | ~3000/mo free | Verify RESEND_API_KEY in Vercel; verify sender domain |

---

## Social / Publishing

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| Instagram | Content publishing | mansamusainitiative | CONFIGURED | BROKEN | BROKEN (token expired) | Free (organic) | Refresh Instagram access token; update INSTAGRAM_ACCESS_TOKEN in Vercel |
| Pinterest | Content publishing | mansamusainitiative | CONFIGURED | BROKEN | BROKEN (token expired) | Free | Refresh Pinterest token; update PINTEREST_ACCESS_TOKEN in Vercel |
| TikTok | Content publishing | mansamusainitiative | CONFIGURED | UNKNOWN | UNKNOWN | Free | Verify TIKTOK_ACCESS_TOKEN in Vercel |
| X (Twitter) | Content publishing | mansamusainitiative | CONFIGURED | BROKEN | BROKEN (HTTP 401) | Paid API tier | Fix X credentials or upgrade X API tier; enable SOCIAL_X_ENABLED=true when resolved |
| Facebook | Content publishing | mansamusainitiative | CONFIGURED | UNKNOWN | UNKNOWN | Free | Verify FACEBOOK_PAGE_ACCESS_TOKEN in Vercel |
| Threads | Content publishing | mansamusainitiative | CONFIGURED | UNKNOWN | UNKNOWN | Free | Verify THREADS_ACCESS_TOKEN in Vercel |
| LinkedIn | Content publishing | mansamusainitiative | NOT CONNECTED | NOT CONNECTED | NOT WORKING | Free | Complete LinkedIn OAuth; set LINKEDIN_ACCESS_TOKEN |
| Metricool | Social scheduling | mansamusainitiative | NOT CONNECTED | NOT CONNECTED | NOT WORKING | Paid | Connect Metricool API |

---

## Communication

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| WhatsApp | Customer messaging | via Meta API | CONFIGURED | UNKNOWN | UNKNOWN | Meta pricing | Verify WhatsApp token in Vercel |
| SMS (Twilio) | SMS notifications | via Twilio | CONFIGURED | UNKNOWN | UNKNOWN | Pay per SMS | Verify TWILIO_* keys in Vercel |

---

## Productivity / Ops

| Service | Purpose | Account/Workspace | Connected | Authenticated | Working | Cost | Action Required |
|---|---|---|---|---|---|---|---|
| Google OAuth | Login provider | via Google Cloud | CONFIGURED | CONFIGURED | UNKNOWN live | Free | Verify GOOGLE_CLIENT_ID/SECRET in Vercel |
| GitHub OAuth | Login provider | via GitHub Apps | CONFIGURED | CONFIGURED | UNKNOWN live | Free | Verify GITHUB_CLIENT_ID/SECRET in Vercel |
| Microsoft Entra | Login provider | via Azure | CONFIGURED | UNKNOWN | UNKNOWN | Free tier | Set MICROSOFT_CLIENT_ID/SECRET/TENANT_ID in Vercel |
| n8n | Workflow automation | local or hosted | NOT VERIFIED | NOT VERIFIED | UNKNOWN | Self-hosted/free | Verify n8n instance; connect to Mansa Musa AI webhooks |

---

## Security

| Item | Status | Action Required |
|---|---|---|
| Supabase RLS | CRITICAL — 62 tables without RLS policies | Design and apply row-level security policies for all multi-tenant tables. DO NOT apply without approval. |
| Secrets in repo | CLEAN — no secrets committed | Maintain |
| npm vulnerabilities | 11 HIGH, 3 MODERATE | Run `npm audit fix` — review breaking changes first |
| NEXTAUTH_SECRET | CONFIGURED | Verify in Vercel production |
| CRON_SECRET | CONFIGURED | Verify in Vercel cron job headers |
| Webhook signatures | WORKING | Stripe webhook signature verification confirmed in code |
