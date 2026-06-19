"""Auto-reply engine — the autonomous layer.

Given an inbound message (email, review, social comment/DM, WhatsApp/SMS), it:
  1. looks up the channel's autonomy policy (config/automation.yaml),
  2. checks guardrails (escalate keywords, star thresholds, quiet hours, master switch),
  3. drafts a reply in the brand voice,
  4. either SENDS it via the right connector (level 'auto') or QUEUES it for approval
     (level 'draft' / escalated), and logs everything to agent_actions.

Safety-first: if AUTO_REPLY_ENABLED is not 'true', every channel is forced to 'draft'.
"""
from __future__ import annotations
import os
from datetime import datetime
import yaml

from . import store
from .llm import complete
from . import connectors
from .connectors import email as email_conn, meta, whatsapp, sms

_POLICY_PATH = os.path.join(os.path.dirname(__file__), "..", "config", "automation.yaml")


def _policy() -> dict:
    with open(_POLICY_PATH) as f:
        return yaml.safe_load(f)


def _master_on() -> bool:
    return os.getenv("AUTO_REPLY_ENABLED", "false").lower() == "true"


def _in_quiet_hours(pol: dict) -> bool:
    q = pol.get("quiet_hours") or {}
    start, end = q.get("start"), q.get("end")
    if not (start and end):
        return False
    now = datetime.now().strftime("%H:%M")
    # window may wrap past midnight
    return (start <= now or now < end) if start > end else (start <= now < end)


def _decide(channel: str, msg: dict, pol: dict) -> tuple[str, str]:
    """Return (action, reason): action in {'auto','draft','off'}."""
    cfg = (pol.get("channels") or {}).get(channel)
    if not cfg:
        return "draft", f"no policy for '{channel}' (defaulting to draft)"
    level = cfg.get("level", "draft")
    if level == "off":
        return "off", "channel disabled"
    if not _master_on():
        return "draft", "AUTO_REPLY_ENABLED is false (global safe mode)"
    if _in_quiet_hours(pol):
        return "draft", "within quiet hours"

    g = cfg.get("guardrails") or {}
    text = (msg.get("text") or "").lower()
    for kw in g.get("escalate_keywords", []):
        if kw in text:
            return "draft", f"escalation keyword '{kw}' — needs a human"
    if "min_stars" in g and (msg.get("stars") or 0) < g["min_stars"]:
        return "draft", "below min_stars for auto"
    if "max_stars" in g and (msg.get("stars") or 5) <= g["max_stars"]:
        return "draft", "negative review — human approval required"
    return level, "within guardrails"


def _draft_reply(channel: str, msg: dict, pol: dict) -> str:
    g = ((pol.get("channels") or {}).get(channel) or {}).get("guardrails") or {}
    limit = g.get("max_words", 150)
    system = pol.get("voice", "Reply warmly and briefly.")
    who = msg.get("sender_name") or "there"
    ctx = f"Channel: {channel}. From: {who}. "
    if msg.get("stars"):
        ctx += f"Review rating: {msg['stars']}/5. "
    ctx += f"Their message:\n{msg.get('text','')}\n\nWrite the reply (max ~{limit} words)."
    return complete(system, ctx, max_tokens=300)


def _send(channel: str, msg: dict, reply: str) -> dict:
    """Route the reply to the correct official connector."""
    to = msg.get("reply_to") or msg.get("sender")
    if channel.startswith("email"):
        return email_conn.send_email(to, msg.get("subject", "Re: your message"), reply)
    if channel == "whatsapp_customer":
        return whatsapp.send_message(to, reply)
    if channel == "sms_customer":
        return sms.send_sms(to, reply)
    if channel.startswith("social") and msg.get("comment_id"):
        return meta.reply_to_review(msg["comment_id"], reply)   # FB comment/reply
    if channel.startswith("review") and msg.get("review_name"):
        from .connectors import google_business
        return google_business.reply_to_review(msg["review_name"], reply)
    return {"status": "blocked", "reason": f"no send route configured for {channel}"}


def handle_inbound(channel: str, msg: dict) -> dict:
    """Main entry point. msg keys (all optional except text):
       text, sender, sender_name, subject, stars, reply_to, comment_id, review_name."""
    pol = _policy()
    action, reason = _decide(channel, msg, pol)
    store.log("AutoReply", f"{channel}: {action}", payload={"reason": reason})

    if action == "off":
        return {"channel": channel, "action": "off", "reason": reason}

    reply = _draft_reply(channel, msg, pol)
    sent = None
    if action == "auto":
        sent = _send(channel, msg, reply)
        if sent.get("status") not in ("sent", "published"):
            action = "draft"  # send failed/blocked -> fall back to queue
            reason = f"send not completed ({sent.get('status')}); queued instead"

    store.insert("tasks", {
        "agent": "AutoReply",
        "title": f"{channel} reply to {msg.get('sender_name') or msg.get('sender') or 'customer'}",
        "detail": reply,
        "status": "done" if action == "auto" else "awaiting_approval",
        "requires_approval": action != "auto",
    })
    store.insert("agent_actions", {"agent": "AutoReply", "action": f"reply:{channel}",
                                   "target": msg.get("sender", ""),
                                   "status": "executed" if action == "auto" else "pending",
                                   "result": {"reply": reply, "reason": reason, "sent": sent}})
    return {"channel": channel, "action": action, "reason": reason,
            "reply": reply, "sent": sent}


def poll_and_reply_reviews() -> list[dict]:
    """Pull live reviews from connected sources and run each through the engine.
    Positive ones may auto-reply; negative ones are queued for a human."""
    results = []
    for source, fetch in connectors.REVIEW_SOURCES.items():
        data = fetch()
        if data.get("status") != "ok":
            continue
        for r in data.get("reviews", []):
            stars = r.get("stars") or 0
            channel = "review_positive" if stars >= 4 else "review_negative"
            results.append(handle_inbound(channel, {
                "text": r.get("text", ""), "sender_name": r.get("author"),
                "stars": stars, "review_name": r.get("review_name"),
            }))
    store.log("AutoReply", "polled reviews", payload={"handled": len(results)})
    return results
