-- Multi-tenant foundation (Step A of the data-ingestion project). Purely
-- additive — nullable columns, nothing existing breaks, no code changes
-- required yet. tenant_id = the user_account row of the business that owns
-- the row; there's no separate "organization" concept in this MVP, one
-- approved account is one business, matching how signup already works.
--
-- NULL tenant_id is deliberately meaningful, not just "not migrated yet":
-- it marks the existing demo data (loaded once from the DataCo dataset +
-- synthetic generator) as shared sample data, owned by no real business.
-- Once a real customer's dashboard queries filter on `tenant_id = <their
-- user_id>`, that filter naturally excludes every NULL-tenant demo row —
-- which is exactly the fix for "why am I seeing data I never uploaded,"
-- without needing to fabricate a fake owner account for the demo rows.
--
-- Indexes added on every tenant_id column since every real query from here
-- on filters by it — this is the column that will be hit hardest.

alter table product_category   add column tenant_id uuid references user_account(user_id);
alter table product            add column tenant_id uuid references user_account(user_id);
alter table customer           add column tenant_id uuid references user_account(user_id);
alter table department         add column tenant_id uuid references user_account(user_id);
alter table supplier           add column tenant_id uuid references user_account(user_id);
alter table warehouse          add column tenant_id uuid references user_account(user_id);
alter table sales_order        add column tenant_id uuid references user_account(user_id);
alter table order_item         add column tenant_id uuid references user_account(user_id);
alter table purchase_order     add column tenant_id uuid references user_account(user_id);
alter table inventory_snapshot add column tenant_id uuid references user_account(user_id);
alter table signal             add column tenant_id uuid references user_account(user_id);
alter table decision           add column tenant_id uuid references user_account(user_id);

create index idx_product_category_tenant   on product_category(tenant_id);
create index idx_product_tenant            on product(tenant_id);
create index idx_customer_tenant           on customer(tenant_id);
create index idx_department_tenant         on department(tenant_id);
create index idx_supplier_tenant           on supplier(tenant_id);
create index idx_warehouse_tenant          on warehouse(tenant_id);
create index idx_sales_order_tenant        on sales_order(tenant_id);
create index idx_order_item_tenant         on order_item(tenant_id);
create index idx_purchase_order_tenant     on purchase_order(tenant_id);
create index idx_inventory_snapshot_tenant on inventory_snapshot(tenant_id);
create index idx_signal_tenant             on signal(tenant_id);
create index idx_decision_tenant           on decision(tenant_id);
