"""Stripe — read-only revenue pull. Use a RESTRICTED key (charges:read).

Never write through this connector. It just totals settled charges for a window so
the Finance / Revenue agents work on real takings instead of demo numbers.
"""
from __future__ import annotations
import os
import time
import httpx

API = "https://api.stripe.com/v1"


def revenue(days: int = 30) -> dict:
    key = os.getenv("STRIPE_RESTRICTED_KEY")
    if not key:
        return {"status": "blocked", "reason": "missing STRIPE_RESTRICTED_KEY"}
    since = int(time.time()) - days * 86400
    gross, count = 0.0, 0
    params = {"limit": 100, "created[gte]": since}
    try:
        with httpx.Client(base_url=API, auth=(key, ""), timeout=30) as c:
            url = "/charges"
            while True:
                r = c.get(url, params=params)
                r.raise_for_status()
                data = r.json()
                for ch in data["data"]:
                    if ch.get("paid") and not ch.get("refunded"):
                        gross += ch["amount"] / 100
                        count += 1
                if not data.get("has_more"):
                    break
                params["starting_after"] = data["data"][-1]["id"]
        return {"status": "ok", "days": days, "gross_revenue": round(gross, 2),
                "charges": count, "avg_charge": round(gross / count, 2) if count else 0}
    except httpx.HTTPError as e:
        return {"status": "error", "error": str(e)}
