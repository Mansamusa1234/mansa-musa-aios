# DNS record sheet — mansamusainitiative.co.uk (primary) + .com (redirect)

Canonical site: **mansamusainitiative.co.uk** (best for a Kings Heath, Birmingham venue —
local signal + what UK customers type). The **.com** 301-redirects to it so you keep and
protect both. The code is already wired to the `.co.uk` API.

Set up the destinations first (Vercel for the site, Render for the API); each shows a
verification value you should confirm matches below.

## Role
| Host | Serves | Hosted on |
|------|--------|-----------|
| `mansamusainitiative.co.uk` (apex) + `www` | Public website (`site/`) | **Vercel** |
| `api.mansamusainitiative.co.uk` | The AI OS backend (`backend/`) | **Render** |
| `mansamusainitiative.com` (+ `www`) | 301 redirect → `.co.uk` | GoDaddy or Vercel |

---

## Records to add in GoDaddy

### 1. Website → Vercel  (domain: mansamusainitiative.co.uk)
| Type  | Name | Value                  | TTL  |
|-------|------|------------------------|------|
| A     | `@`  | `76.76.21.21`          | 1 Hour |
| CNAME | `www`| `cname.vercel-dns.com` | 1 Hour |

> First **delete** any existing GoDaddy `A` record on `@` (the default "Parked" one) and any
> forwarding, or it will fight the Vercel record. In Vercel: Project → Settings → Domains →
> add `mansamusainitiative.co.uk` **and** `www.mansamusainitiative.co.uk`, then Verify.

### 2. API → Render  (domain: mansamusainitiative.co.uk)
| Type  | Name  | Value                          | TTL  |
|-------|-------|--------------------------------|------|
| CNAME | `api` | `mansa-musa-api.onrender.com`  | 1 Hour |

> Use the **exact** target Render shows under your web service → Settings → Custom Domains
> after you add `api.mansamusainitiative.co.uk` (usually `<service-name>.onrender.com`).
> Render then auto-issues a free SSL certificate.

### 3. The .com → redirect to .co.uk
Goal: anyone typing the `.com` is sent to the canonical `.co.uk` (one brand, no split SEO).

**Easiest (no DNS math) — GoDaddy domain forwarding:**
GoDaddy → `mansamusainitiative.com` → **Forwarding → Add** →
forward to `https://mansamusainitiative.co.uk`, type **Permanent (301)**, **Forward with masking: OFF**.
GoDaddy adds the records for you. Done.

**Cleaner (recommended) — add it to Vercel as a redirect:**
1. In the Vercel project: Settings → Domains → add `mansamusainitiative.com` (+ `www`),
   set it to **Redirect to mansamusainitiative.co.uk (308/301)**.
2. In GoDaddy DNS for **mansamusainitiative.com**:
   | Type  | Name | Value                  | TTL   |
   |-------|------|------------------------|-------|
   | A     | `@`  | `76.76.21.21`          | 1 Hour |
   | CNAME | `www`| `cname.vercel-dns.com` | 1 Hour |

> The API CORS already allows both domains, so nothing breaks while the redirect propagates.

### 4. (Later) Email sending → when you set up Resend  (on mansamusainitiative.co.uk)
Resend gives you 3 records to verify the domain so campaign email isn't marked spam
(use Resend's actual values):
| Type  | Name                     | Value                            |
|-------|--------------------------|----------------------------------|
| TXT   | `@` or `send`            | `v=spf1 include:resend.com ~all` |
| CNAME | `resend._domainkey`      | (DKIM value from Resend)         |
| TXT   | `_dmarc`                 | `v=DMARC1; p=none;`              |
Then set `.env`: `EMAIL_FROM=Mansa Musa <hello@mansamusainitiative.co.uk>`.

---

## Verify after propagation (minutes to a few hours)
- `https://mansamusainitiative.co.uk` → the website loads over https.
- `https://api.mansamusainitiative.co.uk/health` → `{"status":"healthy", ...}`.
- `https://mansamusainitiative.com` → redirects to the `.co.uk`.
- Submit a test booking on the site → returns "Booking received" and appears in the
  dashboard's **AI Command** tab.

## Still needed from you
1. **Full address** — street + postcode in Kings Heath (site currently shows "Kings Heath,
   Birmingham" with the street/postcode to add).
2. **Phone & opening hours** — to replace the placeholders.
3. **Social profile URLs** — Instagram / Facebook / TikTok / Tripadvisor for the footer
   (I won't invent these).
