import os
from datetime import date
from typing import Any

import httpx
from fastapi import FastAPI, Header, HTTPException
from pydantic import BaseModel, Field

app = FastAPI(title="Mansa Musa AI Market Gap Intelligence Worker", version="1.0.0")

ABACUS_API_KEY = os.getenv("ABACUS_API_KEY", "")
WORKER_TOKEN = os.getenv("MANSA_WORKER_TOKEN", "")
RESEARCH_MODEL = os.getenv("ABACUS_RESEARCH_MODEL", "gpt-5.5")
RESPONSES_URL = os.getenv(
    "ABACUS_RESPONSES_URL",
    "https://routellm.abacus.ai/v1/responses",
)
CHAT_URL = os.getenv(
    "ABACUS_CHAT_URL",
    "https://routellm.abacus.ai/v1/chat/completions",
)


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


def extract_response_text(payload: dict[str, Any]) -> str:
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


def build_prompt(job: MarketGapJob) -> str:
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

Use live web search aggressively. Search official company sites, credible industry sources, app/store listings, YouTube channels and videos, social profiles, review/community discussions, pricing pages, news and other reliable public sources.

Return a substantial Markdown report with these exact sections:

# Executive Summary
State what appears commercially promising and what remains unproven.

# Who Would Actually Pay
Identify buyer segments, the pain they pay to remove, buying triggers and likely objections.

# Competitor Landscape
Create a table with competitor, offer, customer, pricing if verified, scale evidence, strengths, weaknesses and source.

# Business Scale Evidence
Identify who appears largest or strongest ONLY where evidence exists. Separate:
- verified revenue / customers / transactions;
- company-reported figures;
- third-party estimates;
- proxies such as funding, web traffic, subscribers or app rankings.
Never turn a proxy into a revenue claim.

# YouTube & Social Visibility
Find the strongest relevant channels/accounts and content patterns.
Include public subscriber/follower/view figures only when the source supports them.
Note the observation date and platform.
Identify high-performing topics, hooks, formats and underserved search/content themes.
Do not invent private engagement, conversion or revenue figures.

# Customer Pain & Complaint Mining
Summarise recurring complaints, unmet needs, review themes and friction found in public evidence.

# Market Gaps
Separate:
1. Evidence-backed gaps
2. Weakly served needs
3. Speculative opportunities that still require testing

For every gap explain what competitor behaviour or customer evidence supports it.

# Positioning Opportunities
Suggest distinct positioning angles without pretending they are validated until tested.

# What To Build First
Define the smallest MVP or experiment that can prove demand before a large build.

# Validation Tests
Give behavioural tests: waitlist, preorder, demo booking, trial activation, watch completion, retention, paid pilot or other measurable actions.

# Risks & Disconfirming Evidence
Include evidence that could make the idea weaker, crowded, expensive or hard to distribute.

# Sources
Provide source name, URL, publication/update date when available, and what claim it supports.

EVIDENCE STANDARD:
- Clearly label VERIFIED FACT, COMPANY CLAIM, THIRD-PARTY ESTIMATE, PROXY, or HYPOTHESIS where material.
- Prefer primary sources for prices, features, channel/account ownership and company claims.
- Do not fabricate figures or URLs.
- Do not claim a niche is a "loophole" merely because it sounds attractive; show the evidence for the gap.
- If current evidence is unavailable, say so.
"""


async def run_live_research(job: MarketGapJob) -> tuple[str, str | None]:
    if not ABACUS_API_KEY:
        raise HTTPException(status_code=503, detail="ABACUS_API_KEY is not available")

    payload = {
        "model": RESEARCH_MODEL,
        "input": build_prompt(job),
        "tools": [{"type": "web_search"}],
        "store": False,
    }

    async with httpx.AsyncClient(timeout=180) as client:
        response = await client.post(
            RESPONSES_URL,
            headers={
                "Authorization": "Bearer " + ABACUS_API_KEY,
                "Content-Type": "application/json",
            },
            json=payload,
        )

    if response.status_code >= 400:
        detail = await response.aread()
        raise RuntimeError(
            "Responses API failed: "
            + str(response.status_code)
            + " "
            + detail.decode("utf-8", errors="ignore")[:500]
        )

    data = response.json()
    report = extract_response_text(data)
    if len(report) < 40:
        raise RuntimeError("Responses API returned an empty research report")

    run_id = data.get("id")
    return report[:120000], run_id if isinstance(run_id, str) else None


async def run_fallback_research(job: MarketGapJob) -> tuple[str, str | None]:
    if not ABACUS_API_KEY:
        raise HTTPException(status_code=503, detail="ABACUS_API_KEY is not available")

    system = """You are Mansa Musa AI Market Gap Intelligence.
You do NOT have live web-search evidence in this fallback mode.
Do not state current competitor metrics, prices, revenue, rankings, social counts or market leadership as verified.
Produce a strategy-only report and clearly mark every current-market statement that still needs live verification."""

    async with httpx.AsyncClient(timeout=120) as client:
        response = await client.post(
            CHAT_URL,
            headers={
                "Authorization": "Bearer " + ABACUS_API_KEY,
                "Content-Type": "application/json",
            },
            json={
                "model": "route-llm",
                "temperature": 0.2,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": build_prompt(job)},
                ],
            },
        )

    if response.status_code >= 400:
        raise HTTPException(status_code=502, detail="Abacus fallback analysis failed")

    data = response.json()
    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
    if not isinstance(content, str) or len(content.strip()) < 40:
        raise HTTPException(status_code=502, detail="Abacus fallback returned an empty report")

    run_id = data.get("id")
    return content[:120000], run_id if isinstance(run_id, str) else None


@app.get("/health")
async def health(authorization: str | None = Header(default=None)) -> dict[str, Any]:
    check_auth(authorization)
    return {
        "ok": True,
        "service": "mansa-market-gap-worker",
        "abacus_api_key": bool(ABACUS_API_KEY),
        "research_model": RESEARCH_MODEL,
        "live_web_search": True,
    }


@app.post("/market-gap")
async def market_gap(
    job: MarketGapJob,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    check_auth(authorization)

    if job.job != "mansa-market-gap":
        raise HTTPException(status_code=400, detail="Unsupported job")

    try:
        report, run_id = await run_live_research(job)
        return {
            "runId": run_id,
            "report": report,
            "liveSearch": True,
            "source": "abacus-responses-web-search",
        }
    except Exception as live_error:
        print("[market-gap] live research failed", repr(live_error))
        report, run_id = await run_fallback_research(job)
        return {
            "runId": run_id,
            "report": report,
            "liveSearch": False,
            "source": "abacus-routellm-fallback",
            "warning": "Live web search was unavailable; current-market facts require verification.",
        }
