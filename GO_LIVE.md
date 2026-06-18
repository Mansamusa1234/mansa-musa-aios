# Go Live — Mansa Musa AI OS Runbook

Work top to bottom. Each step says **what to do**, **where**, and **which `.env`
variable it fills**. You can deploy after STAGE 3; the platform links (STAGE 4) can
be added one at a time afterwards — nothing breaks while a connection is empty
(that agent just stays in DRAFT).

Legend:  ⏱ time · 🔑 produces a key · ✅ checkpoint

---

## STAGE 0 — Get the code on your laptop ⏱5 min
1. Put the `mansa-musa-aios/` folder somewhere permanent.
2. Create a **GitHub repo** (you already use GitHub: Mansamusa1234) and push it —
   needed for the Render deploy in Stage 3B.
   ```bash
   cd mansa-musa-aios
   git init && git add . && git commit -m "Mansa Musa AI OS"
   git branch -M main
   git remote add origin https://github.com/Mansamusa1234/mansa-musa-aios.git
   git push -u origin main
   ```
✅ Repo visible on GitHub.

---

## STAGE 1 — The two things it can't run without ⏱15 min

### 1A. The agent brain (OpenAI **or** Anthropic) 🔑
- Go to **platform.openai.com → API keys → Create**. Add billing ($5-10 is plenty to start).
- `.env`: `OPENAI_API_KEY=sk-...`  (keep `LLM_PROVIDER=openai`, `LLM_MODEL=gpt-4o-mini`)
- *(Alternative: Anthropic console → `ANTHROPIC_API_KEY`, set `LLM_PROVIDER=anthropic`.)*

### 1B. The database (Supabase) 🔑
- **supabase.com → New project**. Wait for it to provision.
- **Project Settings → API**: copy the **Project URL** and the **service_role** key.
- `.env`: `SUPABASE_URL=https://xxxx.supabase.co` and `SUPABASE_SERVICE_KEY=...`
- **SQL Editor → New query →** paste all of `db/schema.sql` → **Run**. This creates
  every table and seeds your restaurant row.
✅ Tables visible under **Table Editor**.

> Without 1A the agents emit a clearly-marked STUB; without 1B data is kept in memory
> only (lost on restart). Both together = real, persistent system.

---

## STAGE 2 — Run it locally & prove it works ⏱10 min
```bash
cp .env.example .env          # then paste in the keys from Stage 1
pip install -r requirements.txt
make test                     # 9 smoke tests should pass
make run                      # API on http://localhost:8000
```
- Open `dashboard/index.html` in your browser. You should see KPI cards and tabs.
- In a 2nd terminal: `make slot S=15:00` → Revenue + Menu agents produce real briefings.
✅ Dashboard loads, a slot run returns text. **You now have a working system.**

---

## STAGE 3 — Deploy so it runs 24/7 without your laptop ⏱20 min

### Option 3A — Your own server / VPS (simplest if you have one)
```bash
cp .env.example .env   # with your keys
make up                # Docker: API on :8000 + scheduler running the daily clock
```

### Option 3B — Render (managed, recommended) 🔑
1. **render.com → New + → Blueprint →** select your GitHub repo. It reads `render.yaml`
   and creates: **web** (API), **worker** (scheduler), **cron** (nightly closing report).
2. When prompted, paste the secret env vars (`OPENAI_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`, later `STRIPE_RESTRICTED_KEY`). Leave `ALLOW_AUTO_PUBLISH=false`.
3. Deploy. Render gives you a public API URL like `https://mansa-musa-api.onrender.com`.
4. In `dashboard/index.html`, change the `const API = "http://localhost:8000"` line to
   your Render URL, then host the dashboard on **Vercel** (drag-drop the `dashboard`
   folder) or just keep opening it locally.
✅ Visit `https://<your-api>/health` → `{"status":"healthy"}`.

---

## STAGE 4 — Link the platforms (add any time, one at a time) ⏱varies

Each link below makes one cluster of agents go from DRAFT to live. Do them in whatever
order matters most to you. Approvals (Meta, TikTok) take days — **start those first**.

| # | Link | Where | Fills `.env` | Unlocks |
|---|------|-------|--------------|---------|
| 1 | **Stripe** (read-only) ⏱10m | dashboard.stripe.com → Developers → API keys → **Restricted key** (charges: read) | `STRIPE_RESTRICTED_KEY` | Real revenue in Finance/Revenue agents |
| 2 | **Facebook Page + Instagram** ⏱1-3 days* | developers.facebook.com → create Business app → add Page + IG Business → permissions `pages_manage_posts`, `pages_read_engagement`, `instagram_basic`, `instagram_content_publish` → long-lived Page token | `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN`, `META_IG_BUSINESS_ID` | FB + IG auto-posting |
| 3 | **WhatsApp** ⏱1-2 days | same Meta app → add WhatsApp → phone number id + token | `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TOKEN` | Booking confirmations, opt-in broadcasts |
| 4 | **Google Business Profile** ⏱30m | Google Cloud → enable Business Profile APIs → OAuth for the account that owns the listing | `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_LOCATION_ID`, `GOOGLE_OAUTH_TOKEN` | Google posts + review replies |
| 5 | **TikTok** ⏱1-7 days* | developers.tiktok.com → Content Posting API (`video.publish`) | `TIKTOK_ACCESS_TOKEN` | TikTok video posting (keep `TIKTOK_PRIVACY=SELF_ONLY` until audited) |
| 6 | **Tripadvisor** ⏱varies | tripadvisor.com/developers → Content API key | `TRIPADVISOR_API_KEY`, `TRIPADVISOR_LOCATION_ID` | Review monitoring (replies drafted for you) |
| 7 | **Email** ⏱20m | resend.com → API key → verify your domain | `RESEND_API_KEY`, `EMAIL_FROM` | Email campaigns, win-back, birthdays |
| 8 | **SMS** ⏱20m | twilio.com → SID + token + a number | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | SMS reminders, "table ready" |

\* These need Meta/TikTok **App Review** before non-admins can post. You can test as
the app admin immediately; public/automated posting waits for approval.

After adding keys, redeploy (Render auto-redeploys on env change; Docker: `make down && make up`).
Re-run `GET /health` — it reports which integrations are now wired.

---

## STAGE 5 — Switch from drafts to autopilot (only when ready)
1. Run for a few days with `ALLOW_AUTO_PUBLISH=false` and review drafts in the
   **AI Command** tab.
2. When you trust a channel, in `config/agents.yaml` set that agent's
   `auto_publish: true`, and set `ALLOW_AUTO_PUBLISH=true` in `.env`.
3. Money / hiring / supplier / contract agents stay `requires_approval: true` — leave them.

---

## The minimum to be "live" today
**OpenAI key + Supabase + run schema + deploy (Stage 1-3).** That alone gives you the
analytics engine, dashboard, daily briefings, and draft generation for every channel.
Add Stripe (link #1) next for real money numbers. Everything else is incremental.

## What only YOU can do (I can't, and no tool should)
- Authorise OAuth for **your** Facebook/Instagram/Google/TikTok/WhatsApp accounts.
- Add billing to OpenAI/Stripe/Twilio.
- Verify your sending domain for email.
These are deliberate ownership/consent gates — they're what keep your accounts safe
and un-bannable.
