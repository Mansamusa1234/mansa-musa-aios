import os
from datetime import date
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Mansa Musa AI Repo Intelligence Worker", version="1.0.0")

ABACUS_API_KEY = os.getenv("ABACUS_API_KEY", "")
WORKER_TOKEN = os.getenv("MANSA_WORKER_TOKEN", "")
ROUTELLM_URL = os.getenv(
    "ABACUS_ROUTELLM_URL",
    "https://routellm.abacus.ai/v1/chat/completions",
)
RESPONSES_URL = os.getenv(
    "ABACUS_RESPONSES_URL",
    "https://routellm.abacus.ai/v1/responses",
)
RESEARCH_MODEL = os.getenv("ABACUS_RESEARCH_MODEL", "gpt-5.5")
YOUTUBE_DATA_API_KEY = os.getenv("YOUTUBE_DATA_API_KEY", "")


class RepoJob(BaseModel):
    job: str
    version: int = 1
    repository: dict[str, Any]
    treeSummary: dict[str, Any]
    focus: str | None = Field(default=None, max_length=1200)
    context: str = Field(min_length=20, max_length=80000)


class MarketGapJob(BaseModel):
    job: str
    version: int = 1
    projectName: str = Field(min_length=2, max_length=160)
    idea: str = Field(min_length=10, max_length=8000)
    customers: str = Field(min_length=2, max_length=4000)
    problem: str = Field(min_length=2, max_length=4000)
    market: str = Field(default="Global", max_length=1000)
    goal: str = Field(default="Find the strongest commercially testable market gap", max_length=2000)
    keywords: list[str] = Field(default_factory=list, max_length=30)
    context: str | None = Field(default=None, max_length=12000)


def check_auth(authorization: str | None) -> None:
    if WORKER_TOKEN and authorization != "Bearer " + WORKER_TOKEN:
        raise HTTPException(status_code=401, detail="Unauthorized")


