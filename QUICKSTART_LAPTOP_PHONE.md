# Quickstart — run it on your laptop, then your phone

Two tracks. **Track 1** gets it running on your laptop in ~10 minutes with no accounts at
all (demo data, so you can see it work). **Track 2** puts it online so it lives on your phone.

---

## TRACK 1 — See it on your laptop (≈10 min, no sign-ups)

### Step 0 — Get the project folder onto your laptop
Download the `mansa-musa-aios` folder (from this chat's files) to somewhere easy like your
Desktop. You should see folders inside it called `backend`, `dashboard`, `site`, `db`.

### Step 1 — Install Python (skip if you have it)
- **Mac:** open **Terminal** (Cmd+Space, type "Terminal"). Type `python3 --version`.
  If it shows 3.11+ you're set. If not, install from python.org.
- **Windows:** install from python.org → **tick "Add Python to PATH"** during setup.
  Open **PowerShell** (Start menu → type "PowerShell").

### Step 2 — Open a terminal in the project folder
- **Mac:** in Terminal type `cd ` (with a space), drag the `mansa-musa-aios` folder onto the
  window, press Enter.
- **Windows:** in the folder in File Explorer, click the address bar, type `powershell`, Enter.

### Step 3 — Install and run
Copy–paste these one at a time:

**Mac:**
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --port 8000
```
**Windows (PowerShell):**
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --port 8000
```
When you see "Uvicorn running on http://127.0.0.1:8000" the brain is live. **Leave this window open.**

### Step 4 — Open the dashboard
Double-click `dashboard/index.html` (it opens in your browser). It auto-connects to the
server you just started. You'll see KPIs and tabs. Click a time slot (e.g. **15:00**) to run
the agents. (Text will say "[STUB]" until you add an OpenAI key — that's expected; the system
is fully working, just without the AI wording yet.)

### Step 5 (optional) — Add the AI brain + your data
1. Copy `.env.example` to `.env`. Open `.env`, paste your `OPENAI_API_KEY` (from platform.openai.com).
2. Stop the server (Ctrl+C) and re-run Step 3's last line. Agent text is now real.
3. To use your real menu/sales, edit the CSVs in `data/templates/` and run:
   `python scripts/import_data.py data/templates`

✅ That's the full system on your laptop.

---

## TRACK 2 — Put it online and on your iPhone (≈60 min)

Track 1 only runs while your laptop is on. To use it from your phone anywhere, it needs to
live online. Full click-by-click is in **`LAUNCH.md`**; the short version:

1. **GitHub** — put the folder on GitHub (GitHub Desktop → Add → Publish).
2. **Supabase** — new project → SQL Editor → paste & run `db/schema.sql` → copy the URL + service key.
3. **Render** — New → Blueprint → pick the repo → paste `OPENAI_API_KEY`, `SUPABASE_URL`,
   `SUPABASE_SERVICE_KEY`. Deploy. You get an API URL; check `…/health`.
4. **Vercel** — import the repo twice: once with root `dashboard`, once with root `site`. Deploy.
5. **iPhone** — open the **dashboard** Vercel link in **Safari** → **Share → Add to Home Screen → Add**.
   The gold crown icon appears; open it for full-screen control from anywhere.
6. **Domain (optional now)** — point `mansamusainitiative.co.uk` per `DNS_mansamusainitiative.md`.

✅ Now it's on your phone and runs 24/7 without your laptop.

---

## Which do I do first?
Do **Track 1 today** — it proves everything works on your screen in 10 minutes and costs nothing.
Do **Track 2** when you're ready to use it for real and have it on your phone.

## Common hiccups
- **"python not found" (Windows):** you missed "Add to PATH" — re-run the installer and tick it.
- **"uvicorn not found":** the virtual environment isn't active — re-run the `activate` line (Step 3).
- **Dashboard says "API offline":** the Step 3 window was closed — start it again and refresh.
- **Phone install option missing:** you must use **Safari**, and the page must be the **online**
  (https) Vercel link, not the laptop one.
