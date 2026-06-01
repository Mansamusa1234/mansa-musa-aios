"""FastAPI surface for the dashboard and manual triggers.

Run:  uvicorn backend.main:app --reload --port 8000
"""
from __future__ import annotations
import os
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import orchestrator, store, connectors, automation, datasource
from .connectors import whatsapp

app = FastAPI(title="Mansa Musa AI OS")
# Allowed browser origins. Add/remove domains here as you grow.
ALLOWED_ORIGINS = [
    "https://mansamusainitiative.co.uk",        # canonical site (Kings Heath, Birmingham)
    "https://www.mansamusainitiative.co.uk",
    "https://mansamusainitiative.com",          # 301-redirects to .co.uk, but allow direct hits too
    "https://www.mansamusainitiative.com",
    "http://localhost:8000",
    "null",  # lets you open the dashboard/site HTML directly from disk while testing
]
app.add_middleware(
    CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_methods=["*"], allow_headers=["*"],
)


class RunBody(BaseModel):
    context: dict | None = None


@app.get("/")
def root():
    return {"service": "Mansa Musa AI OS", "ok": True}


@app.get("/brand")
def brand():
    """White-label branding for the dashboard/site. A reseller rebrands a whole client
    deployment by setting these env vars — no code changes."""
    return {
        "name": os.getenv("BRAND_NAME", os.getenv("RESTAURANT_NAME", "Mansa Musa AI OS")),
        "tagline": os.getenv("BRAND_TAGLINE", "Your restaurant, run by AI."),
        "accent": os.getenv("BRAND_ACCENT", "#c79a3b"),
        "domain": os.getenv("BRAND_DOMAIN", ""),
        "powered_by": os.getenv("BRAND_POWERED_BY", "Mansa Musa AI OS"),
    }


@app.get("/health")
def health():
    """Liveness probe for Render/Docker healthchecks."""
    import os
    return {"status": "healthy",
            "llm": bool(os.getenv("OPENAI_API_KEY") or os.getenv("ANTHROPIC_API_KEY")),
            "supabase": bool(os.getenv("SUPABASE_URL")),
            "agents": orchestrator.status()["total_agents"]}


@app.get("/status")
def status():
    return orchestrator.status()


@app.post("/agents/{name}/run")
def run_agent(name: str, body: RunBody | None = None):
    return orchestrator.run_agent(name, body.context if body else None)


@app.post("/slots/{slot}/run")
def run_slot(slot: str, body: RunBody | None = None):
    return {"results": orchestrator.run_slot(slot, body.context if body else None)}


@app.post("/teams/{team}/run")
def run_team(team: str, body: RunBody | None = None):
    return {"results": orchestrator.run_team(team, body.context if body else None)}


@app.get("/data/status")
def data_status():
    """Per-analytic live-vs-demo status — powers the dashboard's LIVE/DEMO badge."""
    s = datasource.source_status()
    return {"sources": s, "live_count": sum(v == "live" for v in s.values()), "total": len(s)}


class OrderItem(BaseModel):
    menu_item_id: str | None = None
    name: str | None = None
    qty: int = 1
    unit_price: float | None = None


class OrderBody(BaseModel):
    total: float
    covers: int = 1
    customer_id: str | None = None
    items: list[OrderItem] = []


@app.post("/orders")
def record_order(b: OrderBody):
    """Record a real sale (e.g. pushed from a POS or till). Feeds the live views:
    revenue, menu engineering, forecasting and CRM all update from this."""
    order = store.insert("orders", {"total": b.total, "covers": b.covers,
                                    "customer_id": b.customer_id})
    oid = order.get("id") if isinstance(order, dict) else None
    for it in b.items:
        store.insert("order_items", {"order_id": oid, "menu_item_id": it.menu_item_id,
                                     "qty": it.qty, "unit_price": it.unit_price})
    return {"status": "recorded", "order": order, "items": len(b.items)}


@app.get("/analytics/{name}")
def analytics(name: str):
    """On-demand analytics for the dashboard tabs. name in:
    menu | inventory | finance | crm | forecast | labour"""
    from .agents.analytics_agents import (
        MenuEngineeringAgent, InventoryAgent, FinanceAgent,
        CRMAgent, ForecastAgent, LabourAgent)
    from .base_agent import AgentConfig
    mapping = {"menu": MenuEngineeringAgent, "inventory": InventoryAgent,
               "finance": FinanceAgent, "crm": CRMAgent,
               "forecast": ForecastAgent, "labour": LabourAgent}
    cls = mapping.get(name)
    if not cls:
        return {"error": f"unknown analytic: {name}"}
    agent = cls(AgentConfig(name=name, layer="9_intelligence", team="intelligence"))
    return agent.compute({})


