# LAUNCH — zero to live, step by step (no tech experience needed)

Follow these in order. Each step says exactly what to click. Tick them off. Total hands-on
time is about **90 minutes**, spread over a couple of days while approvals come through.
Don't skip the order — later steps need the earlier ones.

> Golden rule: keep the two safety switches OFF (`ALLOW_AUTO_PUBLISH=false`,
> `AUTO_REPLY_ENABLED=false`) until you've watched the system work for a few days.

---

## PART 1 — Create your accounts (≈20 min)
You'll need logins for these. All have free tiers to start.

- [ ] **GitHub** — github.com (you have this: Mansamusa1234). This stores the code.
- [ ] **OpenAI** — platform.openai.com → add ~£10 credit. This is the agents' brain.
- [ ] **Supabase** — supabase.com. This is the database.
- [ ] **Render** — render.com. This runs the system 24/7.
- [ ] **Vercel** — vercel.com. This hosts your website + the phone app.

Keep a notes file open. Every time a site gives you a **key** or **URL**, paste it there.

---

## PART 2 — Put the code on GitHub (≈10 min)
1. [ ] Install **GitHub Desktop** (desktop.github.com) — easiest, no command line.
2. [ ] Open it → File → **Add Local Repository** → choose the `mansa-musa-aios` folder.
3. [ ] Click **Publish repository** (keep it Private). Done — your code is on GitHub.

*(Comfortable in a terminal instead? `git init && git add . && git commit -m "launch" &&
git push` to a new repo.)*

---

## PART 3 — Set up the database (≈10 min)
1. [ ] In Supabase, click **New project**. Name it "mansa-musa". Wait ~2 min.
2. [ ] Left menu → **SQL Editor** → **New query**.
3. [ ] Open the file `db/schema.sql`, copy ALL of it, paste into the editor, click **Run**.
   You should see "Success". This builds every table.
4. [ ] Left menu → **Project Settings → API**. Copy two things to your notes:
   - **Project URL** (looks like `https://abcd.supabase.co`)
   - **service_role** secret key (click reveal)

---

## PART 4 — Deploy the system on Render (≈15 min)
1. [ ] In Render → **New + → Blueprint**.
2. [ ] Connect your GitHub and pick the **mansa-musa-aios** repo. Render reads `render.yaml`
   and sets up the API + the scheduler + a nightly report automatically.
3. [ ] When it asks for **Environment Variables**, paste from your notes:
   - `OPENAI_API_KEY` = your OpenAI key
   - `SUPABASE_URL` = your Project URL
   - `SUPABASE_SERVICE_KEY` = your service_role key
   - Leave `ALLOW_AUTO_PUBLISH` and `AUTO_REPLY_ENABLED` as **false**.
4. [ ] Click **Apply / Deploy**. Wait for it to go green.
5. [ ] Render gives you a URL like `https://mansa-musa-api.onrender.com`. Open
   `…/health` in your browser — it should say `"status":"healthy"`. ✅ The brain is live.

---

## PART 5 — Put the website + phone app online (Vercel) (≈15 min)
You'll deploy two folders: `site` (customer website) and `dashboard` (your control app).

1. [ ] In Vercel → **Add New → Project → Import** your GitHub repo.
2. [ ] For the website: set the **Root Directory** to `site`, framework **Other**, Deploy.
3. [ ] Repeat **Add New → Project**, same repo, **Root Directory** `dashboard`, Deploy.
4. [ ] Vercel gives each a URL. Test them — the dashboard should load and show data from your API.

---

## PART 6 — Point your domains (GoDaddy) (≈15 min + waiting)
Full record values are in **`DNS_mansamusainitiative.md`**. In short:
1. [ ] In Vercel → website project → Settings → **Domains** → add `mansamusainitiative.co.uk`
   and `www`. Add the dashboard domain too (e.g. `dashboard.mansamusainitiative.co.uk`).
2. [ ] In Render → API service → Settings → **Custom Domains** → add
   `api.mansamusainitiative.co.uk`.
3. [ ] In **GoDaddy → DNS** for `mansamusainitiative.co.uk`, add the records from the DNS sheet
   (an `A` record, a couple of `CNAME`s). Delete the default "Parked" record first.
4. [ ] Set the `.com` to **Forward (301)** to the `.co.uk` (GoDaddy → Forwarding).
5. [ ] Wait (minutes to a few hours). Then `https://mansamusainitiative.co.uk` shows your site
   and `https://api.mansamusainitiative.co.uk/health` is healthy. ✅

---

## PART 7 — Put the app on your iPhone (≈2 min)
1. [ ] On your iPhone, open the **dashboard** address in **Safari**.
2. [ ] Tap **Share → Add to Home Screen → Add**.
3. [ ] Open the gold crown icon — full-screen control of your business. ✅
*(Details in `IPHONE_APP.md`.)*

---

## PART 8 — Connect your platforms (over the next week, one at a time)
Each one makes more of the system live. Full how-to in `PHASE2_CONNECTIONS.md`. Order:
1. [ ] **Stripe** restricted key → real revenue numbers.
2. [ ] **Facebook + Instagram** (Meta app) → posting + comment replies. *(Start the approval early.)*
3. [ ] **Google Business** → review replies (use the `mansa1musas@gmail.com` account).
4. [ ] **WhatsApp / Email (Resend) / SMS (Twilio)** → customer messaging & campaigns.
5. [ ] **TikTok / Tripadvisor** → posting / review monitoring.
Add each key in Render → Environment → Save (it redeploys itself).

---

## PART 9 — Go autonomous (only when you're ready)
1. [ ] Run for a few days and read the agent **drafts** in the AI Command tab on your phone.
2. [ ] When happy, in Render set `AUTO_REPLY_ENABLED=true` (auto-replies to low-risk messages)
   and/or `ALLOW_AUTO_PUBLISH=true` (auto social posts).
3. [ ] Complaints, refunds, suppliers and bad reviews **always** wait for your approval — by design.

---

## If something doesn't work
- **Dashboard says "API offline":** your Render service is asleep (free tier) or the API URL
  is wrong. Open `…/health`; if it loads, refresh the dashboard.
- **Website not loading on the domain:** DNS hasn't propagated yet, or the GoDaddy "Parked"
  record is still there. Wait, or remove it.
- **Agents output `[STUB]`:** the OpenAI key isn't set in Render.
- **A platform reply says `blocked`:** that platform's key isn't added yet — harmless, it just
  drafts instead.

## You're live when…
- [ ] `api.<domain>/health` = healthy
- [ ] website loads on your domain, a test booking arrives in the dashboard
- [ ] the app is on your iPhone home screen
- [ ] Stripe connected (real revenue) and at least one social/review channel drafting
