-- 0012 added tenant_id to every tenant-owned table referencing
-- user_account(user_id), but without ON DELETE CASCADE — Postgres defaults
-- to blocking the delete instead. That's why deleting a brand-new auth user
-- (zero rows anywhere) works fine, but deleting one who's actually uploaded
-- data (rows in product/supplier/purchase_order/etc.) fails outright: the
-- delete cascades user_account -> business_profile fine, but then hits
-- these un-cascaded tenant_id references and Postgres refuses the whole
-- operation.
--
-- Cascading here is the right call, not just the convenient one: tenant_id
-- NULL specifically means "shared demo data" (see 0012's own comment) — so
-- ON DELETE SET NULL would silently dump a deleted user's real business
-- data into the shared demo pool, which is actively wrong, not just messy.
-- If the account is gone, its data should go with it.

alter table product_category   drop constraint product_category_tenant_id_fkey,
  add constraint product_category_tenant_id_fkey   foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table product            drop constraint product_tenant_id_fkey,
  add constraint product_tenant_id_fkey            foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table customer           drop constraint customer_tenant_id_fkey,
  add constraint customer_tenant_id_fkey           foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table department         drop constraint department_tenant_id_fkey,
  add constraint department_tenant_id_fkey         foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table supplier           drop constraint supplier_tenant_id_fkey,
  add constraint supplier_tenant_id_fkey           foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table warehouse          drop constraint warehouse_tenant_id_fkey,
  add constraint warehouse_tenant_id_fkey          foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table sales_order        drop constraint sales_order_tenant_id_fkey,
  add constraint sales_order_tenant_id_fkey        foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table order_item         drop constraint order_item_tenant_id_fkey,
  add constraint order_item_tenant_id_fkey         foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table purchase_order     drop constraint purchase_order_tenant_id_fkey,
  add constraint purchase_order_tenant_id_fkey     foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table inventory_snapshot drop constraint inventory_snapshot_tenant_id_fkey,
  add constraint inventory_snapshot_tenant_id_fkey foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table signal             drop constraint signal_tenant_id_fkey,
  add constraint signal_tenant_id_fkey             foreign key (tenant_id) references user_account(user_id) on delete cascade;
alter table decision           drop constraint decision_tenant_id_fkey,
  add constraint decision_tenant_id_fkey           foreign key (tenant_id) references user_account(user_id) on delete cascade;
