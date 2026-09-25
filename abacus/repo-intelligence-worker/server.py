import os
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


class RepoJob(BaseModel):
    job: str
    version: int = 1
    repository: dict[str, Any]
    treeSummary: dict[str, Any]
    focus: str | None = Field(default=None, max_length=1200)
    context: str = Field(min_length=20, max_length=80000)


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


class SuperTask(BaseModel):
    job: str
    version: int = 1
    taskId: str = Field(min_length=1, max_length=120)
    lane: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=240)
    objective: str = Field(min_length=1, max_length=4000)
    goal: str = Field(min_length=5, max_length=8000)
    context: str = Field(default="", max_length=80000)


@app.post("/task")
async def super_task(
    job: SuperTask,
    authorization: str | None = Header(default=None),
) -> dict[str, Any]:
    check_auth(authorization)

    if job.job != "mansa-super-task":
        raise HTTPException(status_code=400, detail="Unsupported job")
    if not ABACUS_API_KEY:
        raise HTTPException(status_code=503, detail="ABACUS_API_KEY is not available")

    system = """You are an Abacus Supercomputer specialist worker inside Mansa Musa AI.
Complete only the assigned specialist task. Use the supplied goal, objective and context.
Be evidence-aware: distinguish facts, inference and unknowns.
Never claim access to systems or data that were not supplied.
Never request, expose or reproduce credentials, tokens, passwords or private keys.
For consequential external actions, recommend a draft and approval gate; do not claim execution.
Return concise but substantial Markdown for the synthesis judge."""

    user_content = "\n".join(
        [
            "Task ID: " + job.taskId,
            "Lane: " + job.lane,
            "Title: " + job.title,
            "Master goal: " + job.goal,
            "Objective: " + job.objective,
            "",
            "Context:",
            job.context or "No additional context supplied.",
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
        raise HTTPException(status_code=502, detail="RouteLLM returned an empty task result")

    return {
        "runId": payload.get("id"),
        "taskId": job.taskId,
        "result": content[:120000],
    }
