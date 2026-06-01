# 👑 START HERE — Mansa Musa AI OS

Welcome. This one folder is your whole system: the website, the phone app, and the AI that
runs the back office. Follow this page top to bottom.

---

## First, the question everyone asks: laptop or GitHub?

**Put this folder on your LAPTOP first.** 💻

- **Laptop = where you run and test it now.** Do this today (10 minutes, no accounts).
- **GitHub = storage you push to LATER**, only when you want it online and on your phone.
- You do **not** run anything "on GitHub". The order is:
  **laptop → see it work → (later) GitHub → online → iPhone.**

So: save this folder somewhere easy like your **Desktop**. That's it for now.

---

## Run it on your laptop (10 minutes, no sign-ups)

1. **Open a terminal in this folder**
   - Mac: open **Terminal**, type `cd ` (with a space), drag this folder onto the window, press Enter.
   - Windows: in this folder, click the File Explorer address bar, type `powershell`, press Enter.

2. **Install and start** (copy one line at a time):

   **Mac**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   uvicorn backend.main:app --port 8000
   ```
   **Windows**
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   uvicorn backend.main:app --port 8000
   ```
   Leave that window open once it says **"Uvicorn running"**.

3. **Open the dashboard:** double-click `dashboard/index.html`. Click a time slot (e.g. **15:00**)
   to run the AI agents. 🎉 You're looking at your restaurant OS.

> Text shows "[STUB]" until you add an OpenAI key — everything else is fully working. To get
> real AI wording: copy `.env.example` to `.env`, paste your `OPENAI_API_KEY`, restart step 2's last line.

---

## When you're ready to go online + on your iPhone
Open **`QUICKSTART_LAPTOP_PHONE.md`** (Track 2) or the detailed **`LAUNCH.md`**. Short version:
GitHub → Supabase → Render → Vercel → on iPhone, open the dashboard link in **Safari** →
**Share → Add to Home Screen**.

---

## What each file/folder is
| Item | What it is |
|------|-----------|
| `START_HERE.md` | This page |
| `QUICKSTART_LAPTOP_PHONE.md` | Laptop + phone quickstart (both tracks) |
| `LAUNCH.md` | Full click-by-click go-live runbook |
| `dashboard/` | Your control app (installs on your phone) |
| `site/` | Your public customer website |
| `backend/` | The AI engine (99 agents, analytics, connectors) |
| `db/schema.sql` | The database setup (run in Supabase) |
| `data/templates/` | CSVs to load your real menu, sales, customers |
| `IPHONE_APP.md` | How to add it to your iPhone home screen |
| `DNS_mansamusainitiative.md` | Pointing your GoDaddy domains |
| `PHASE2_CONNECTIONS.md` | Connecting Facebook, Google, WhatsApp, Stripe, etc. |
| `AUTOMATION.md` | Turning on automatic replies |
| `MARKET_RESEARCH.md` / `RESELL.md` | Competitor research + how to resell it |

Questions while you go? Just ask. Enjoy. 👑
