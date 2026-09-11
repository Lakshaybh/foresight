-- 0006 gave supplier.name and warehouse.name a *global* unique constraint,
-- written back when this was single-tenant demo data. tenant_id was added
-- later (0012) and get_or_create_supplier/get_or_create_warehouse already
-- scope their lookups by (tenant_id, name) — but the constraint itself was
-- never updated to match, so once any tenant (or the NULL-tenant shared
-- demo dataset) uses a given name, no other tenant can ever use it again.
-- That's why a real upload using the sample CSV's own example name
-- ("Acme Supplies") fails with a UniqueViolation: the demo dataset already
-- has a supplier by that name under a different (NULL) tenant_id.
--
-- Re-scoping to (tenant_id, name) matches product_category's precedent
-- (0005) and what the ingest code already assumes.

alter table supplier drop constraint supplier_name_key;
alter table warehouse drop constraint warehouse_name_key;

alter table supplier add constraint supplier_tenant_name_key unique (tenant_id, name);
alter table warehouse add constraint warehouse_tenant_name_key unique (tenant_id, name);