@app.get("/health")
async def health(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    check_auth(authorization)
    return {
        "ok": True,
        "service": "mansa-repo-intelligence-worker",
        "abacus_api_key": bool(ABACUS_API_KEY),
        "market_gap": True,
        "research_model": RESEARCH_MODEL,
        "youtube_data_api": bool(YOUTUBE_DATA_API_KEY),
    }


@app.post("/repo-intelligence")
async def repo_intelligence(
    job: RepoJob,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    check_auth(authorization)

    if job.job != "mansa-repo-intelligence":
        raise HTTPException(status_code=400, detail="Unsupported job")
    if not ABACUS_API_KEY:
        raise HTTPException(status_code=503, detail="ABACUS_API_KEY is not available")

    system = """You are the Mansa Musa AI Repo Intelligence Supercomputer worker.
Act as a senior software architect, SRE, security reviewer and debugging engineer.
Use only the supplied repository context. Do not claim access to files that are not supplied.
Never request or reveal credentials, tokens, passwords, private keys or production secrets.
Prioritise concrete evidence and exact file paths over generic advice.

Return a substantial Markdown report with these sections:
1. Executive summary
2. Architecture map
3. Build and deployment risks
4. Authentication and security findings
5. Broken, incomplete or suspicious implementation areas
6. Performance and maintainability
7. Exact files to inspect or change next
8. Prioritised repair plan

Clearly label uncertainty when the supplied context is insufficient."""

    user_content = "\n".join(
        [
            "Repository metadata: " + str(job.repository),
            "Tree summary: " + str(job.treeSummary),
            "Owner focus: " + (job.focus or "full codebase audit"),
            "",
            job.context,
        ]
    )

    async with httpx.AsyncClient(timeout=110) as client:
        response = await client.post(
            ROUTELLM_URL,
            headers={
                "Authorization": "Bearer " + ABACUS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": "route-llm",
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user_content},
                ],
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="RouteLLM failed: " + str(response.status_code))

    payload = response.json()
    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not isinstance(content, str) or len(content.strip()) < 20:
        raise HTTPException(status_code=502, detail="RouteLLM returned an empty audit")

    return {
        "runId": payload.get("id"),
        "report": content[:120000],
    }


def _extract_response_text(payload: dict[str, Any]) -> str:
    direct = payload.get("output_text")
    if isinstance(direct, str) and direct.strip():
        return direct.strip()

    chunks: list[str] = []
    output = payload.get("output")
    if isinstance(output, list):
        for item in output:
            if not isinstance(item, dict):
                continue
            content = item.get("content")
            if not isinstance(content, list):
                continue
            for part in content:
                if not isinstance(part, dict):
                    continue
                text = part.get("text")
                if isinstance(text, str) and text.strip():
                    chunks.append(text.strip())
    return "\n\n".join(chunks).strip()


async def _youtube_snapshot(job: MarketGapJob) -> str:
    """Collect a small, evidence-grade YouTube snapshot when a Data API key is configured."""
    if not YOUTUBE_DATA_API_KEY:
        return "Direct YouTube Data API snapshot: not configured. Use web-search evidence and label it accordingly."

    raw_terms = [item.strip() for item in job.keywords if item.strip()]
    if not raw_terms:
        raw_terms = [job.projectName, job.problem[:120]]
    terms = raw_terms[:4]

    video_ids: list[str] = []
    query_map: dict[str, list[str]] = {}
    async with httpx.AsyncClient(timeout=30) as client:
        for term in terms:
            response = await client.get(
                "https://www.googleapis.com/youtube/v3/search",
                params={
                    "key": YOUTUBE_DATA_API_KEY,
                    "part": "snippet",
                    "type": "video",
                    "q": term,
                    "order": "viewCount",
                    "maxResults": 10,
                    "safeSearch": "moderate",
                },
            )
            if response.status_code >= 400:
                continue
            items = response.json().get("items", [])
            ids: list[str] = []
            for item in items:
                video_id = item.get("id", {}).get("videoId")
                if isinstance(video_id, str) and video_id:
                    ids.append(video_id)
                    if video_id not in video_ids:
                        video_ids.append(video_id)
            query_map[term] = ids

        if not video_ids:
            return "Direct YouTube Data API snapshot: configured, but no usable public video results were returned."

        details = await client.get(
            "https://www.googleapis.com/youtube/v3/videos",
            params={
                "key": YOUTUBE_DATA_API_KEY,
                "part": "snippet,statistics",
                "id": ",".join(video_ids[:50]),
            },
        )
        if details.status_code >= 400:
            return "Direct YouTube Data API snapshot: search succeeded, but video statistics retrieval failed."

        videos = details.json().get("items", [])
        channel_ids: list[str] = []
        for video in videos:
            channel_id = video.get("snippet", {}).get("channelId")
            if isinstance(channel_id, str) and channel_id and channel_id not in channel_ids:
                channel_ids.append(channel_id)

        channels_by_id: dict[str, Any] = {}
        if channel_ids:
            channel_response = await client.get(
                "https://www.googleapis.com/youtube/v3/channels",
                params={
                    "key": YOUTUBE_DATA_API_KEY,
                    "part": "snippet,statistics",
                    "id": ",".join(channel_ids[:50]),
                },
            )
            if channel_response.status_code < 400:
                channels_by_id = {
                    item.get("id"): item
                    for item in channel_response.json().get("items", [])
                    if isinstance(item.get("id"), str)
                }

    ranked: list[dict[str, Any]] = []
    for video in videos:
        snippet = video.get("snippet", {})
        stats = video.get("statistics", {})
        channel_id = snippet.get("channelId", "")
        channel = channels_by_id.get(channel_id, {})
        channel_stats = channel.get("statistics", {})
        try:
            views = int(stats.get("viewCount", 0))
        except (TypeError, ValueError):
            views = 0
        ranked.append({
            "title": snippet.get("title", ""),
            "videoId": video.get("id", ""),
            "channel": snippet.get("channelTitle", ""),
            "publishedAt": snippet.get("publishedAt", ""),
            "views": views,
            "likes": stats.get("likeCount"),
            "channelViews": channel_stats.get("viewCount"),
            "subscribers": channel_stats.get("subscriberCount"),
        })

    ranked.sort(key=lambda item: item["views"], reverse=True)
    top = ranked[:20]
    lines = [
        "Direct YouTube Data API snapshot (public metrics; observation date "
        + date.today().isoformat()
        + "):"
    ]
    for idx, item in enumerate(top, start=1):
        lines.append(
            f"{idx}. {item['title']} | channel={item['channel']} | "
            f"video_views={item['views']} | likes={item['likes']} | "
            f"channel_subscribers={item['subscribers']} | channel_views={item['channelViews']} | "
            f"published={item['publishedAt']} | https://www.youtube.com/watch?v={item['videoId']}"
        )
    lines.append(
        "Interpretation rule: these are public visibility metrics, not revenue or proof of commercial success. "
        "YouTube subscriber counts may be rounded by the platform."
    )
    return "\n".join(lines)


def _market_prompt(job: MarketGapJob) -> str:
    today = date.today().isoformat()
    keywords = ", ".join(job.keywords[:30]) if job.keywords else "derive the strongest search terms yourself"
    return f"""Research and validate this business/project idea using CURRENT public web evidence as of {today}.

PROJECT: {job.projectName}
IDEA:
{job.idea}

TARGET CUSTOMERS:
{job.customers}

PROBLEM:
{job.problem}

TARGET MARKET:
{job.market}

OWNER GOAL:
{job.goal}

SEARCH KEYWORDS:
{keywords}

ADDITIONAL CONTEXT:
{job.context or "None"}

You are the Market Gap Intelligence unit inside Mansa Musa AI.

Use live web search aggressively. Search official company sites, credible industry sources, app/store listings, YouTube channels and videos, social profiles, review/community discussions, pricing pages and news.

Return a substantial Markdown report with these sections:
# Executive Summary
# Who Would Actually Pay
# Competitor Landscape
# Business Scale Evidence
# YouTube & Social Visibility
# Customer Pain & Complaint Mining
# Market Gaps
# Positioning Opportunities
# What To Build First
# Validation Tests
# Risks & Disconfirming Evidence
# Sources

Evidence standard:
- Label material evidence as VERIFIED FACT, COMPANY CLAIM, THIRD-PARTY ESTIMATE, PROXY, or HYPOTHESIS.
- Prefer primary sources for prices, features, channel ownership and company claims.
- Do not fabricate figures or URLs.
- Do not call a company the biggest or say it does the most business unless reliable evidence supports that claim.
- Treat funding, followers, views, web traffic and app ranking as proxies, not revenue.
- For YouTube/social figures, identify platform and observation date when supported by the source.
- Separate evidence-backed gaps from weakly served needs and speculative opportunities.
- If current evidence is unavailable, say so.
"""


async def _run_live_market_research(job: MarketGapJob) -> tuple[str, str | None]:
    youtube_snapshot = await _youtube_snapshot(job)
    research_prompt = _market_prompt(job) + "\n\n" + youtube_snapshot
    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            RESPONSES_URL,
            headers={
                "Authorization": "Bearer " + ABACUS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": RESEARCH_MODEL,
                "input": research_prompt,
                "tools": [{"type": "web_search"}],
                "store": False,
            },
        )

    if response.status_code >= 400:
        raise RuntimeError("Responses API failed: " + str(response.status_code) + " " + response.text[:500])

    payload = response.json()
    report = _extract_response_text(payload)
    if len(report) < 40:
        raise RuntimeError("Responses API returned an empty research report")

    run_id = payload.get("id")
    return report[:120000], run_id if isinstance(run_id, str) else None


