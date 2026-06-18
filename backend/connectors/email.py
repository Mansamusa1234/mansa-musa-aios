"""Email via Resend. Used for campaigns, birthday offers, win-back, booking confirms.

Setup: resend.com -> API key -> verify your sending domain.
  .env: RESEND_API_KEY, EMAIL_FROM (e.g. "Mansa Musa <hello@yourdomain.com>")
"""
from __future__ import annotations
import os
import httpx


def send_email(to: str, subject: str, html: str) -> dict:
    key = os.getenv("RESEND_API_KEY")
    sender = os.getenv("EMAIL_FROM", "Mansa Musa <onboarding@resend.dev>")
    if not key:
        return {"status": "blocked", "reason": "missing RESEND_API_KEY"}
    try:
        r = httpx.post("https://api.resend.com/emails", timeout=30,
                       headers={"Authorization": f"Bearer {key}"},
                       json={"from": sender, "to": [to], "subject": subject, "html": html})
        r.raise_for_status()
        return {"status": "sent", "platform": "email", "id": r.json().get("id")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "email", "error": str(e)}
