"""The Orchestrator — finds enabled agents, runs them (optionally filtered by
schedule slot or team), and aggregates their output."""
from __future__ import annotations

from . import store, registry


def run_agent(name: str, context: dict | None = None) -> dict:
    cfg = next((c for c in registry.load_configs() if c.name == name), None)
    if not cfg:
        return {"error": f"unknown agent: {name}"}
    return registry.build_agent(cfg).run(context or {})


def run_slot(slot: str, context: dict | None = None) -> list[dict]:
    """Run every enabled agent whose schedule == slot (e.g. '09:00')."""
    results = []
    for cfg in registry.enabled_agents():
        if cfg.schedule == slot:
            results.append(registry.build_agent(cfg).run(context or {}))
    store.log("Orchestrator", f"ran slot {slot}", payload={"count": len(results)})
    return results


def run_team(team: str, context: dict | None = None) -> list[dict]:
    results = [registry.build_agent(c).run(context or {})
               for c in registry.enabled_agents() if c.team == team]
    store.log("Orchestrator", f"ran team {team}", payload={"count": len(results)})
    return results


def status() -> dict:
    cfgs = registry.load_configs()
    return {
        "total_agents": len(cfgs),
        "enabled": [c.name for c in cfgs if c.enabled],
        "by_team": {t: sum(1 for c in cfgs if c.team == t)
                    for t in sorted({c.team for c in cfgs})},
    }
