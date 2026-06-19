"""Menu engineering matrix (Kasavana & Smith).

Each item is scored on popularity (units sold) and profitability (unit margin),
then placed in one of four quadrants with a standard action:

  STAR       high popularity + high margin   -> protect, feature, hold price
  PLOWHORSE  high popularity + low  margin    -> raise price / cut cost / upsell sides
  PUZZLE     low  popularity + high margin    -> reposition, rename, promote, sample
  DOG        low  popularity + low  margin    -> rework or remove

Popularity threshold uses the classic 70%-of-average rule.
"""
from __future__ import annotations

ACTIONS = {
    "STAR": "Protect it. Keep recipe & price consistent, feature it, train staff to recommend.",
    "PLOWHORSE": "Popular but thin margin: nudge price up, trim portion/cost, or attach a high-margin side.",
    "PUZZLE": "Profitable but unloved: rename, reposition on the menu, add a photo, sample it to tables.",
    "DOG": "Low on both: rework the recipe, re-price, or remove to free menu space.",
}


def classify(items: list[dict], popularity_rule: float = 0.70) -> dict:
    """items: [{name, units_sold, price, food_cost}].

    Returns per-item classification plus a summary."""
    if not items:
        return {"items": [], "summary": {}}

    n = len(items)
    total_units = sum(i["units_sold"] for i in items) or 1
    avg_share = 1 / n
    pop_threshold = avg_share * popularity_rule  # share above this = "popular"
    margins = [(i["price"] - i["food_cost"]) for i in items]
    avg_margin = sum(margins) / n

    out = []
    for i in items:
        share = i["units_sold"] / total_units
        margin = i["price"] - i["food_cost"]
        high_pop = share >= pop_threshold
        high_margin = margin >= avg_margin
        quad = ("STAR" if high_pop and high_margin else
                "PLOWHORSE" if high_pop and not high_margin else
                "PUZZLE" if high_margin else "DOG")
        out.append({
            "name": i["name"],
            "units_sold": i["units_sold"],
            "menu_share_pct": round(share * 100, 1),
            "unit_margin": round(margin, 2),
            "class": quad,
            "action": ACTIONS[quad],
        })

    summary = {q: sum(1 for x in out if x["class"] == q)
               for q in ("STAR", "PLOWHORSE", "PUZZLE", "DOG")}
    summary["avg_margin"] = round(avg_margin, 2)
    return {"items": sorted(out, key=lambda x: -x["units_sold"]), "summary": summary}
