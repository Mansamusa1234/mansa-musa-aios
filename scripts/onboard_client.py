"""Onboard a new white-label client in one command.

Generates a ready-to-deploy per-client environment file from answers (or a JSON spec),
validates it, and prints the exact deploy steps. Designed so a reseller can stand up a new
branded instance in minutes.

Usage:
  # interactive
  python scripts/onboard_client.py

  # non-interactive from a spec file
  python scripts/onboard_client.py --spec clients/acme.json

  # quick flags
  python scripts/onboard_client.py --name "Acme Bistro" --domain acmebistro.co.uk \
      --cuisine Italian --city Manchester --accent "#b5462f"

Output: config/clients/<slug>.env  (fill in the secret keys, then deploy).
Nothing here touches the network — it prepares the deployment; you paste the env into
Render/Supabase. (A future version can call the Render + Supabase APIs to fully automate.)
"""
from __future__ import annotations
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENTS_DIR = ROOT / "config" / "clients"

FIELDS = [
    # key, prompt, default
    ("BRAND_NAME", "Brand / product name shown to the client", "Acme Bistro OS"),
    ("RESTAURANT_NAME", "The restaurant's name", "Acme Bistro"),
    ("RESTAURANT_CUISINE", "Cuisine", "Caribbean"),
    ("RESTAURANT_CITY", "City / area", "Birmingham"),
    ("BRAND_DOMAIN", "Their domain (no https)", "acmebistro.co.uk"),
    ("BRAND_ACCENT", "Accent colour (hex)", "#c79a3b"),
    ("RESTAURANT_PHONE", "Phone", ""),
    ("RESTAURANT_ADDRESS", "Full address", ""),
]


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-") or "client"


def collect_interactive() -> dict:
    print("\nOnboard a new client — press Enter to accept the [default].\n")
    data = {}
    for key, prompt, default in FIELDS:
        val = input(f"  {prompt} [{default}]: ").strip()
        data[key] = val or default
    return data


def from_args(args) -> dict:
    if args.spec:
        return json.loads(Path(args.spec).read_text())
    data = {}
    for key, _, default in FIELDS:
        data[key] = default
    if args.name:
        data["BRAND_NAME"] = f"{args.name} OS"
        data["RESTAURANT_NAME"] = args.name
    if args.domain:
        data["BRAND_DOMAIN"] = args.domain
    if args.cuisine:
        data["RESTAURANT_CUISINE"] = args.cuisine
    if args.city:
        data["RESTAURANT_CITY"] = args.city
    if args.accent:
        data["BRAND_ACCENT"] = args.accent
    return data


def render_env(d: dict) -> str:
    brand = d.get("BRAND_NAME", "Client OS")
    domain = d.get("BRAND_DOMAIN", "")
    return f"""# ── {brand} — generated client env ───────────────────────────────────────────
# Fill in the blank SECRET keys, then deploy (see the printed steps).

# Branding (drives dashboard + site via GET /brand)
BRAND_NAME={brand}
BRAND_TAGLINE={d.get('RESTAURANT_NAME','')}, run by AI.
BRAND_ACCENT={d.get('BRAND_ACCENT','#c79a3b')}
BRAND_DOMAIN={domain}
BRAND_POWERED_BY=Powered by Mansa Musa AI OS

# Restaurant identity
RESTAURANT_NAME={d.get('RESTAURANT_NAME','')}
RESTAURANT_CUISINE={d.get('RESTAURANT_CUISINE','')}
RESTAURANT_CITY={d.get('RESTAURANT_CITY','')}
RESTAURANT_TIMEZONE=Europe/London
RESTAURANT_PHONE={d.get('RESTAURANT_PHONE','')}
RESTAURANT_ADDRESS={d.get('RESTAURANT_ADDRESS','')}

# LLM
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
OPENAI_API_KEY=

# Database (client's own Supabase project)
SUPABASE_URL=
SUPABASE_SERVICE_KEY=

# Payments / connections (added as the client authorises each)
STRIPE_RESTRICTED_KEY=
STRIPE_SECRET_KEY=
META_PAGE_ID=
META_PAGE_ACCESS_TOKEN=
META_IG_BUSINESS_ID=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_TOKEN=
GOOGLE_BUSINESS_ACCOUNT_ID=
GOOGLE_BUSINESS_LOCATION_ID=
GOOGLE_OAUTH_TOKEN=
TIKTOK_ACCESS_TOKEN=
TRIPADVISOR_API_KEY=
TRIPADVISOR_LOCATION_ID=
RESEND_API_KEY=
EMAIL_FROM=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=

# Safety (start locked)
ALLOW_AUTO_PUBLISH=false
AUTO_REPLY_ENABLED=false
WEBHOOK_SECRET={slugify(brand)}-{_rand()}
"""


def _rand() -> str:
    import secrets
    return secrets.token_hex(8)


def steps(slug: str, d: dict) -> str:
    domain = d.get("BRAND_DOMAIN", "their-domain.com")
    return f"""
✓ Wrote config/clients/{slug}.env

Next (≈30 min):
  1. Supabase → New project for this client → SQL Editor → run db/schema.sql.
     Paste the Project URL + service_role key into the env file.
  2. Get the client's OpenAI key (or use yours) → OPENAI_API_KEY.
  3. Render → New Blueprint from the repo → paste this env file's variables.
  4. Point DNS: site → Vercel, api.{domain} → Render (see DNS_*.md pattern).
  5. Send the client IPHONE_APP.md to install the dashboard on their phone.
  6. Keep ALLOW_AUTO_PUBLISH / AUTO_REPLY_ENABLED = false until they trust the drafts.

Their dashboard will automatically show "{d.get('BRAND_NAME','')}" in their accent colour
via the /brand endpoint — no code changes.
"""


def main():
    p = argparse.ArgumentParser(description="Onboard a white-label client")
    p.add_argument("--spec", help="Path to a JSON spec file")
    p.add_argument("--name"); p.add_argument("--domain"); p.add_argument("--cuisine")
    p.add_argument("--city"); p.add_argument("--accent")
    args = p.parse_args()

    data = collect_interactive() if len(sys.argv) == 1 else from_args(args)
    slug = slugify(data.get("BRAND_NAME", "client"))
    CLIENTS_DIR.mkdir(parents=True, exist_ok=True)
    out = CLIENTS_DIR / f"{slug}.env"
    out.write_text(render_env(data))
    print(steps(slug, data))


if __name__ == "__main__":
    main()
