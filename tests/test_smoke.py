"""Smoke tests — verify the OS boots, computes, and stays safe without any keys.
Run: pytest -q"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault("RESTAURANT_NAME", "Mansa Musa Kitchen & Lounge")

from fastapi.testclient import TestClient  # noqa: E402
import backend.main as m  # noqa: E402
from backend import orchestrator  # noqa: E402
from backend import connectors  # noqa: E402
from backend import store as _store  # noqa: E402
from backend.analytics import menu_engineering, finance, inventory, crm  # noqa: E402

client = TestClient(m.app)


def test_health():
    r = client.get("/health")
    assert r.status_code == 200 and r.json()["status"] == "healthy"


def test_registry_has_99():
    assert orchestrator.status()["total_agents"] == 99


def test_analytics_endpoints():
    for name in ("menu", "inventory", "finance", "crm", "forecast", "labour"):
        assert client.get(f"/analytics/{name}").status_code == 200


def test_menu_engineering_classifies():
    out = menu_engineering.classify([
        {"name": "A", "units_sold": 300, "price": 14, "food_cost": 4},
        {"name": "B", "units_sold": 10, "price": 20, "food_cost": 12},
    ])
    classes = {i["class"] for i in out["items"]}
    assert classes and classes.issubset({"STAR", "PLOWHORSE", "PUZZLE", "DOG"})


def test_finance_prime_cost():
    p = finance.pnl(100, 30, 30, 20)
    assert p["prime_cost_pct"] == 60.0 and p["prime_cost_health"] == "good"


def test_inventory_reorder_urgency():
    out = inventory.reorder_list([{"item": "X", "on_hand": 0, "par_level": 5, "unit": "kg"}])
    assert out[0]["urgency"] == "out"


def test_crm_segments():
    seg = crm.segment_customers([{"name": "n", "recency_days": 5, "frequency": 20, "monetary": 1000}])
    assert seg[0]["segment"]


def test_publish_is_blocked_without_keys():
    # No platform keys in CI -> connectors must refuse safely, never crash.
    assert connectors.publish("facebook", "hi")["status"] == "blocked"


def test_messengers_blocked_without_keys():
    for ch in ("whatsapp", "sms", "email"):
        assert connectors.MESSENGERS[ch]("to", "body")["status"] == "blocked"


def test_autoreply_safe_mode_forces_draft(monkeypatch):
    # Master switch off => even an 'auto' channel must only draft, never send.
    monkeypatch.delenv("AUTO_REPLY_ENABLED", raising=False)
    from backend import automation
    r = automation.handle_inbound("review_positive",
                                  {"text": "Lovely jerk chicken!", "stars": 5, "sender_name": "Ada"})
    assert r["action"] == "draft" and r["sent"] is None


def test_autoreply_negative_review_always_draft(monkeypatch):
    monkeypatch.setenv("AUTO_REPLY_ENABLED", "true")
    from backend import automation
    r = automation.handle_inbound("review_negative",
                                  {"text": "Cold food and rude staff", "stars": 1})
    assert r["action"] == "draft"


def test_autoreply_escalation_keyword(monkeypatch):
    monkeypatch.setenv("AUTO_REPLY_ENABLED", "true")
    from backend import automation
    r = automation.handle_inbound("email_customer",
                                  {"text": "I want a refund, the food made me ill", "sender": "x@y.com"})
    assert r["action"] == "draft" and "keyword" in r["reason"]


def test_inbound_endpoint():
    r = client.post("/inbound", json={"channel": "social_comment", "text": "Do you do catering?"})
    assert r.status_code == 200 and r.json()["channel"] == "social_comment"


def test_payment_link_blocked_without_key():
    r = client.post("/payments/link", json={"description": "Catering deposit", "amount_gbp": 50})
    assert r.json()["status"] == "blocked"


def test_data_status_reports_sources():
    d = client.get("/data/status").json()
    assert "sources" in d and "finance" in d["sources"]
    assert all(v in ("live", "demo") for v in d["sources"].values())


def test_record_order_feeds_live_data():
    before = client.get("/data/status").json()
    r = client.post("/orders", json={"total": 42.5, "covers": 3,
                                     "items": [{"name": "Jerk Chicken", "qty": 2, "unit_price": 9.5},
                                               {"name": "Festival", "qty": 1, "unit_price": 3.5}]})
    assert r.json()["status"] == "recorded" and r.json()["items"] == 2
    # orders now exist in the (in-memory) store
    assert any(o.get("total") == 42.5 for o in _store.recent("orders", 10))
