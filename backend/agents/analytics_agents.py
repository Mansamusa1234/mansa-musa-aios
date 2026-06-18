"""Agents that run the deterministic analytics engine, then ask the LLM to turn the
numbers into a short, plain-English briefing with actions. Numbers come from code
(reliable) over real data via datasource (Supabase/Stripe, demo fallback); narrative
comes from the model (readable)."""
from __future__ import annotations
import json

from ..base_agent import BaseAgent
from .. import store, datasource
from ..analytics import menu_engineering, inventory, finance, crm, forecasting, labor


class _AnalyticAgent(BaseAgent):
    """Compute -> store metrics -> narrate. Subclasses set compute()."""
    metric_label = "metrics"

    def compute(self, context: dict) -> dict:
        raise NotImplementedError

    def build_task(self, context: dict) -> str:
        metrics = self.compute(context)
        context["_metrics"] = metrics
        return (f"Here are today's computed {self.metric_label} as JSON. Write a tight briefing: "
                f"what it means and the top 2-3 actions. Be specific and numerate.\n\n"
                f"{json.dumps(metrics, indent=2, default=str)}")

    def run(self, context: dict | None = None) -> dict:
        context = context or {}
        result = super().run(context)
        store.insert("agent_actions", {"agent": self.cfg.name, "action": "analysis",
                                       "target": self.metric_label, "status": "executed",
                                       "result": context.get("_metrics", {})})
        result["metrics"] = context.get("_metrics", {})
        return result


class MenuEngineeringAgent(_AnalyticAgent):
    metric_label = "menu engineering matrix"

    def compute(self, context):
        items = context.get("menu_items") or datasource.get_menu_items()
        return menu_engineering.classify(items)


class InventoryAgent(_AnalyticAgent):
    metric_label = "inventory & reorder"

    def compute(self, context):
        items = context.get("inventory") or datasource.get_inventory()
        return {"reorder": inventory.reorder_list(items),
                "stock_value": inventory.stock_value(items)}


class FinanceAgent(_AnalyticAgent):
    metric_label = "P&L and prime cost"

    def compute(self, context):
        f = context.get("finance") or datasource.get_finance()
        source = f.pop("_source", "demo")
        out = finance.pnl(**f)
        out["_source"] = source
        return out


class CRMAgent(_AnalyticAgent):
    metric_label = "customer segments (RFM)"

    def compute(self, context):
        customers = context.get("customers") or datasource.get_customers()
        segged = crm.segment_customers(customers)
        counts = {}
        for c in segged:
            counts[c["segment"]] = counts.get(c["segment"], 0) + 1
        return {"segments": counts, "plays": crm.SEGMENT_PLAY, "sample": segged[:8]}


class ForecastAgent(_AnalyticAgent):
    metric_label = "demand forecast & staffing"

    def compute(self, context):
        history = context.get("covers_history") or datasource.get_covers_history()
        avg_spend = context.get("avg_spend") or datasource.get_avg_spend()
        week = forecasting.forecast_week(history)
        for d in week:
            d["forecast_revenue"] = forecasting.revenue_forecast(d["forecast_covers"], avg_spend)
            d.update({"staffing": forecasting.staffing_need(d["forecast_covers"])})
        return {"week": week}


class LabourAgent(_AnalyticAgent):
    metric_label = "labour cost vs forecast"

    def compute(self, context):
        shifts = context.get("shifts") or datasource.get_shifts()
        forecast_rev = context.get("forecast_revenue", 18000)
        return labor.schedule_vs_forecast(forecast_rev, shifts)
