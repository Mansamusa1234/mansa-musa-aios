"""Labour analytics: cost %, sales per labour hour, schedule cost vs forecast.

Benchmarks: labour 28-35% of revenue; sales per labour hour > ~£35 (full service).
"""
from __future__ import annotations


def schedule_cost(shifts: list[dict]) -> dict:
    """shifts: [{name, hours, rate}]."""
    total_hours = sum(s["hours"] for s in shifts)
    total_cost = sum(s["hours"] * s["rate"] for s in shifts)
    return {"total_hours": round(total_hours, 1), "labour_cost": round(total_cost, 2)}


def labour_cost_pct(labour_cost: float, revenue: float) -> float:
    return round(labour_cost / revenue * 100, 1) if revenue else 0.0


def sales_per_labour_hour(revenue: float, labour_hours: float) -> float:
    return round(revenue / labour_hours, 2) if labour_hours else 0.0


def schedule_vs_forecast(forecast_revenue: float, shifts: list[dict],
                         target_labour_pct: float = 30.0) -> dict:
    sc = schedule_cost(shifts)
    pct = labour_cost_pct(sc["labour_cost"], forecast_revenue)
    budget = round(forecast_revenue * target_labour_pct / 100, 2)
    return {**sc, "forecast_revenue": forecast_revenue,
            "labour_pct": pct, "labour_budget": budget,
            "variance": round(sc["labour_cost"] - budget, 2),
            "sales_per_labour_hour": sales_per_labour_hour(forecast_revenue, sc["total_hours"]),
            "flag": "over_budget" if sc["labour_cost"] > budget else "ok"}
