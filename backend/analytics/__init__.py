"""Deterministic restaurant analytics engine.

These are pure functions over plain data structures (lists/dicts) — no LLM, no
network. They encode standard hospitality-industry formulas and benchmarks so the
agents can reason on real numbers instead of guessing. Each module documents its
target benchmarks (UK casual-dining / full-service norms)."""
from . import costing, menu_engineering, finance, inventory, crm, forecasting, labor, kpis  # noqa
