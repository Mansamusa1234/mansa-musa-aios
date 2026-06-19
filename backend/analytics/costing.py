"""Recipe / plate costing.

Benchmarks: food cost target 28-35% of menu price for full service; beverages 18-24%.
"""
from __future__ import annotations


def plate_cost(ingredients: list[dict]) -> float:
    """ingredients: [{name, qty, unit_cost}]  ->  total cost of one plate."""
    return round(sum(i["qty"] * i["unit_cost"] for i in ingredients), 2)


def gross_profit(price: float, cost: float) -> float:
    return round(price - cost, 2)


def food_cost_pct(price: float, cost: float) -> float:
    return round(cost / price * 100, 1) if price else 0.0


def gp_pct(price: float, cost: float) -> float:
    """Gross profit margin %."""
    return round((price - cost) / price * 100, 1) if price else 0.0


def suggested_price(cost: float, target_food_cost_pct: float = 30.0,
                    round_to: float = 0.50) -> float:
    """Menu price that hits a target food-cost %, rounded to a tidy figure."""
    if target_food_cost_pct <= 0:
        return 0.0
    raw = cost / (target_food_cost_pct / 100)
    # round up to the nearest psychological price point
    stepped = round(raw / round_to) * round_to
    return round(max(stepped, raw), 2)


def cost_a_dish(name: str, ingredients: list[dict], price: float,
                target_fc: float = 30.0) -> dict:
    cost = plate_cost(ingredients)
    return {
        "dish": name,
        "plate_cost": cost,
        "menu_price": price,
        "gross_profit": gross_profit(price, cost),
        "food_cost_pct": food_cost_pct(price, cost),
        "gp_pct": gp_pct(price, cost),
        "suggested_price": suggested_price(cost, target_fc),
        "flag": "underpriced" if food_cost_pct(price, cost) > target_fc + 5 else "ok",
    }
