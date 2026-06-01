"""Reservation agent — reviews today's bookings, flags risks (overbooking, large
parties, no-show-prone slots, VIPs) and prepares the front-of-house brief."""
from __future__ import annotations
import os

from ..base_agent import BaseAgent
from .. import store


class ReservationAgent(BaseAgent):
    def system_prompt(self) -> str:
        return (
            f"You run reservations for {os.getenv('RESTAURANT_NAME')}. From today's bookings, "
            "produce a front-of-house brief: total covers by slot, large parties to prep, VIPs "
            "to greet by name, likely pinch points, and any double-booking risk. Bullet points."
        )

    def build_task(self, context: dict) -> str:
        bookings = context.get("bookings") or self._demo_bookings()
        lines = "\n".join(
            f"- {b['time']} | party {b['party']} | {b['name']}{' (VIP)' if b.get('vip') else ''}"
            for b in bookings
        )
        return f"Today's bookings:\n{lines}"

    def run(self, context: dict | None = None) -> dict:
        result = super().run(context)
        result["note"] = "Front-of-house brief ready for the 06:00 morning briefing."
        store.log(self.cfg.name, "foh_brief_ready")
        return result

    @staticmethod
    def _demo_bookings():
        return [
            {"time": "18:30", "party": 2, "name": "Adeyemi"},
            {"time": "19:00", "party": 8, "name": "Okafor", "vip": True},
            {"time": "20:00", "party": 4, "name": "Bello"},
        ]
