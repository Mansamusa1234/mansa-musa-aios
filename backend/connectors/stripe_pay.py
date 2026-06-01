"""Stripe payments (write) — create Payment Links for catering deposits, event
tickets and pre-orders. SEPARATE key from the read-only reporting key.

Setup: dashboard.stripe.com → Developers → API keys. Use a key (or restricted key
with `payment_links:write` + `prices:write` + `products:write`).
  .env: STRIPE_SECRET_KEY

A Payment Link is a hosted Stripe checkout URL you can text/email to a customer —
no website checkout build required. Money lands in your normal Stripe payouts.
"""
from __future__ import annotations
import os
import httpx

API = "https://api.stripe.com/v1"


def create_payment_link(description: str, amount_gbp: float,
                        quantity: int = 1) -> dict:
    key = os.getenv("STRIPE_SECRET_KEY")
    if not key:
        return {"status": "blocked", "reason": "missing STRIPE_SECRET_KEY"}
    pennies = int(round(amount_gbp * 100))
    try:
        with httpx.Client(base_url=API, auth=(key, ""), timeout=30) as c:
            # 1) create a price (with an inline product) for this charge
            price = c.post("/prices", data={
                "unit_amount": pennies, "currency": "gbp",
                "product_data[name]": description,
            })
            price.raise_for_status()
            price_id = price.json()["id"]
            # 2) create the payment link for that price
            link = c.post("/payment_links", data={
                "line_items[0][price]": price_id,
                "line_items[0][quantity]": quantity,
            })
            link.raise_for_status()
            d = link.json()
            return {"status": "created", "url": d["url"], "id": d["id"],
                    "amount_gbp": amount_gbp, "description": description}
    except httpx.HTTPError as e:
        return {"status": "error", "error": str(e)}