async def _run_market_fallback(job: MarketGapJob) -> tuple[str, str | None]:
    system = """You are Mansa Musa AI Market Gap Intelligence in offline fallback mode.
You do not have live web-search evidence in this request.
Do not state current revenue, rankings, prices, social counts or competitor leadership as verified.
Produce a strategy report and clearly mark current-market statements that still need live verification."""

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            ROUTELLM_URL,
            headers={
                "Authorization": "Bearer " + ABACUS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": "route-llm",
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": _market_prompt(job)},
                ],
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Abacus fallback analysis failed")

    payload = response.json()
    content = payload.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not isinstance(content, str) or len(content.strip()) < 40:
        raise HTTPException(status_code=502, detail="Abacus fallback returned an empty report")

    run_id = payload.get("id")
    return content[:120000], run_id if isinstance(run_id, str) else None


@app.post("/market-gap")
async def market_gap(
    job: MarketGapJob,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    check_auth(authorization)

    if job.job != "mansa-market-gap":
        raise HTTPException(status_code=400, detail="Unsupported job")
    if not ABACUS_API_KEY:
        raise HTTPException(status_code=503, detail="ABACUS_API_KEY is not available")

    try:
        report, run_id = await _run_live_market_research(job)
        return {
            "runId": run_id,
            "report": report,
            "liveSearch": True,
            "source": "abacus-responses-web-search",
        }
    except Exception as live_error:
        print("[market-gap] live research failed", repr(live_error))
        report, run_id = await _run_market_fallback(job)
        return {
            "runId": run_id,
            "report": report,
            "liveSearch": False,
            "source": "abacus-routellm-fallback",
            "warning": "Live web search was unavailable; current-market facts require verification.",
        }
