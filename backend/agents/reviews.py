"""Review Response agent — reads recent reviews (Google / Tripadvisor / Facebook)
and drafts replies. Replies are queued for approval by default; negative reviews
ALWAYS require a human before sending."""
from __future__ import annotations
import os

from ..base_agent import BaseAgent
from .. import store, connectors


class ReviewAgent(BaseAgent):
    def system_prompt(self) -> str:
        return (
            f"You write public review replies for {os.getenv('RESTAURANT_NAME')}. "
            "Reply in the owner's voice: gracious, specific, never defensive. Thank by name, "
            "reference a detail from the review, invite them back. For complaints, apologise "
            "sincerely, take it offline (offer a direct contact), never argue in public."
        )

    def build_task(self, context: dict) -> str:
        reviews = context.get("reviews") or self._fetch_reviews()
        lines = "\n".join(f"- [{r['source']} {r.get('stars')}*] {r['text']}" for r in reviews)
        return f"Draft a reply for each review:\n{lines}"

    def _fetch_reviews(self):
        """Pull live Tripadvisor reviews when the API key is set; else demo."""
        ta = connectors.REVIEW_SOURCES["tripadvisor"]()
        if ta.get("status") == "ok" and ta.get("reviews"):
            for r in ta["reviews"]:
                store.insert("reviews", {"source": "tripadvisor", "stars": r.get("stars"),
                                         "author": r.get("author"), "body": r.get("text"),
                                         "reply_status": "drafted"})
            return ta["reviews"]
        return self._demo_reviews()

    def run(self, context: dict | None = None) -> dict:
        result = super().run(context)
        # Force approval for anything that might be a complaint.
        result["requires_approval"] = True
        result["note"] = "Replies drafted. All review replies require human approval before posting."
        store.log(self.cfg.name, "drafted_review_replies")
        return result

    @staticmethod
    def _demo_reviews():
        return [
            {"source": "Google", "stars": 5, "text": "Best jollof in the city, lovely staff."},
            {"source": "Tripadvisor", "stars": 3, "text": "Food great but we waited 40 mins for a table we booked."},
        ]
