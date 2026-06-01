"""Daily workflow for Mansa Musa AI OS.

The day's rhythm (matches the dashboard):
  06:00  Operations  -> Stock Controller + Reservation  -> morning briefing
  09:00  Marketing   -> Instagram + Facebook drafts
  12:00  Reputation  -> Review Response drafts
  15:00  Revenue     -> sales analysis + recommendations
  21:00  Closing     -> Dashboard summary + next-day actions

Run continuously:        python scheduler/daily_workflow.py
Run one slot immediately: python scheduler/daily_workflow.py --run-now 09:00
Named shortcuts:         morning_briefing | marketing | reviews | revenue | closing
"""
from __future__ import annotations
import sys, os
from dotenv import load_dotenv
load_dotenv()

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from backend import orchestrator  # noqa: E402

SLOTS = ["06:00", "09:00", "12:00", "15:00", "21:00"]
NAMED = {
    "morning_briefing": "06:00",
    "marketing": "09:00",
    "reviews": "12:00",
    "revenue": "15:00",
    "closing": "21:00",
}


def run_review_autoreply():
    """Poll connected review sources and auto-reply / queue per the autonomy policy."""
    from backend import automation
    print("\n=== review auto-reply ===")
    for r in automation.poll_and_reply_reviews():
        print(f"  {r['channel']}: {r['action']} — {r['reason']}")


def run_slot(slot: str):
    print(f"\n=== {slot} ===")
    results = orchestrator.run_slot(slot)
    if not results:
        print("(no enabled agents in this slot)")
    for r in results:
        print(f"\n--- {r['agent']} [{r.get('status')}] {r.get('note','')} ---")
        print(r["output"][:1200])


def run_forever():
    from apscheduler.schedulers.blocking import BlockingScheduler
    sched = BlockingScheduler(timezone=os.getenv("RESTAURANT_TIMEZONE", "Europe/London"))
    for slot in SLOTS:
        hour, minute = map(int, slot.split(":"))
        sched.add_job(run_slot, "cron", hour=hour, minute=minute, args=[slot], id=slot)
    print("Mansa Musa AI OS scheduler started. Slots:", ", ".join(SLOTS))
    sched.start()


if __name__ == "__main__":
    if "--run-now" in sys.argv:
        arg = sys.argv[sys.argv.index("--run-now") + 1]
        if arg in ("review_autoreply", "autoreply"):
            run_review_autoreply()
        else:
            run_slot(NAMED.get(arg, arg))
    else:
        run_forever()
