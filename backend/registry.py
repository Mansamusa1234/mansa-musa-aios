"""Loads config/agents.yaml into AgentConfig objects and instantiates handlers."""
from __future__ import annotations
import os
import yaml

from .base_agent import AgentConfig
from .agents import HANDLERS

_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "agents.yaml")


def load_configs() -> list[AgentConfig]:
    with open(_CONFIG_PATH) as f:
        data = yaml.safe_load(f)
    defaults = data.get("defaults", {})
    out: list[AgentConfig] = []
    for layer_name, layer in data["layers"].items():
        team = layer["team"]
        for a in layer["agents"]:
            merged = {**defaults, **a, "layer": layer_name, "team": team}
            out.append(AgentConfig(
                name=merged["name"],
                layer=layer_name,
                team=team,
                handler=merged.get("handler", "GenericAgent"),
                enabled=merged.get("enabled", False),
                requires_approval=merged.get("requires_approval", False),
                auto_publish=merged.get("auto_publish", False),
                schedule=merged.get("schedule"),
            ))
    return out


def build_agent(cfg: AgentConfig):
    handler_cls = HANDLERS.get(cfg.handler, HANDLERS["GenericAgent"])
    return handler_cls(cfg)


def enabled_agents():
    return [c for c in load_configs() if c.enabled]
