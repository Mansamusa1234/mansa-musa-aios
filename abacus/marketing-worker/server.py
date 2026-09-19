import json
import os
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Mansa Musa AI Abacus Marketing Worker", version="1.0.0")

ABACUS_API_KEY = os.getenv("ABACUS_API_KEY", "")
WORKER_TOKEN = os.getenv("MANSA_WORKER_TOKEN", "")
ROUTELLM_URL = os.getenv(
    "ABACUS_ROUTELLM_URL",
    "https://routellm.abacus.ai/v1/chat/completions",
)

PLATFORMS = [
    "twitter",
    "linkedin",
    "facebook",
    "threads",
    "instagram",
    "tiktok",
    "youtube",
    "pinterest",
]


class MarketingJob(BaseModel):
    job: str
    version: int = 1
    campaign: str = "daily"
    brief: str | None = None
    fallbackTitle: str
    fallbackScript: str
    fallbackCaption: str
    fallbackHashtags: list[str]


def check_auth(authorization: str | None) -> None:
    if WORKER_TOKEN and authorization != f"Bearer {WORKER_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": "mansa-marketing-worker",
        "abacus_api_key": bool(ABACUS_API_KEY),
    }


@app.post("/marketing")
async def marketing(job: MarketingJob, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    check_auth(authorization)

    if job.job != "mansa-marketing-team":
        raise HTTPException(status_code=400, detail="Unsupported job")
    if not ABACUS_API_KEY:
        raise HTTPException(status_code=503, detail="ABACUS_API_KEY is not available")

    system = """You are the Mansa Musa AI marketing department.
Return STRICT JSON only, with this schema:
{"drafts":[{"platform":"twitter","title":"...","content":"...","requiresVideo":false,"metadata":{"agent":"..."}}]}
Create exactly one draft for each requested platform.
Keep claims factual and non-deceptive. Do not invent customer numbers, revenue, testimonials or performance statistics.
Adapt length and style to each platform.
For Instagram, TikTok, YouTube and Pinterest set requiresVideo=true.
For Twitter/X, LinkedIn, Facebook and Threads set requiresVideo=false.
Do not include markdown fences."""

    user = {
        "campaign": job.campaign,
        "brief": job.brief,
        "platforms": PLATFORMS,
        "brand": "MansaMusaAI",
        "website": "https://mansamusainitiative.com",
        "source_material": {
            "title": job.fallbackTitle,
            "script": job.fallbackScript,
            "caption": job.fallbackCaption,
            "hashtags": job.fallbackHashtags,
        },
        "instruction": "Create a coordinated cross-platform campaign in a clear, confident UK business voice.",
    }

    async with httpx.AsyncClient(timeout=90) as client:
        response = await client.post(
            ROUTELLM_URL,
            headers={
                "Authorization": f"Bearer {ABACUS_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "route-llm",
                "temperature": 0.5,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": json.dumps(user)},
                ],
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail=f"RouteLLM failed: {response.status_code}")

    payload = response.json()
    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    try:
        result = json.loads(content)
    except json.JSONDecodeError as exc:
        raise HTTPException(status_code=502, detail="RouteLLM returned invalid JSON") from exc

    drafts = result.get("drafts")
    if not isinstance(drafts, list):
        raise HTTPException(status_code=502, detail="RouteLLM response did not contain drafts")

    valid = []
    for draft in drafts:
        if not isinstance(draft, dict):
            continue
        platform = draft.get("platform")
        title = draft.get("title")
        text = draft.get("content")
        if platform in PLATFORMS and isinstance(title, str) and isinstance(text, str):
            valid.append(
                {
                    "platform": platform,
                    "title": title[:180],
                    "content": text[:12000],
                    "requiresVideo": platform in {"instagram", "tiktok", "youtube", "pinterest"},
                    "metadata": draft.get("metadata") if isinstance(draft.get("metadata"), dict) else {},
                }
            )

    if not valid:
        raise HTTPException(status_code=502, detail="No valid drafts returned")

    return {"runId": payload.get("id"), "drafts": valid}
