# Pull Request Status

> Audited: 2026-10-13

---

## Summary

| PR | Title | Classification | Priority | Action |
|---|---|---|---|---|
| #34 | Guard X + HeyGen cron failures | SAFE TO MERGE | P1 | Merge — small defensive guard, clean diff |
| #32 | Repair Stripe payment fulfillment | NEEDS REPAIR → MERGE | P0 | Undraft, review Stripe v23 upgrade, merge to main |
| #33 | Free plan Playwright browser smoke | SAFE TO MERGE | P1 | Merge — adds test coverage |
| #29 | Abacus Market Gap Intelligence | NEEDS REPAIR | P2 | Review Abacus API key requirements before merge |
| #28 | Super Orchestrator | NEEDS REPAIR | P1 | Review — depends on Abacus/agent infra |
| #27 | Proton Mail Bridge | NEEDS REPAIR | P2 | Security review required before enabling |
| #25 | AI Marketing Team + Abacus worker | NEEDS REPAIR | P1 | Abacus keys required; review agent prompts |
| #24 | SketricGen Brand Agent | NEEDS REPAIR | P2 | Security review of SketricGen integration |
| #23 | AI Council (ChatGPT/Grok/Claude/Gemini) | SAFE TO MERGE | P1 | Review API key gating; merge after verifying env vars |
| #18 | Paid Ads Growth Agent | NEEDS REPAIR | P2 | Review ad spend controls before any merge |

---

## Detail

### PR #34 — SAFE TO MERGE (P1)
**Guard failing X and HeyGen cron publishing**
- 8 additions, 3 deletions, 1 file changed
- Adds `SOCIAL_X_ENABLED` and `SOCIAL_HEYGEN_ENABLED` env flags defaulting to skip
- Prevents log-spam from known-broken providers
- No functional regression risk
- Re-enable flags once credentials/credits restored

### PR #32 — P0 PRIORITY (DRAFT → needs undraft)
**Repair Stripe payment fulfillment and paid receptionist access**
- 266 additions, 62 deletions, 21 files changed
- Fixes modern Stripe payload handling, delayed payment success, customer ownership check
- Upgrades Stripe SDK to 23.0.0 (API 2026-09-30.endive)
- 32 repair tests passed
- **Blocker noted:** 62 Supabase tables without RLS — not included in this PR
- Preview URL confirmed working at Vercel
- **Next step:** Undraft → final review → merge

### PR #33 — SAFE TO MERGE (P1)
**Free plan Playwright smoke tests**
- Adds browser E2E coverage for free plan signup flow
- No production code change

### PR #29 — P2 (Abacus)
**Market Gap Intelligence**
- Requires ABACUS_API_KEY configured in production
- Contains agent prompts and research pipeline
- Review prompt content and cost implications before merge

### PR #28 — P1 review needed
**Super Orchestrator control plane**
- Centralises agent routing
- Depends on agent infrastructure being stable
- Requires thorough review before production use

### PR #27 — P2 (security review needed)
**Proton Mail Bridge**
- Local bridge connector for Proton Mail
- Must be security-reviewed: local bridge exposes email credentials
- Do not merge until security audit complete

### PR #25 — P1 (pending Abacus)
**AI Marketing Team + Abacus worker**
- Requires Abacus API connectivity
- Review agent prompts for content quality
- Review approval queue wiring before merge

### PR #24 — P2 (security review)
**SketricGen Brand Agent**
- Third-party integration
- Security review required
- Verify SketricGen's data handling before enabling

### PR #23 — SAFE TO MERGE (P1)
**AI Council — ChatGPT, Grok, Claude, Gemini**
- Multi-provider AI routing
- Verify all four API keys are gated behind env var checks (fallback to available models)
- Review cost routing logic

### PR #18 — P2 (do not merge without controls)
**Paid Ads Growth Agent**
- Involves ad spend automation
- Must have human approval gate for any real ad spend
- Do not auto-approve ad campaigns
