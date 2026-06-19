"""TikTok Content Posting API — publishes a video by pulling it from a public URL.

Setup (developers.tiktok.com -> app -> Content Posting API, scope video.publish):
  .env: TIKTOK_ACCESS_TOKEN

TikTok is video-only: you must supply media_url pointing to a downloadable MP4.
Direct-post requires your app to be approved & audited; unaudited apps can only
post to private/SELF_ONLY. We default to SELF_ONLY so testing never goes public
by accident.

Docs: https://developers.tiktok.com/doc/content-posting-api-get-started
"""
from __future__ import annotations
import os
import httpx

INIT = "https://open.tiktokapis.com/v2/post/publish/video/init/"


def publish_video(content: str, media_url: str | None = None) -> dict:
    token = os.getenv("TIKTOK_ACCESS_TOKEN")
    if not token:
        return {"status": "blocked", "reason": "missing TIKTOK_ACCESS_TOKEN"}
    if not media_url:
        return {"status": "blocked", "platform": "tiktok",
                "reason": "TikTok is video-only; supply media_url (public MP4). Caption kept as draft."}
    privacy = os.getenv("TIKTOK_PRIVACY", "SELF_ONLY")  # SELF_ONLY until app is audited
    payload = {
        "post_info": {"title": content[:150], "privacy_level": privacy},
        "source_info": {"source": "PULL_FROM_URL", "video_url": media_url},
    }
    try:
        r = httpx.post(INIT, json=payload, timeout=40, headers={
            "Authorization": f"Bearer {token}", "Content-Type": "application/json"})
        r.raise_for_status()
        data = r.json()
        return {"status": "published", "platform": "tiktok",
                "publish_id": data.get("data", {}).get("publish_id")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "tiktok", "error": str(e)}
