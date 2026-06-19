"""Meta Graph API — Facebook Page feed + Instagram Business content publishing.

Setup (Meta for Developers -> create app -> add the Page):
  scopes: pages_manage_posts, pages_read_engagement, instagram_basic,
          instagram_content_publish
  .env:   META_PAGE_ID, META_PAGE_ACCESS_TOKEN, META_IG_BUSINESS_ID

Docs: https://developers.facebook.com/docs/pages-api  /  .../instagram-api/content-publishing
"""
from __future__ import annotations
import os
import httpx

GRAPH = "https://graph.facebook.com/v21.0"


def _token() -> str | None:
    return os.getenv("META_PAGE_ACCESS_TOKEN")


def publish_facebook(content: str, media_url: str | None = None) -> dict:
    page_id, token = os.getenv("META_PAGE_ID"), _token()
    if not (page_id and token):
        return {"status": "blocked", "reason": "missing META_PAGE_ID/META_PAGE_ACCESS_TOKEN"}
    try:
        if media_url:  # photo post
            r = httpx.post(f"{GRAPH}/{page_id}/photos",
                           data={"url": media_url, "caption": content, "access_token": token},
                           timeout=30)
        else:          # text post
            r = httpx.post(f"{GRAPH}/{page_id}/feed",
                           data={"message": content, "access_token": token}, timeout=30)
        r.raise_for_status()
        return {"status": "published", "platform": "facebook", "id": r.json().get("id")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "facebook", "error": str(e)}


def publish_instagram(content: str, media_url: str | None = None) -> dict:
    ig_id, token = os.getenv("META_IG_BUSINESS_ID"), _token()
    if not (ig_id and token):
        return {"status": "blocked", "reason": "missing META_IG_BUSINESS_ID/META_PAGE_ACCESS_TOKEN"}
    if not media_url:
        # Instagram requires an image or video; text-only is not allowed by the API.
        return {"status": "blocked", "platform": "instagram",
                "reason": "Instagram needs media_url (image/video). Caption was kept as draft."}
    try:
        # 1) create the media container
        c = httpx.post(f"{GRAPH}/{ig_id}/media",
                       data={"image_url": media_url, "caption": content, "access_token": token},
                       timeout=30)
        c.raise_for_status()
        creation_id = c.json()["id"]
        # 2) publish it
        p = httpx.post(f"{GRAPH}/{ig_id}/media_publish",
                       data={"creation_id": creation_id, "access_token": token}, timeout=30)
        p.raise_for_status()
        return {"status": "published", "platform": "instagram", "id": p.json().get("id")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "instagram", "error": str(e)}


def reply_to_review(comment_id: str, message: str) -> dict:
    """Reply to a Facebook Page review/comment via the Graph API."""
    token = _token()
    if not token:
        return {"status": "blocked", "reason": "missing META_PAGE_ACCESS_TOKEN"}
    try:
        r = httpx.post(f"{GRAPH}/{comment_id}/comments",
                       data={"message": message, "access_token": token}, timeout=30)
        r.raise_for_status()
        return {"status": "published", "platform": "facebook", "id": r.json().get("id")}
    except httpx.HTTPError as e:
        return {"status": "error", "error": str(e)}
