-- Adds a unique natural-key column to every DataCo-backed table, so the CSV
-- ingestion job can upsert on it (ON CONFLICT (source_id) DO UPDATE) and be
-- safely re-run without creating duplicates. Required by blueprint SS11:
-- "idempotent ingestion jobs so the same file/event can be processed safely
-- twice." The internal uuid primary key stays the real PK everywhere else in
-- the schema (foreign keys, joins) — this is purely the upsert key.

alter table product_category add column source_id integer unique;
alter table product           add column source_id integer unique;
alter table customer          add column source_id integer unique;
alter table department        add column source_id integer unique;
alter table sales_order       add column source_id integer unique;
alter table order_item        add column source_id integer unique;
