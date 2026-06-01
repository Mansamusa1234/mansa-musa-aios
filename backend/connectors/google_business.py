"""Google Business Profile — local posts (offers/updates) + review replies.

Setup (Google Cloud -> enable Business Profile APIs -> OAuth for your account):
  .env: GOOGLE_BUSINESS_ACCOUNT_ID, GOOGLE_BUSINESS_LOCATION_ID, GOOGLE_OAUTH_TOKEN

Note: Google posts/reviews use OAuth user tokens that expire (~1h); in production
store a refresh token and mint access tokens on demand. Here we read a current
access token from GOOGLE_OAUTH_TOKEN.

Docs: https://developers.google.com/my-business/content/posts-data
"""
from __future__ import annotations
import os
import httpx

V4 = "https://mybusiness.googleapis.com/v4"


def _ctx():
    return (os.getenv("GOOGLE_BUSINESS_ACCOUNT_ID"),
            os.getenv("GOOGLE_BUSINESS_LOCATION_ID"),
            os.getenv("GOOGLE_OAUTH_TOKEN"))


def publish_local_post(content: str, media_url: str | None = None) -> dict:
    account, location, token = _ctx()
    if not (account and location and token):
        return {"status": "blocked", "reason": "missing GOOGLE_BUSINESS_* / GOOGLE_OAUTH_TOKEN"}
    body = {"languageCode": "en", "summary": content, "topicType": "STANDARD"}
    if media_url:
        body["media"] = [{"mediaFormat": "PHOTO", "sourceUrl": media_url}]
    url = f"{V4}/{account}/{location}/localPosts"
    try:
        r = httpx.post(url, json=body, timeout=30,
                       headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return {"status": "published", "platform": "google_business", "name": r.json().get("name")}
    except httpx.HTTPError as e:
        return {"status": "error", "platform": "google_business", "error": str(e)}


def reply_to_review(review_name: str, comment: str) -> dict:
    """review_name is the full resource path returned by the reviews list endpoint."""
    token = os.getenv("GOOGLE_OAUTH_TOKEN")
    if not token:
        return {"status": "blocked", "reason": "missing GOOGLE_OAUTH_TOKEN"}
    try:
        r = httpx.put(f"{V4}/{review_name}/reply", json={"comment": comment}, timeout=30,
                      headers={"Authorization": f"Bearer {token}"})
        r.raise_for_status()
        return {"status": "published", "platform": "google_business"}
    except httpx.HTTPError as e:
        return {"status": "error", "error": str(e)}
