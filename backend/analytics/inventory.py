"""Inventory: reorder suggestions, usage variance, waste, stock value.

Theoretical usage = what recipes say you should have used for the covers sold.
Actual usage    = opening + purchases - closing. Variance = waste/theft/over-portioning.
Variance > 3-5% of usage is worth investigating.
"""
from __future__ import annotations


def reorder_list(items: list[dict]) -> list[dict]:
    """items: [{item, on_hand, par_level, unit, daily_usage?, lead_time_days?}].
    Suggests order quantity to return to par, covering lead-time demand."""
    out = []
    for i in items:
        on_hand, par = i["on_hand"], i["par_level"]
        buffer = i.get("daily_usage", 0) * i.get("lead_time_days", 0)
        target = par + buffer
        if on_hand <= par:
            out.append({"item": i["item"], "unit": i.get("unit", ""),
                        "on_hand": on_hand, "par_level": par,
                        "order_qty": round(max(target - on_hand, 0), 2),
                        "urgency": "out" if on_hand <= 0 else
                                   "critical" if on_hand < par * 0.5 else "low"})
    return sorted(out, key=lambda x: {"out": 0, "critical": 1, "low": 2}[x["urgency"]])


def usage_variance(opening: float, purchases: float, closing: float,
                   theoretical_usage: float) -> dict:
    actual = opening + purchases - closing
    var = actual - theoretical_usage
    var_pct = round(var / theoretical_usage * 100, 1) if theoretical_usage else 0
    return {"actual_usage": round(actual, 2), "theoretical_usage": round(theoretical_usage, 2),
            "variance": round(var, 2), "variance_pct": var_pct,
            "flag": "investigate" if abs(var_pct) > 5 else "ok"}


def stock_value(items: list[dict]) -> float:
    """items: [{on_hand, unit_cost}]"""
    return round(sum(i["on_hand"] * i.get("unit_cost", 0) for i in items), 2)


def waste_pct(waste_value: float, cogs: float) -> float:
    return round(waste_value / cogs * 100, 1) if cogs else 0.0
