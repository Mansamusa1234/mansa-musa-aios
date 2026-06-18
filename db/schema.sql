-- Mansa Musa AI OS — Supabase schema
-- Run this in Supabase → SQL Editor. Safe to re-run (uses IF NOT EXISTS).

create extension if not exists "pgcrypto";

-- ── Core business tables ─────────────────────────────────────────────────────
create table if not exists restaurants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  city        text,
  timezone    text default 'Europe/London',
  created_at  timestamptz default now()
);

create table if not exists staff (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name        text not null,
  role        text,
  email       text,
  phone       text,
  active      boolean default true,
  created_at  timestamptz default now()
);

create table if not exists customers (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name        text,
  email       text,
  phone       text,
  vip         boolean default false,
  birthday    date,
  lifetime_value numeric default 0,
  created_at  timestamptz default now()
);

create table if not exists reservations (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  customer_id uuid references customers(id),
  party_size  int,
  starts_at   timestamptz,
  status      text default 'booked',   -- booked | seated | no_show | cancelled
  source      text,                    -- website | phone | walk_in | opentable
  notes       text,
  created_at  timestamptz default now()
);

create table if not exists orders (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  customer_id uuid references customers(id),
  total       numeric,
  covers      int,
  placed_at   timestamptz default now()
);

create table if not exists menu_items (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name        text not null,
  category    text,
  price       numeric,
  food_cost   numeric,
  active      boolean default true
);

create table if not exists inventory (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  item        text not null,
  unit        text,
  on_hand     numeric default 0,
  par_level   numeric default 0,
  updated_at  timestamptz default now()
);

create table if not exists suppliers (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name        text,
  category    text,
  contact     text,
  lead_time_days int
);

create table if not exists events (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  title       text,
  starts_at   timestamptz,
  capacity    int,
  tickets_sold int default 0,
  status      text default 'planned'
);

create table if not exists campaigns (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  channel     text,                    -- instagram | facebook | email | sms | google
  title       text,
  body        text,
  status      text default 'draft',    -- draft | approved | scheduled | published
  scheduled_for timestamptz,
  created_by_agent text,
  created_at  timestamptz default now()
);

-- ── Agent operating tables ───────────────────────────────────────────────────
create table if not exists tasks (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  agent       text,                    -- which agent created it
  title       text,
  detail      text,
  status      text default 'open',     -- open | awaiting_approval | approved | done | rejected
  requires_approval boolean default false,
  due_at      timestamptz,
  created_at  timestamptz default now()
);

create table if not exists agent_logs (
  id          uuid primary key default gen_random_uuid(),
  agent       text,
  level       text default 'info',     -- info | warn | error
  message     text,
  payload     jsonb,
  created_at  timestamptz default now()
);

create table if not exists agent_actions (
  id          uuid primary key default gen_random_uuid(),
  agent       text,
  action      text,                    -- draft_post | reply_review | report | order_stock ...
  target      text,                    -- platform / table
  status      text default 'pending',  -- pending | executed | blocked | rejected
  result      jsonb,
  created_at  timestamptz default now()
);

-- Simple vector-ready memory table (swap text->vector once pgvector is enabled)
create table if not exists agent_memory (
  id          uuid primary key default gen_random_uuid(),
  agent       text,
  key         text,
  content     text,
  created_at  timestamptz default now()
);

create table if not exists kpis (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name        text,                    -- daily_revenue | covers | avg_spend | no_show_rate
  value       numeric,
  as_of       date default current_date
);

-- ── Professional-package tables (menu engineering, ops, compliance, reputation) ─
create table if not exists recipes (
  id          uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id),
  yield_portions int default 1,
  method      text
);

create table if not exists recipe_ingredients (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid references recipes(id),
  item        text,
  qty         numeric,
  unit        text,
  unit_cost   numeric
);

create table if not exists shifts (
  id          uuid primary key default gen_random_uuid(),
  staff_id    uuid references staff(id),
  starts_at   timestamptz,
  ends_at     timestamptz,
  hours       numeric,
  rate        numeric,
  role        text
);

create table if not exists waitlist (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  name        text,
  party_size  int,
  quoted_wait int,
  status      text default 'waiting',  -- waiting | seated | left
  created_at  timestamptz default now()
);

create table if not exists reviews (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  source      text,                    -- google | tripadvisor | facebook
  external_id text,
  author      text,
  stars       int,
  body        text,
  reply       text,
  reply_status text default 'none',    -- none | drafted | approved | posted
  created_at  timestamptz default now()
);

create table if not exists deliveries (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  platform    text,                    -- deliveroo | ubereats | justeat
  orders      int,
  revenue     numeric,
  commission_pct numeric,
  rating      numeric,
  as_of       date default current_date
);

create table if not exists temperature_logs (
  id          uuid primary key default gen_random_uuid(),
  restaurant_id uuid references restaurants(id),
  location    text,                    -- fridge_1 | freezer | hot_hold
  celsius     numeric,
  logged_by   text,
  logged_at   timestamptz default now()
);

create table if not exists allergens (
  id          uuid primary key default gen_random_uuid(),
  menu_item_id uuid references menu_items(id),
  allergen    text                     -- gluten | peanuts | shellfish ...
);

create index if not exists idx_reviews_source on reviews(source, created_at desc);
create index if not exists idx_shifts_starts on shifts(starts_at);
create index if not exists idx_agent_logs_created on agent_logs(created_at desc);
create index if not exists idx_tasks_status on tasks(status);
create index if not exists idx_reservations_starts on reservations(starts_at);

-- ── Live-data ingestion + analytics views ───────────────────────────────────
-- Line items per order — this is what turns raw sales into menu analytics.
create table if not exists order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid references orders(id),
  menu_item_id uuid references menu_items(id),
  qty         int default 1,
  unit_price  numeric,
  created_at  timestamptz default now()
);
create index if not exists idx_order_items_order on order_items(order_id);

-- The analytics engine reads these views. They derive live numbers from real
-- orders/customers — so the dashboard flips from demo to LIVE automatically as
-- soon as data exists. (Each carries created_at so the API's generic reader works.)

-- Units sold + price + food cost per dish -> menu engineering & costing.
create or replace view menu_performance as
select m.id,
       m.name,
       coalesce(sum(oi.qty), 0)::int as units_sold,
       m.price,
       m.food_cost,
       now() as created_at
from menu_items m
left join order_items oi on oi.menu_item_id = m.id
where m.active is true
group by m.id, m.name, m.price, m.food_cost;

-- Covers per day with weekday label -> demand forecasting.
create or replace view covers_history as
select to_char(placed_at, 'Dy')      as weekday,
       sum(covers)::int               as covers,
       date_trunc('day', placed_at)   as created_at
from orders
group by to_char(placed_at, 'Dy'), date_trunc('day', placed_at);

-- Recency / frequency / monetary per customer -> CRM segmentation.
create or replace view customer_rfm as
select c.id,
       c.name,
       extract(day from now() - max(o.placed_at))::int as recency_days,
       count(o.id)::int                                 as frequency,
       coalesce(sum(o.total), 0)                        as monetary,
       now() as created_at
from customers c
join orders o on o.customer_id = c.id
group by c.id, c.name;

-- Seed your restaurant (edit the name/city):
insert into restaurants (name, city, timezone)
select 'Mansa Musa Kitchen & Lounge', null, 'Europe/London'
where not exists (select 1 from restaurants);
