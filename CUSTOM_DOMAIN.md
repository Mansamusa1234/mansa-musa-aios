# Connecting your GoDaddy domains

You have two domains. The clean, standard split for a restaurant running this OS:

| Domain | Role | Points at | Why |
|--------|------|-----------|-----|
| **PRIMARY** (your main brand, e.g. `mansamusakitchen.com`) | Public site + dashboard | **Vercel** | What customers and you see |
| `api.` on the primary (e.g. `api.mansamusakitchen.com`) | The AI OS backend | **Render** | The agents/API; not customer-facing |
| **SECOND** domain | Campaign / short links (e.g. in SMS & QR menus), or a redirect to the primary | Vercel redirect | Keeps marketing links tidy; protects the brand |

You do all of this in **GoDaddy → your domain → DNS → Manage DNS**, plus a "add domain"
click inside Render and Vercel. GoDaddy is only ever holding the DNS records.

---

## A. Point the PRIMARY domain at the dashboard (Vercel) ⏱15 min + propagation
1. Deploy the `dashboard/` folder to **Vercel** (drag-and-drop or `vercel` CLI).
2. Vercel → Project → **Settings → Domains → Add** → type `mansamusakitchen.com`.
   Vercel shows you the exact records to create. They are normally:
3. In **GoDaddy → DNS** add/edit:
   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | A | `@` | `76.76.21.21` | 1 hr |
   | CNAME | `www` | `cname.vercel-dns.com` | 1 hr |
   > Always use the value **Vercel shows you** — it occasionally differs. Delete any
   > GoDaddy "Parked"/forwarding A record on `@` first or it will conflict.
4. Back in Vercel, click **Refresh/Verify**. Green = done.

## B. Point `api.` at the backend (Render) ⏱10 min + propagation
1. Render → your **mansa-musa-api** web service → **Settings → Custom Domains → Add**
   → `api.mansamusakitchen.com`. Render shows a CNAME target like
   `mansa-musa-api.onrender.com`.
2. In **GoDaddy → DNS** add:
   | Type | Name | Value | TTL |
   |------|------|-------|-----|
   | CNAME | `api` | `mansa-musa-api.onrender.com` | 1 hr |
3. Render verifies and issues a free SSL cert automatically (a few minutes).
4. **Update the dashboard** to use it: in `dashboard/index.html` change
   `const API = "http://localhost:8000"` → `const API = "https://api.mansamusakitchen.com"`,
   then redeploy the dashboard to Vercel.

## C. Use the SECOND domain (pick one)
- **Simplest — redirect to the brand:** add it as a domain in the Vercel project and set
  a redirect to the primary. Good if it's a defensive/alt spelling.
- **Campaign domain:** keep it separate for short links in SMS/printed menus/QR codes
  (e.g. a Bitly custom domain, or its own tiny Vercel project). Looks cleaner than long URLs.
Tell me which and I'll give the exact records.

---

## CORS — one small code note
The browser dashboard calls the API across domains. The backend already allows this
(`backend/main.py` sets `allow_origins=["*"]`). For production you may want to lock it to
your domain — change that line to:
```python
allow_origins=["https://mansamusakitchen.com", "https://www.mansamusakitchen.com"]
```

## Checklist
- [ ] Dashboard live on the primary domain (Vercel verified, https works)
- [ ] `api.` subdomain resolves to Render, `https://api.<domain>/health` returns healthy
- [ ] `dashboard/index.html` API constant updated to the api subdomain + redeployed
- [ ] Second domain decided (redirect vs campaign) and records added
- [ ] (optional) CORS locked to your domain

## Honest notes
- **DNS propagation** can take from minutes to a few hours — not an error, just waiting.
- I can prepare every record exactly, but **only you can log into GoDaddy** and save them,
  and only you can authorise the domain in Render/Vercel. That's the ownership gate.
- Email sending (Resend/Twilio) also wants DNS records (SPF/DKIM) on the primary domain —
  I'll fold those into the same record sheet when you set up email, so you edit GoDaddy once.
