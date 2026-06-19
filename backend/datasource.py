"""Single source of truth for the analytics agents.

Each getter tries Supabase first (via store), and falls back to representative demo
data when the table is empty — so the OS produces meaningful output on day one and
seamlessly switches to live data as you populate the database. Stripe revenue is
pulled live when a restricted key is present.
"""
from __future__ import annotations

from . import store
from .connectors import stripe_conn


# ── live reads (empty -> demo) ────────────────────────────────────────────────
def get_menu_items() -> list[dict]:
    rows = store.recent("menu_performance", 200) or store.recent("menu_items", 200)
    items = [r for r in rows if r.get("units_sold") is not None]
    return items or DEMO_MENU


def get_inventory() -> list[dict]:
    rows = store.recent("inventory", 500)
    items = [{"item": r.get("item"), "on_hand": r.get("on_hand", 0),
              "par_level": r.get("par_level", 0), "unit": r.get("unit", ""),
              "daily_usage": r.get("daily_usage", 0), "lead_time_days": r.get("lead_time_days", 0),
              "unit_cost": r.get("unit_cost", 0)} for r in rows if r.get("item")]
    return items or DEMO_INVENTORY


def get_customers() -> list[dict]:
    rows = store.recent("customer_rfm", 1000)
    items = [r for r in rows if r.get("recency_days") is not None]
    return items or DEMO_CUSTOMERS


def get_shifts() -> list[dict]:
    rows = store.recent("shifts", 200)
    items = [{"name": r.get("role", "staff"), "hours": r.get("hours", 0), "rate": r.get("rate", 0)}
             for r in rows if r.get("hours")]
    return items or DEMO_SHIFTS


def get_covers_history() -> list[dict]:
    rows = store.recent("covers_history", 400)
    items = [r for r in rows if r.get("weekday") and r.get("covers") is not None]
    return items or DEMO_HISTORY


def get_finance(days: int = 30) -> dict:
    """Real revenue from Stripe when available; costs from KPIs/estimates otherwise."""
    rev = stripe_conn.revenue(days)
    if rev.get("status") == "ok" and rev["gross_revenue"] > 0:
        gross = rev["gross_revenue"]
        # cost ratios fall back to industry benchmarks until live COGS/payroll feeds exist
        return {"revenue": gross, "cogs": round(gross * 0.31, 2),
                "labour": round(gross * 0.32, 2), "opex": round(gross * 0.20, 2),
                "_source": "stripe"}
    return {**DEMO_FINANCE, "_source": "demo"}


def get_avg_spend() -> float:
    orders = store.recent("orders", 500)
    totals = [o["total"] for o in orders if o.get("total")]
    covers = sum(o.get("covers", 0) for o in orders) or len(totals)
    return round(sum(totals) / covers, 2) if covers else 37.0


def _has_rows(table: str, predicate=None) -> bool:
    rows = store.recent(table, 5)
    if predicate:
        rows = [r for r in rows if predicate(r)]
    return len(rows) > 0


def source_status() -> dict:
    """Report whether each analytic is running on LIVE data or the demo fallback,
    so the dashboard can show an honest badge."""
    stripe_live = stripe_conn.revenue(1).get("status") == "ok"
    checks = {
        "menu": _has_rows("menu_performance", lambda r: r.get("units_sold")) or _has_rows("menu_items"),
        "inventory": _has_rows("inventory"),
        "customers": _has_rows("customer_rfm", lambda r: r.get("recency_days") is not None),
        "forecast": _has_rows("covers_history", lambda r: r.get("covers") is not None),
        "labour": _has_rows("shifts", lambda r: r.get("hours")),
        "finance": stripe_live,
    }
    return {k: ("live" if v else "demo") for k, v in checks.items()}


# ── demo fallbacks (kept here so live code has no demo branches) ───────────────
DEMO_MENU = [
    {"name": "Jerk Chicken", "units_sold": 340, "price": 9.5, "food_cost": 2.8},
    {"name": "Curry Goat", "units_sold": 180, "price": 10.5, "food_cost": 4.2},
    {"name": "Oxtail & Butter Beans", "units_sold": 150, "price": 11.5, "food_cost": 5.3},
    {"name": "Brown Stew Chicken", "units_sold": 120, "price": 9.5, "food_cost": 3.0},
    {"name": "Ackee & Saltfish", "units_sold": 55, "price": 10.0, "food_cost": 4.8},
    {"name": "Festival & Fried Plantain", "units_sold": 210, "price": 3.5, "food_cost": 0.8},
]
DEMO_INVENTORY = [
    {"item": "Rice (25kg)", "on_hand": 1, "par_level": 3, "unit": "bag", "daily_usage": 0.6, "lead_time_days": 2, "unit_cost": 28},
    {"item": "Chicken thigh", "on_hand": 8, "par_level": 20, "unit": "kg", "daily_usage": 6, "lead_time_days": 1, "unit_cost": 4.2},
    {"item": "Palm oil", "on_hand": 0, "par_level": 4, "unit": "L", "daily_usage": 1, "lead_time_days": 3, "unit_cost": 5.5},
    {"item": "Plantain", "on_hand": 30, "par_level": 25, "unit": "kg", "daily_usage": 5, "lead_time_days": 1, "unit_cost": 1.8},
]
DEMO_CUSTOMERS = [
    {"name": "Okafor", "recency_days": 5, "frequency": 22, "monetary": 1850},
    {"name": "Adeyemi", "recency_days": 80, "frequency": 14, "monetary": 920},
    {"name": "Bello", "recency_days": 3, "frequency": 2, "monetary": 88},
    {"name": "Mensah", "recency_days": 200, "frequency": 1, "monetary": 40},
    {"name": "Diallo", "recency_days": 12, "frequency": 9, "monetary": 610},
    {"name": "Owusu", "recency_days": 140, "frequency": 18, "monetary": 1300},
]
DEMO_SHIFTS = [
    {"name": "Server A", "hours": 8, "rate": 12.5}, {"name": "Server B", "hours": 8, "rate": 12.5},
    {"name": "Chef", "hours": 9, "rate": 18}, {"name": "Commis", "hours": 9, "rate": 11.5},
    {"name": "KP", "hours": 6, "rate": 11},
]
_BASE = {"Mon": 40, "Tue": 45, "Wed": 55, "Thu": 70, "Fri": 110, "Sat": 130, "Sun": 85}
DEMO_HISTORY = [{"weekday": d, "covers": c + (w * 2)} for w in range(4) for d, c in _BASE.items()]
DEMO_FINANCE = {"revenue": 68000, "cogs": 21000, "labour": 22000, "opex": 14000}
