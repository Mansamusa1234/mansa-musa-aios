"""Base agent + generic fallback. Every one of the 99 agents is an instance of
either a specific subclass (the four worked examples) or GenericAgent, configured
purely from config/agents.yaml."""
from __future__ import annotations
import os
from dataclasses import dataclass, field

from . import store
from .llm import complete


@dataclass
class AgentConfig:
    name: str
    layer: str
    team: str
    handler: str = "GenericAgent"
    enabled: bool = False
    requires_approval: bool = False
    auto_publish: bool = False
    schedule: str | None = None


class BaseAgent:
    """Runs one unit of work: build a prompt, call the LLM, persist the result.
    Subclasses override `system_prompt` and `build_task`."""

    def __init__(self, cfg: AgentConfig):
        self.cfg = cfg

    # — overridable —
    def system_prompt(self) -> str:
        restaurant = os.getenv("RESTAURANT_NAME", "the restaurant")
        return (
            f"You are the '{self.cfg.name}' for {restaurant}, an African cuisine kitchen & lounge. "
            f"You are part of the {self.cfg.team} team. Be concrete, brief, and action-oriented. "
            "Output only what a busy operator can act on today."
        )

    def build_task(self, context: dict) -> str:
        return f"Do your job for today. Context: {context}"

    # — the loop every agent shares —
    def run(self, context: dict | None = None) -> dict:
        context = context or {}
        store.log(self.cfg.name, "run:start")
        output = complete(self.system_prompt(), self.build_task(context))

        status = "awaiting_approval" if self.cfg.requires_approval else "open"
        task = store.insert("tasks", {
            "agent": self.cfg.name,
            "title": f"{self.cfg.name} output",
            "detail": output,
            "status": status,
            "requires_approval": self.cfg.requires_approval,
        })
        store.log(self.cfg.name, "run:done", payload={"requires_approval": self.cfg.requires_approval})
        return {"agent": self.cfg.name, "status": status, "output": output, "task": task}


class GenericAgent(BaseAgent):
    """Default brain for any registry entry without a bespoke handler.
    Drafts and logs — never publishes. This is what lets you scale to 99 agents
    without writing 99 programs."""
    pass
