# Mansa Musa AI OS (RAIOS)

A Restaurant AI Operating System for **Mansa Musa Kitchen & Lounge**.

It coordinates Marketing, Operations, Finance, and Customer departments through a single
**Orchestrator** and a registry of up to **99 specialised agents** organised in 10 layers.
It runs on your laptop (or Render) and connects to the platforms you already use.

---

## What this is (and what it is NOT)

**It IS:** a coordinator that drafts content, schedules posts, analyses sales/reviews,
generates campaigns, writes reports, and proposes actions — logging everything to Supabase
so you keep an audit trail and an approval step.

**It is NOT:** a way to "take over" social accounts. Facebook, Instagram, TikTok, Google
Business Profile, Tripadvisor and Stripe all require **official APIs** and **OAuth tokens
that only you can authorise**. Scraping or password-sharing gets accounts banned. So the AI
**drafts → you approve (or auto-approve low-risk) → it posts through the official API**.

A realistic target: the system handles **70–90% of repetitive digital work** (content,
reports, review replies, analysis, scheduling suggestions) while **humans keep control** of
money, hiring, supplier contracts, and sensitive customer decisions.

---

## Architecture

```
                         CEO Dashboard  (dashboard/index.html)
                                  |
                           Orchestrator  (backend/orchestrator.py)
                                  |
   +--------------+--------------+--------------+--------------+
   | Operations   | Marketing    | Finance      | Customers    |
   | Team         | Team         | Team         | Team         |
   +--------------+--------------+--------------+--------------+
                                  |
                            Supabase (Postgres + vector memory + logs)
                                  |
   Facebook | Instagram | TikTok | Google Business | Tripadvisor | Stripe | Email
   (all via OFFICIAL developer APIs + your OAuth tokens)
```

- **config/agents.yaml** — all 99 agents across 10 layers (the org chart, in data).
- **backend/** — FastAPI app, orchestrator, base agent runtime, four worked example agents.
- **db/schema.sql** — the Supabase tables (restaurants, customers, tasks, agent_logs, ...).
- **scheduler/daily_workflow.py** — the 06:00 / 09:00 / 12:00 / 15:00 / 21:00 routine.
- **dashboard/index.html** — single-file executive dashboard.

---

## Setup (about 20 minutes)

### 1. Prerequisites
- Python 3.11+ (the repo uses `uv` if you have it: `uv run`).
- A free Supabase project.
- An OpenAI **or** Anthropic API key (for the agent brains).

### 2. Install
```bash
cd mansa-musa-aios
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Database
In the Supabase dashboard → SQL Editor, paste and run `db/schema.sql`.

### 4. Configure
```bash
cp .env.example .env
# open .env and fill in the keys you have. Leave the rest blank for now.
```

### 5. Run
```bash
# Start the API + orchestrator
uvicorn backend.main:app --reload --port 8000

# In a second terminal, run the daily workflow once to test:
python scheduler/daily_workflow.py --run-now morning_briefing
```

Open `dashboard/index.html` in your browser (it talks to `http://localhost:8000`).

---

## Connecting the platforms (Phase 2)

Each connection is just an API token you paste into `.env`. Start the official app review
early — Meta and TikTok approvals take days.

| Platform            | Where to get access                          | Scope you need                         |
|---------------------|----------------------------------------------|----------------------------------------|
| Facebook Page       | developers.facebook.com (Meta for Developers)| `pages_manage_posts`, `pages_read_engagement` |
| Instagram Business  | same Meta app (linked to the Page)           | `instagram_basic`, `instagram_content_publish` |
| TikTok              | developers.tiktok.com                        | Content Posting API                    |
| Google Business     | Google Business Profile API                  | account + location management          |
| Tripadvisor         | Tripadvisor Content API (partner)            | review read access                     |
| Stripe              | dashboard.stripe.com → Developers            | restricted read key for reporting      |
| Email / SMS         | your provider (e.g. Resend / Twilio)         | send                                   |

Until a connection is filled in, that agent runs in **DRAFT mode**: it produces the post/
reply/report and stores it as a task for you to approve — nothing goes live.

---

## Deploy to production

The image runs the API; a second process runs the scheduler. Three ways to ship:

### A) Docker Compose (your own server / VPS)
```bash
cp .env.example .env   # fill in keys
make up                # builds image, starts API (:8000) + scheduler
```

### B) Render (managed, one-click)
Push this repo to GitHub, then in Render: **New + → Blueprint →** pick the repo.
`render.yaml` provisions a **web service** (API, health-checked at `/health`), a
**worker** (scheduler), and a **nightly cron** (closing report). Paste your secret
env vars when prompted.

### C) Any Procfile host (Railway, Fly, Heroku-style)
`Procfile` defines `web` and `worker`. Point the platform at it and set env vars.

**Before go-live:** run `make test` (9 smoke tests), apply `db/schema.sql` to Supabase,
and keep `ALLOW_AUTO_PUBLISH=false` until you've reviewed a few days of drafts.

## What runs on real data
`backend/datasource.py` reads Supabase (orders, inventory, customers, shifts, covers
history) and pulls **live revenue from Stripe** (restricted key). Every getter falls
back to representative demo data when a table is empty, so the system is useful on
day one and switches to live numbers automatically as you populate it.

## Roadmap status
- **Phase 1 — done:** Supabase + orchestrator + worked agents + dashboard + daily workflow.
- **Phase 2 — done:** Facebook, Instagram, TikTok, Google Business, WhatsApp connectors.
- **Phase 3 — done:** real-data layer (Supabase + Stripe), Email/SMS/Tripadvisor connectors,
  competitor/trend/events agents, deterministic analytics engine, deployment packaging.
  **19 of 99 agents active**; the rest share the same runtime — enable them in
  `config/agents.yaml` as you grow.

---

## Safety defaults
- Every agent action is written to `agent_logs` (full audit trail).
- Anything touching money, contracts, or hiring is `requires_approval: true` and never auto-runs.
- Social posting defaults to DRAFT until you explicitly set an agent to `auto_publish: true`.
