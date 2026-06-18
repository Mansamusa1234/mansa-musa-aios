"""Finance: P&L, prime cost, break-even, cashflow.

Benchmarks (full service): food cost 28-35%, labour 28-35%,
PRIME COST (food+bev+labour) target <= 60-65% of revenue. Net profit 5-15%.
"""
from __future__ import annotations


def pnl(revenue: float, cogs: float, labour: float, opex: float) -> dict:
    gross = revenue - cogs
    prime = cogs + labour
    operating = gross - labour - opex
    pct = lambda x: round(x / revenue * 100, 1) if revenue else 0.0
    return {
        "revenue": round(revenue, 2),
        "cogs": round(cogs, 2),
        "labour": round(labour, 2),
        "opex": round(opex, 2),
        "gross_profit": round(gross, 2),
        "gross_margin_pct": pct(gross),
        "prime_cost": round(prime, 2),
        "prime_cost_pct": pct(prime),
        "operating_profit": round(operating, 2),
        "net_margin_pct": pct(operating),
        "prime_cost_health": ("good" if pct(prime) <= 60 else
                              "watch" if pct(prime) <= 65 else "high"),
    }


def break_even(fixed_costs: float, revenue: float, variable_costs: float) -> dict:
    """Monthly break-even revenue from a contribution-margin ratio."""
    cm_ratio = (revenue - variable_costs) / revenue if revenue else 0
    be = fixed_costs / cm_ratio if cm_ratio else 0
    return {
        "contribution_margin_ratio": round(cm_ratio, 3),
        "break_even_revenue": round(be, 2),
        "margin_of_safety_pct": round((revenue - be) / revenue * 100, 1) if revenue else 0,
    }


def cashflow_projection(starting_balance: float, weeks: list[dict]) -> list[dict]:
    """weeks: [{label, inflow, outflow}] -> running balance per week."""
    bal = starting_balance
    rows = []
    for w in weeks:
        bal += w.get("inflow", 0) - w.get("outflow", 0)
        rows.append({"week": w["label"], "inflow": w.get("inflow", 0),
                     "outflow": w.get("outflow", 0), "closing_balance": round(bal, 2),
                     "alert": "negative" if bal < 0 else None})
    return rows