class BookingBody(BaseModel):
    name: str
    party_size: int
    starts_at: str          # ISO datetime from the website form
    phone: str | None = None
    email: str | None = None
    notes: str | None = None


@app.post("/reservations")
def create_reservation(b: BookingBody):
    """Public booking endpoint the website form posts to. Stores the reservation and
    raises a task so the Reservation agent can prep the front-of-house brief."""
    res = store.insert("reservations", {
        "customer_id": None, "party_size": b.party_size, "starts_at": b.starts_at,
        "status": "booked", "source": "website",
        "notes": f"{b.name} · {b.phone or ''} {b.email or ''} · {b.notes or ''}".strip(),
    })
    store.insert("tasks", {"agent": "Reservation Agent",
                           "title": f"New website booking — {b.name} x{b.party_size}",
                           "detail": f"{b.starts_at} · {b.phone or b.email or 'no contact'}",
                           "status": "open"})
    store.log("Reservation Agent", "website_booking", payload={"name": b.name, "party": b.party_size})
    return {"status": "confirmed", "reservation": res}


class InboundBody(BaseModel):
    channel: str                       # email_customer | review_positive | social_comment ...
    text: str
    sender: str | None = None
    sender_name: str | None = None
    subject: str | None = None
    stars: int | None = None
    reply_to: str | None = None
    comment_id: str | None = None
    review_name: str | None = None


def _check_webhook_secret(secret: str | None):
    expected = os.getenv("WEBHOOK_SECRET")
    if expected and secret != expected:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="bad webhook secret")


@app.post("/inbound")
def inbound(b: InboundBody, x_webhook_secret: str | None = Header(default=None)):
    """Universal inbound hook: email replies, reviews, social comments/DMs, WhatsApp/SMS.
    The auto-reply engine decides whether to send automatically or queue for approval."""
    _check_webhook_secret(x_webhook_secret)
    return automation.handle_inbound(b.channel, b.model_dump())


class PaymentLinkBody(BaseModel):
    description: str
    amount_gbp: float
    quantity: int = 1


@app.post("/payments/link")
def payment_link(b: PaymentLinkBody):
    """Create a Stripe Payment Link for a catering deposit / event ticket / pre-order."""
    from .connectors import stripe_pay
    res = stripe_pay.create_payment_link(b.description, b.amount_gbp, b.quantity)
    store.insert("agent_actions", {"agent": "Payments", "action": "payment_link",
                                   "target": b.description, "status": res.get("status"),
                                   "result": res})
    return res


@app.get("/automation/policy")
def automation_policy():
    """Show the current autonomy settings (for the dashboard control panel)."""
    return {"auto_reply_enabled": os.getenv("AUTO_REPLY_ENABLED", "false"),
            "policy": automation._policy()}


@app.get("/tasks")
def tasks():
    return store.recent("tasks", 50)


@app.get("/campaigns")
def campaigns():
    return store.recent("campaigns", 50)


@app.get("/logs")
def logs():
    return store.recent("agent_logs", 50)


class PublishBody(BaseModel):
    channel: str
    content: str
    media_url: str | None = None


@app.post("/publish")
def publish(body: PublishBody):
    """Approve-and-publish: push a reviewed draft live through the official API."""
    result = connectors.publish(body.channel, body.content, body.media_url)
    store.insert("agent_actions", {"agent": "Human Approval", "action": "publish",
                                   "target": body.channel, "status": result.get("status"),
                                   "result": result})
    return result


class WhatsAppBody(BaseModel):
    to: str
    content: str = ""
    template: str | None = None
    lang: str = "en_GB"


@app.post("/whatsapp/send")
def whatsapp_send(body: WhatsAppBody):
    result = whatsapp.send_message(body.to, body.content, body.template, body.lang)
    store.insert("agent_actions", {"agent": "WhatsApp", "action": "send",
                                   "target": body.to, "status": result.get("status"),
                                   "result": result})
    return result


@app.post("/tasks/approve")
def approve(task_id: str):
    store.log("Orchestrator", "task approved", payload={"task_id": task_id})
    return {"task_id": task_id, "status": "approved"}
