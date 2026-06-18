"""Marketing agent — drafts platform-ready content. Posts ONLY through official
APIs, and only when auto_publish is on AND ALLOW_AUTO_PUBLISH=true. Otherwise the
draft is stored as a campaign for human approval."""
from __future__ import annotations
import os

from ..base_agent import BaseAgent
from .. import store, connectors


class MarketingAgent(BaseAgent):
    def system_prompt(self) -> str:
        platform = self.cfg.name.replace(" Agent", "")
        return (
            f"You are the {platform} content lead for {os.getenv('RESTAURANT_NAME')}, an "
            "African cuisine kitchen & lounge. Write one ready-to-post piece for today: "
            "a hook, 2-3 lines of body, a clear call to action, and 5 relevant hashtags. "
            "Warm, vibrant, community-led tone. No emojis unless on-brand for the platform."
        )

    def build_task(self, context: dict) -> str:
        hint = context.get("theme", "today's special and tonight's atmosphere")
        return f"Create today's {self.cfg.name.replace(' Agent','')} post about: {hint}."

    def run(self, context: dict | None = None) -> dict:
        result = super().run(context)
        channel = self.cfg.name.replace(" Agent", "").lower()
        allow = os.getenv("ALLOW_AUTO_PUBLISH", "false").lower() == "true"
        media_url = (context or {}).get("media_url")

        published = None
        if self.cfg.auto_publish and allow:
            # Auto-publish path: push straight through the official API connector.
            published = connectors.publish(channel, result["output"], media_url)

        live = bool(published and published.get("status") in ("published", "sent"))
        store.insert("campaigns", {
            "channel": channel,
            "title": f"{channel} post",
            "body": result["output"],
            "status": "published" if live else "draft",
            "created_by_agent": self.cfg.name,
        })
        result["published"] = published
        if live:
            result["note"] = f"Posted to {channel} via official API (id {published.get('id')})."
        elif published:
            result["note"] = f"Auto-publish attempted but {channel} returned: {published}"
        else:
            result["note"] = ("Saved as DRAFT. Approve it in the dashboard, or set this agent's "
                              "auto_publish + ALLOW_AUTO_PUBLISH=true to post automatically.")
        return result
