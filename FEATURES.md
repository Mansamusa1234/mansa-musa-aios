# Mansa Musa AI OS — Full Feature Deep Dive

The professional package: everything a top-tier restaurant operating system does,
organised by department. **Bold = built and tested in this repo today.** Plain =
registered agent / table ready to activate (Phase 3). The design principle: the
**analytics engine computes the numbers** (reliable, deterministic) and the
**agents narrate + act** (readable, automated), all behind a **human-approval gate**
for anything sensitive.

---

## 1. Revenue & Finance
- **Daily revenue, covers, average spend** (`analytics/kpis.py`)
- **P&L: gross margin, prime cost %, net margin, operating profit** (`analytics/finance.py`)
- **Prime-cost health flag** (good / watch / high vs 60–65% benchmark)
- **Break-even revenue & margin of safety**
- **Multi-week cashflow projection** with negative-balance alerts
- Stripe reconciliation (read-only key) — connector slot ready
- Payroll & tax summaries — agents registered, `requires_approval`

## 2. Menu Engineering
- **Kasavana–Smith matrix: Star / Plowhorse / Puzzle / Dog** (`analytics/menu_engineering.py`)
- **Per-dish action recommendations** (protect, re-price, reposition, remove)
- **Plate / recipe costing** with food-cost % and GP % (`analytics/costing.py`)
- **Suggested price** to hit a target food-cost %, rounded to tidy price points
- Seasonal menus, African-cuisine research, nutritional & allergen tagging — registered
- `recipes`, `recipe_ingredients`, `allergens` tables in schema

## 3. Inventory & Procurement
- **Par-level auto-reorder list** with lead-time buffer and urgency (out/critical/low) (`analytics/inventory.py`)
- **Theoretical vs actual usage variance** (waste / theft / over-portioning flag)
- **Stock value & waste %**
- Supplier & procurement agents (`requires_approval`) — registered

## 4. Demand Forecasting & Operations
- **Weekday-seasonality covers forecast** (moving average × day factor) (`analytics/forecasting.py`)
- **Revenue forecast & staffing requirement** (FOH/BOH from covers)
- Opening/closing checklists, kitchen reports, maintenance — registered
- `temperature_logs` (HACCP), waitlist, deliveries (Deliveroo/UberEats/JustEat) tables

## 5. Labour & Staff
- **Labour cost %, sales per labour hour, schedule cost vs budget** (`analytics/labor.py`)
- **Over/under-budget flag against forecast revenue**
- `shifts` table; scheduling, recruitment, training, retention agents registered
- Sensitive HR actions are `requires_approval`

## 6. Customers & CRM
- **RFM segmentation → Champion / At-Risk / Lost / New / Big Spender / Regular** (`analytics/crm.py`)
- **Per-segment marketing play** (VIP perks, win-back, welcome, reactivation)
- **Lifetime-value estimate**
- Loyalty, birthday, retention, complaint-resolution agents — registered
- `customers`, `reservations`, `waitlist` tables

## 7. Marketing & Content  (live connectors)
- **Facebook & Instagram publishing** via Meta Graph API (`connectors/meta.py`)
- **TikTok video publishing** via Content Posting API (`connectors/tiktok.py`)
- **Google Business posts & review replies** (`connectors/google_business.py`)
- **WhatsApp customer messaging & opt-in broadcasts** (`connectors/whatsapp.py`)
- **Draft → approve → publish** workflow with DRAFT fallback when keys absent
- Email/SMS, influencer outreach, content calendar — registered

## 8. Reputation
- **Review-response drafting** in owner's voice; negatives always human-approved (`agents/reviews.py`)
- `reviews` table aggregates Google / Tripadvisor / Facebook with reply status
- Tripadvisor Content API monitoring — connector slot ready

## 9. Events & Private Dining
- Event planner, private dining, live music/DJ booking, ticket sales, corporate/wedding,
  community events, event promotion — registered agents + `events` table

## 10. Intelligence & Automation
- **Headline KPI engine + health score** (`analytics/kpis.py`)
- **8-tab executive dashboard** (Executive, Menu, Inventory, Finance, Customers,
  Forecast, Labour, AI Command) — `dashboard/index.html`
- Competitor & trend monitoring, predictive analytics, reporting — registered
- **Orchestrator** runs agents by time-slot or team; full `agent_logs` / `agent_actions` audit trail

---

## The daily rhythm (automated)
| Time  | Slot | Agents that fire |
|-------|------|------------------|
| 06:00 | Operations | Stock/reorder, Reservation, Forecast, Labour scheduling |
| 09:00 | Marketing  | Instagram + Facebook drafts |
| 12:00 | Reviews & Loyalty | Review replies, CRM segmentation |
| 15:00 | Revenue & Menu | Revenue analysis, Menu-engineering matrix |
| 21:00 | Closing | P&L/profitability, dashboard summary |

## Governance (built-in)
- Every action logged to `agent_logs` + `agent_actions`.
- Money, hiring, contracts, supplier orders → `requires_approval: true`, never auto-run.
- Social posting defaults to DRAFT until you set `auto_publish` + `ALLOW_AUTO_PUBLISH=true`.
- Numbers are computed by deterministic code, not guessed by the model.

## Activated today: 13 of 99 agents
Stock Controller, Menu Optimizer, Instagram, Facebook, Review Response, Reservation,
Loyalty, Revenue, Profitability, Forecasting, Scheduling, Dashboard, Orchestrator.
The rest share the same runtime — enable them in `config/agents.yaml` as you grow.
