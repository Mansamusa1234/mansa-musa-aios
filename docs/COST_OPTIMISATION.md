# Cost Optimisation

> Updated: 2026-10-13
> Never expose secrets or account credentials in this file.

---

## Provider Cost Tracking

| Provider | Current Cost | Included/Free Usage | Available Legitimate Credit | Estimated Saving | Action Required |
|---|---|---|---|---|---|
| Anthropic | Pay per token | $5 free on signup | Check anthropic.com/startups program | TBD | Apply for startup credits if eligible |
| OpenRouter | Pay per token | Free tier available | Various model free tiers | Route cheap tasks to free/cheap models | Implement model routing by task complexity |
| xAI / Grok | Pay per token | Free tier on API | Check xai.com for startup program | TBD | Gate usage to AI Council only |
| Google Gemini | Pay per token | Generous free tier (Gemini Flash) | Google Startup program | Use Gemini Flash for lightweight tasks | Route summarisation/classification to Gemini Flash |
| Vercel | Pay per bandwidth | Hobby: 100GB/mo; Pro: more | GitHub Student/Startup programs | TBD | Review bandwidth usage in Vercel dashboard |
| Supabase | Pay per row/storage | Free: 500MB DB, 1GB storage | Supabase Launch Week promotions | TBD | Monitor DB size; archive old audit logs |
| Stripe | % of revenue | n/a (revenue share) | None | n/a | Ensure webhook retries are not double-charging |
| HeyGen | Pay per video minute | None currently (credits depleted) | Check heygen.com promotions | Restore free credits via referrals | Recharge account or find promo code |
| Resend | Pay per email | 3,000 emails/month free | GitHub Student Pack sometimes includes Resend | Save ~$20/mo | Stay on free tier while under 3k/mo |

---

## Token Efficiency Rules

1. **Route by complexity** — use `claude-haiku-4-5` (or Gemini Flash) for classification, summarisation, short responses. Use `claude-sonnet` for complex reasoning. Reserve `claude-opus` for strategic/creative tasks only.
2. **Cache system prompts** — Anthropic prompt caching saves up to 90% on repeated long system prompts. Enabled in `src/lib/anthropic.ts` via `cache_control` blocks.
3. **Do not broadcast to all models** — AI Council should route to ONE best model per task type, not query all four simultaneously.
4. **Conversation history truncation** — Chat route already limits history to last N messages. Verify this cap is active.
5. **Batch database reads** — Already implemented in chat route (parallel Promise.all). Maintain this pattern.
6. **Avoid redundant API calls** — Rate limiters in place. Do not bypass them.

---

## Infrastructure Savings

| Item | Current State | Recommendation |
|---|---|---|
| npm dependencies | 14 vulnerabilities | Run `npm audit fix` (non-breaking) — reduces attack surface without cost impact |
| Docker images | Present but not production (Vercel used) | Remove docker-compose from production build pipeline if not used |
| Unused services | Render, ngrok tunnels | Verify and shut down any idle paid services |

---

## Legitimate Credit Sources to Investigate

- **GitHub for Startups** — free GitHub Team + partner credits (Stripe, Vercel, etc.)
- **Anthropic for Startups** — potential API credits for qualifying startups
- **Google for Startups** — Google Cloud credits including Gemini API
- **Vercel Startup Program** — billing credits for early-stage companies
- **Supabase Launch Week / Startup Program** — hosting credits
- **Stripe Atlas / Partner credits** — Stripe fee reductions for certain business structures
- **AWS Activate / Azure for Startups** — hosting credits if cloud migration considered

**Rule: Never create fake accounts, abuse trials, or bypass billing systems to obtain credits.**
