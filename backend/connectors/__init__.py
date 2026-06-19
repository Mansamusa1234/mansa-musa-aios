"""Official-API connectors. Each exposes publish(...) / send(...) that performs a
real HTTP call when credentials are present, and returns a structured result.

When credentials are missing the connector returns {"status": "blocked", ...} so
the OS keeps the content as a DRAFT instead of crashing. Nothing here scrapes,
automates logins, or bypasses a platform — every call uses the documented API."""
from __future__ import annotations

from . import meta, tiktok, google_business, whatsapp, email, sms, tripadvisor, stripe_conn

# channel name (as used in agents.yaml / campaigns.channel) -> publish callable
PUBLISHERS = {
    "facebook": meta.publish_facebook,
    "instagram": meta.publish_instagram,
    "tiktok": tiktok.publish_video,
    "google business profile": google_business.publish_local_post,
    "google": google_business.publish_local_post,
}

# direct-message channels: fn(to, content)
MESSENGERS = {
    "whatsapp": whatsapp.send_message,
    "sms": lambda to, content: sms.send_sms(to, content),
    "email": lambda to, content: email.send_email(to, "A note from Mansa Musa", content),
}

# read-only review sources for reputation monitoring
REVIEW_SOURCES = {
    "tripadvisor": tripadvisor.fetch_reviews,
}


def publish(channel: str, content: str, media_url: str | None = None) -> dict:
    fn = PUBLISHERS.get(channel.lower())
    if not fn:
        return {"status": "unsupported", "channel": channel}
    return fn(content, media_url)
