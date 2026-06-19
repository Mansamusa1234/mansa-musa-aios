"""Revenue agent — pulls the day's sales signals and writes a short analysis with
2-3 concrete recommendations. Read-only against Stripe (use a restricted key)."""
from __future__ import annotations
import os

from ..base_agent import BaseAgent
from .. import store


class RevenueAgent(BaseAgent):
    def system_prompt(self) -> str:
        return (
            f"You are the revenue analyst for {os.getenv('RESTAURANT_NAME')}. Given today's "
            "numbers, write a 5-line briefing: covers, revenue, average spend, the one thing "
            "that moved, and 2-3 specific actions for tomorrow (a special to push, a slow slot "
            "to fill, an upsell to train). Plain English, no fluff."
        )

    def build_task(self, context: dict) -> str:
        m = context.get("metrics") or self._demo_metrics()
        return (
            f"Covers: {m['covers']}, Revenue: {m['revenue']}, Avg spend: {m['avg_spend']}, "
            f"Bookings tomorrow: {m['bookings_tomorrow']}, Top item: {m['top_item']}."
        )

    def run(self, context: dict | None = None) -> dict:
        result = super().run(context)
        m = (context or {}).get("metrics") or self._demo_metrics()
        for name, value in (("daily_revenue", m["revenue"]), ("covers", m["covers"]),
                            ("avg_spend", m["avg_spend"])):
            store.insert("kpis", {"name": name, "value": value})
        result["note"] = "Briefing written and KPIs recorded."
        return result

    @staticmethod
    def _demo_metrics():
        return {"covers": 84, "revenue": 3120, "avg_spend": 37.1,
                "bookings_tomorrow": 22, "top_item": "Suya platter"}
