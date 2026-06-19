"""Intelligence + outbound-campaign agents.

CompetitorAgent / TrendAgent are LLM-reasoning agents (optionally fed scraped data
via context). CampaignAgent drafts an email/SMS campaign and, if approved + keys
present, sends to a target list through the email/sms connectors."""
from __future__ import annotations
import os

from ..base_agent import BaseAgent
from .. import store, connectors


class CompetitorAgent(BaseAgent):
    def system_prompt(self):
        return (
            f"You are the competitor-intelligence analyst for {os.getenv('RESTAURANT_NAME')}, "
            "an African kitchen & lounge. Given any provided competitor data (or your general "
            "knowledge of the local casual-dining market), produce a short competitive read: "
            "3 things rivals are doing well, 2 gaps Mansa Musa can exploit, 1 pricing/promo move."
        )

    def build_task(self, context):
        comps = context.get("competitors", "nearby African & Caribbean restaurants and lounges")
        return f"Analyse the competitive landscape around: {comps}. Keep it to 6 bullets."


class TrendAgent(BaseAgent):
    def system_prompt(self):
        return (
            f"You track food, social and event trends relevant to {os.getenv('RESTAURANT_NAME')}. "
            "Suggest 3 timely content/menu/event ideas tied to current trends, each with a one-line "
            "reason and the platform it suits best."
        )

    def build_task(self, context):
        return "What should we ride this week? Give 3 trend-led ideas."


class CampaignAgent(BaseAgent):
    """Drafts an email/SMS campaign. Sends only when auto_publish + ALLOW_AUTO_PUBLISH
    and a recipient list is supplied in context['recipients']."""
    def system_prompt(self):
        return (
            f"You write direct marketing for {os.getenv('RESTAURANT_NAME')}. Write a short, warm "
            "campaign for the given segment and occasion: a subject line and a 4-5 line body with "
            "one clear call to action. No spammy language."
        )

    def build_task(self, context):
        seg = context.get("segment", "loyal regulars")
        occasion = context.get("occasion", "this weekend's live highlife night")
        self._channel = context.get("channel", "email")
        return f"Write a {self._channel} campaign for '{seg}' about '{occasion}'."

    def run(self, context=None):
        context = context or {}
        result = super().run(context)
        channel = getattr(self, "_channel", context.get("channel", "email"))
        recipients = context.get("recipients", [])
        allow = os.getenv("ALLOW_AUTO_PUBLISH", "false").lower() == "true"
        sent = []
        messenger = connectors.MESSENGERS.get(channel)
        if self.cfg.auto_publish and allow and messenger and recipients:
            for to in recipients:
                sent.append(messenger(to, result["output"]))
        store.insert("campaigns", {"channel": channel, "title": f"{channel} campaign",
                                   "body": result["output"],
                                   "status": "sent" if sent else "draft",
                                   "created_by_agent": self.cfg.name})
        result["sent"] = sent
        result["note"] = (f"Sent to {len(sent)} recipient(s) via {channel}." if sent
                          else f"Drafted {channel} campaign (DRAFT — supply recipients + enable to send).")
        return result
