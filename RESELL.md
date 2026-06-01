# Reseller playbook — sell Mansa Musa AI OS to other companies

The system is **white-label and multi-tenant by configuration**. The code never changes per
client — you change environment variables and deploy a separate, isolated instance. This is
what lets you turn one build into a recurring-revenue product.

---

## The model
- **One instance per client.** Each restaurant gets its own Render deployment + its own
  Supabase project + its own API/website domains. Clean isolation, separate data, separate billing.
- **Their accounts, not yours.** Each client connects *their* OpenAI/Stripe/Meta/Google keys.
  You never share credentials, and they can revoke any time. Safer for them, lower liability for you.
- **Branding by env.** `BRAND_NAME`, `BRAND_TAGLINE`, `BRAND_ACCENT`, `BRAND_DOMAIN`,
  `BRAND_POWERED_BY` drive the dashboard + site. The dashboard reads `GET /brand` and restyles
  itself — your client sees *their* name and colour.

## Onboard a new client in ~30 minutes
1. Copy `config/clients/CLIENT_TEMPLATE.env` → `config/clients/<client>.env` and fill in their
   brand, restaurant details, and keys.
2. Create a new Supabase project for them → run `db/schema.sql`.
3. Deploy a new Render blueprint from the repo → paste their env vars.
4. Point their domain (or a `client.youragency.com` subdomain) at the new instance — see
   `DNS_mansamusainitiative.md` for the record pattern.
5. Hand them the iPhone install steps (`IPHONE_APP.md`) and walk them through the dashboard.
6. Keep `ALLOW_AUTO_PUBLISH` and `AUTO_REPLY_ENABLED` off until they trust the drafts.

### Automated onboarding (two commands)
```bash
# 1. Generate the client's branded env
python scripts/onboard_client.py --name "Acme Bistro" --domain acmebistro.co.uk --cuisine Italian --city Manchester

# 2. Create their Supabase project (+ schema) and Render services, wired with their env
python scripts/provision_client.py config/clients/acme-bistro-os.env --yes
```
Step 2 calls the **Supabase Management API** and **Render API** for real when your provisioning
tokens are set (`SUPABASE_ACCESS_TOKEN`, `SUPABASE_ORG_ID`, `RENDER_API_KEY`, `RENDER_OWNER_ID`,
`GITHUB_REPO`). Without them it runs a safe **dry-run** that prints the exact plan. You still set
DNS and deploy the `site/`+`dashboard/` folders to Vercel (steps 4–5 below).

## What to charge (illustrative — set your own)
| Plan | Monthly | Who it's for |
|------|---------|--------------|
| Starter | £149 | One venue, marketing + reviews + bookings, draft mode |
| Pro | £399 | Full 99-agent system, analytics, autonomous replies/posts |
| White-label partner | revenue-share or licence | Agencies reselling under their own brand |

Your costs per client are mainly their LLM usage (they pay OpenAI directly if you use their key)
plus your Render/Supabase hosting (~low tens of £/mo on starter tiers). Healthy margin at these prices.

## Your sales asset
`marketing/index.html` is a finished, animated product landing page. Deploy it to its own
domain (e.g. `getmansamusa.com` or your agency domain) and send prospects there. The
**Book a demo** button currently emails `bookings@mansa-musa.co.uk` — change that to your
sales inbox before you publish.

## Positioning that sells (honest claims only)
- "An AI back-office team for your restaurant — marketing, reviews, bookings, finance, stock."
- "Handles the repetitive 70–90% of digital work; you keep control of money and people."
- "Built on official platform APIs — safe, compliant, nothing that gets accounts banned."
- "Live in a day. Installs on the owner's phone."

## What NOT to promise
- Not "fully autonomous, no humans" — complaints, refunds, suppliers and bad reviews are
  human-approved by design, and that's a selling point (it's safe), not a limitation to hide.
- Not "takes over your social accounts" — it posts through official APIs the client authorises.
- Don't quote uptime/revenue guarantees you can't back. Sell the leverage, not magic.

## Compliance checklist before you resell
- [ ] A simple reseller/licence agreement and per-client terms.
- [ ] GDPR: each client is data controller of their own Supabase; you're a processor — note it.
- [ ] Make clear LLM outputs are drafts to review; the client is responsible for what they publish.
- [ ] Each client uses their own platform developer accounts and accepts those platforms' terms.
