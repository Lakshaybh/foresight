-- Foresight — initial schema
-- Mirrors 01_Documents/Entities_KPIs_Decision_Catalog.md exactly. Update that
-- document first if this schema ever needs to change — it is the source of truth.
--
-- Design rules carried over from that document:
--   1. Every table has its own unique primary key (uuid).
--   2. Nothing here is a single-tenant shortcut disguised as multi-tenant, and
--      nothing here is multi-tenant complexity we don't need yet — this is a
--      single demo tenant for the MVP (see blueprint, Compact MVP Scope). A
--      tenant_id column is added later, deliberately, when multi-tenancy is real.
--   3. Totals ("total sold", "total in inventory") are never stored as raw
--      numbers — they are computed from these rows. No column here duplicates
--      a value that belongs to another table.
--   4. RLS is enabled on every table from the start. No policies are added yet
--      on purpose — until the auth/approval flow exists, "no policy" means "no
--      access via the anon/public key," which is the safe default. Policies
--      are added deliberately in a later migration alongside that flow.

create extension if not exists "pgcrypto";

-- =========================================================================
-- Reference tables
-- =========================================================================

create table product_category (
  category_id   uuid primary key default gen_random_uuid(),
  category_name text not null unique,
  created_at    timestamptz not null default now()
);

create table product (
  product_id   uuid primary key default gen_random_uuid(),
  category_id  uuid not null references product_category(category_id),
  name         text not null,
  unit_cost    numeric(12,2) not null check (unit_cost >= 0),
  list_price   numeric(12,2) not null check (list_price >= 0),
  created_at   timestamptz not null default now()
);

create table customer (
  customer_id uuid primary key default gen_random_uuid(),
  segment     text,
  region      text,
  country     text,
  created_at  timestamptz not null default now()
);

-- Real "who sold it" channel/division data from DataCo. No individual
-- salesperson identities are stored here — see the doc for why.
create table department (
  department_id   uuid primary key default gen_random_uuid(),
  department_name text not null,
  market          text,
  created_at      timestamptz not null default now()
);

-- Synthetic (documented in Entities_KPIs_Decision_Catalog.md, Section 1).
create table supplier (
  supplier_id uuid primary key default gen_random_uuid(),
  name        text not null,
  region      text,
  category_id uuid references product_category(category_id),
  created_at  timestamptz not null default now()
);

-- Synthetic.
create table warehouse (
  warehouse_id uuid primary key default gen_random_uuid(),
  name         text not null,
  region       text,
  created_at   timestamptz not null default now()
);

-- Mirrors auth.users 1:1. Holds the gated-onboarding status and role from
-- the Access Model (CLAUDE.md / blueprint §23) — enforced server-side, never
-- a frontend-only check.
create table user_account (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  role       text not null default 'user' check (role in ('user', 'admin')),
  status     text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Transactional tables — the real events
-- =========================================================================

-- Named sales_order, not "order" (reserved word in Postgres).
create table sales_order (
  order_id                       uuid primary key default gen_random_uuid(),
  order_date                     date not null,
  customer_id                    uuid not null references customer(customer_id),
  department_id                  uuid references department(department_id),
  order_status                   text not null,
  shipping_mode                  text,
  days_for_shipping_scheduled    integer,
  days_for_shipping_actual       integer,
  created_at                     timestamptz not null default now()
);

create table order_item (
  order_item_id uuid primary key default gen_random_uuid(),
  order_id      uuid not null references sales_order(order_id) on delete cascade,
  product_id    uuid not null references product(product_id),
  quantity      integer not null check (quantity > 0),
  unit_price    numeric(12,2) not null check (unit_price >= 0),
  discount      numeric(12,2) not null default 0 check (discount >= 0),
  created_at    timestamptz not null default now()
);

-- Synthetic — the replenishment events inventory is built from.
create table purchase_order (
  po_id                  uuid primary key default gen_random_uuid(),
  supplier_id            uuid not null references supplier(supplier_id),
  product_id             uuid not null references product(product_id),
  quantity_ordered       integer not null check (quantity_ordered > 0),
  order_date             date not null,
  expected_delivery_date date not null,
  actual_delivery_date   date,
  created_at             timestamptz not null default now()
);

-- Synthetic; avg_daily_demand is derived from real order_item volume when
-- the synthetic data generator runs, not invented independently.
create table inventory_snapshot (
  snapshot_id        uuid primary key default gen_random_uuid(),
  product_id         uuid not null references product(product_id),
  warehouse_id       uuid not null references warehouse(warehouse_id),
  snapshot_date      date not null,
  stock_on_hand      integer not null check (stock_on_hand >= 0),
  safety_stock_level integer not null check (safety_stock_level >= 0),
  avg_daily_demand   numeric(10,2) not null check (avg_daily_demand >= 0),
  created_at         timestamptz not null default now(),
  unique (product_id, warehouse_id, snapshot_date)
);

-- =========================================================================
-- System-generated tables — the product's own output, not source data
-- =========================================================================

create table signal (
  signal_id      uuid primary key default gen_random_uuid(),
  entity_type    text not null,
  entity_id      uuid not null,
  metric         text not null,
  baseline_value numeric,
  observed_value numeric,
  deviation      numeric,
  detected_at    timestamptz not null default now()
);

-- action_type is constrained to exactly the 5-item Decision Catalog
-- (Entities_KPIs_Decision_Catalog.md, Section 5). Adding a 6th action means
-- deliberately updating that document and this constraint together.
create table decision (
  decision_id uuid primary key default gen_random_uuid(),
  signal_id   uuid not null references signal(signal_id),
  action_type text not null check (action_type in (
    'reorder_now',
    'escalate_supplier',
    'shift_to_backup_supplier',
    'review_demand_forecast',
    'monitor'
  )),
  evidence    jsonb not null,
  confidence  numeric(4,3) not null check (confidence >= 0 and confidence <= 1),
  status      text not null default 'open' check (status in ('open', 'approved', 'rejected', 'snoozed')),
  owner_role  text not null,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  outcome     text
);

-- =========================================================================
-- Row Level Security — enabled everywhere, policies added later
-- =========================================================================

alter table product_category   enable row level security;
alter table product            enable row level security;
alter table customer           enable row level security;
alter table department         enable row level security;
alter table supplier           enable row level security;
alter table warehouse          enable row level security;
alter table user_account       enable row level security;
alter table sales_order        enable row level security;
alter table order_item         enable row level security;
alter table purchase_order     enable row level security;
alter table inventory_snapshot enable row level security;
alter table signal             enable row level security;
alter table decision           enable row level security;
