"""Tripadvisor Content API — pull location details & recent reviews for monitoring.

Setup: tripadvisor.com/developers -> Content API key. Note Tripadvisor does NOT
offer a public 'post reply' API; replies are done in the management portal. So this
connector is read/monitor only: the Review agent drafts a reply for a human to post.
  .env: TRIPADVISOR_API_KEY, TRIPADVISOR_LOCATION_ID
"""
from __future__ import annotations
import os
import httpx

BASE = "https://api.content.tripadvisor.com/api/v1"


def fetch_reviews(limit: int = 20) -> dict:
    key = os.getenv("TRIPADVISOR_API_KEY")
    loc = os.getenv("TRIPADVISOR_LOCATION_ID")
    if not (key and loc):
        return {"status": "blocked", "reason": "missing TRIPADVISOR_API_KEY/LOCATION_ID"}
    try:
        r = httpx.get(f"{BASE}/location/{loc}/reviews",
                      params={"key": key, "language": "en"}, timeout=30,
                      headers={"accept": "application/json"})
        r.raise_for_status()
        data = r.json().get("data", [])[:limit]
        reviews = [{"source": "tripadvisor", "stars": d.get("rating"),
                    "author": (d.get("user") or {}).get("username"),
                    "text": d.get("text", "")} for d in data]
        return {"status": "ok", "count": len(reviews), "reviews": reviews}
    except httpx.HTTPError as e:
        return {"status": "error", "error": str(e)}
