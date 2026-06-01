"""Supabase access. Degrades gracefully to an in-memory store when no
SUPABASE_URL is configured, so you can develop the whole flow offline."""
from __future__ import annotations
import os
from datetime import datetime, timezone

_memory: dict[str, list[dict]] = {}


def _client():
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY")
    if url and key:
        from supabase import create_client
        return create_client(url, key)
    return None


def insert(table: str, row: dict) -> dict:
    row = {**row, "created_at": datetime.now(timezone.utc).isoformat()}
    c = _client()
    if c:
        return c.table(table).insert(row).execute().data
    _memory.setdefault(table, []).append(row)
    return row


def recent(table: str, limit: int = 20) -> list[dict]:
    c = _client()
    if c:
        return (
            c.table(table).select("*").order("created_at", desc=True).limit(limit).execute().data
        )
    return list(reversed(_memory.get(table, [])))[:limit]


def log(agent: str, message: str, level: str = "info", payload: dict | None = None):
    insert("agent_logs", {"agent": agent, "level": level, "message": message, "payload": payload or {}})
