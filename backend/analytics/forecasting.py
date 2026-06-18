"""Demand forecasting: covers & revenue prediction with weekday seasonality.

Simple, explainable, and good enough to drive staffing and prep:
  baseline = trailing moving average of covers
  forecast = baseline * weekday_seasonality_factor
"""
from __future__ import annotations
from statistics import mean

WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def weekday_factors(history: list[dict]) -> dict:
    """history: [{weekday, covers}] across several weeks -> factor per weekday."""
    overall = mean([h["covers"] for h in history]) if history else 0
    factors = {}
    for d in WEEKDAYS:
        vals = [h["covers"] for h in history if h["weekday"] == d]
        factors[d] = round((mean(vals) / overall), 2) if vals and overall else 1.0
    return factors


def forecast_week(history: list[dict], window: int = 28) -> list[dict]:
    recent = [h["covers"] for h in history][-window:]
    baseline = mean(recent) if recent else 0
    factors = weekday_factors(history)
    return [{"weekday": d, "forecast_covers": round(baseline * factors[d])}
            for d in WEEKDAYS]


def staffing_need(forecast_covers: int, covers_per_server: int = 16,
                  covers_per_kitchen: int = 25, min_foh: int = 2, min_boh: int = 2) -> dict:
    foh = max(min_foh, -(-forecast_covers // covers_per_server))   # ceil
    boh = max(min_boh, -(-forecast_covers // covers_per_kitchen))
    return {"forecast_covers": forecast_covers, "front_of_house": foh,
            "kitchen": boh, "total_staff": foh + boh}


def revenue_forecast(forecast_covers: int, avg_spend: float) -> float:
    return round(forecast_covers * avg_spend, 2)
