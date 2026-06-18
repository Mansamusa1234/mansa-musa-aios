"""SMS via Twilio. Booking reminders, last-minute offers, waitlist 'table ready'.

Setup: twilio.com -> Account SID + Auth Token + a sending number.
  .env: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM
Respect opt-in/opt-out (STOP) and local marketing rules.
"""
from __future__ import annotations
import os
import httpx


def send_sms(to: str, body: str) -> dict:
    sid, token = os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN")
    sender = os.getenv("TWILIO_FROM")
    if not (sid and token and sender):
        return {"status": "blocked", "reason": "missing TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM"}
    try:
        r = httpx.post(f"https://api.twilio.com/2010-04-01/Accounts/{sid}/Messages.json",
                       auth=(sid, token), timeout=30,
                       data={"To": to, "From": sender, "Body": body})
        r.raise_for_status()
        return {"status": "sent", "platform": "sms", "id": r.json().get("sid")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "sms", "error": str(e)}
