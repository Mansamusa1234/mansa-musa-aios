"""WhatsApp Cloud API — send customer messages (booking confirmations, VIP offers,
campaign broadcasts). Part of Meta's Graph API but a separate product.

Setup (Meta for Developers -> WhatsApp -> get a phone number id + token):
  .env: WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID

IMPORTANT WhatsApp policy:
  - Outside the 24h customer-service window you may only send pre-approved
    TEMPLATE messages, and only to users who opted in. Free-text is allowed only
    inside an open 24h conversation the customer started. This connector supports
    both: type="text" (inside window) and type="template" (broadcast/opt-in).

Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
"""
from __future__ import annotations
import os
import httpx

GRAPH = "https://graph.facebook.com/v21.0"


def send_message(to: str, content: str, template: str | None = None,
                 lang: str = "en_GB") -> dict:
    phone_id, token = os.getenv("WHATSAPP_PHONE_NUMBER_ID"), os.getenv("WHATSAPP_TOKEN")
    if not (phone_id and token):
        return {"status": "blocked", "reason": "missing WHATSAPP_PHONE_NUMBER_ID/WHATSAPP_TOKEN"}

    if template:  # opt-in broadcast / outside 24h window
        payload = {"messaging_product": "whatsapp", "to": to, "type": "template",
                   "template": {"name": template, "language": {"code": lang}}}
    else:         # free text — only valid inside an open 24h customer window
        payload = {"messaging_product": "whatsapp", "to": to, "type": "text",
                   "text": {"body": content}}
    try:
        r = httpx.post(f"{GRAPH}/{phone_id}/messages", json=payload, timeout=30,
                       headers={"Authorization": f"Bearer {token}",
                                "Content-Type": "application/json"})
        r.raise_for_status()
        msg = r.json().get("messages", [{}])[0]
        return {"status": "sent", "platform": "whatsapp", "id": msg.get("id")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "whatsapp", "error": str(e)}
