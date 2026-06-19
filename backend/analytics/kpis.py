"""Headline KPI computation — the numbers the executive dashboard shows."""
from __future__ import annotations


def daily_kpis(covers: int, revenue: float, labour_cost: float, cogs: float,
               no_shows: int, bookings: int, new_customers: int = 0,
               repeat_customers: int = 0) -> dict:
    avg_spend = round(revenue / covers, 2) if covers else 0
    pct = lambda x, base: round(x / base * 100, 1) if base else 0.0
    return {
        "covers": covers,
        "revenue": round(revenue, 2),
        "avg_spend": avg_spend,
        "food_cost_pct": pct(cogs, revenue),
        "labour_pct": pct(labour_cost, revenue),
        "prime_cost_pct": pct(cogs + labour_cost, revenue),
        "no_show_rate_pct": pct(no_shows, bookings),
        "repeat_rate_pct": pct(repeat_customers, max(new_customers + repeat_customers, 1)),
        "health": _health(pct(cogs + labour_cost, revenue), pct(no_shows, bookings)),
    }


def _health(prime_pct: float, no_show_pct: float) -> str:
    if prime_pct <= 60 and no_show_pct <= 5:
        return "strong"
    if prime_pct <= 67 and no_show_pct <= 10:
        return "ok"
    return "attention"
