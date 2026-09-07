-- Support columns/constraints for the synthetic data generator
-- (scripts/generate_synthetic.py). These tables are fully synthetic and
-- regenerable from a fixed seed, so a name-based unique key is sufficient —
-- unlike the DataCo tables, there's no external source_id to upsert on.

alter table warehouse add constraint warehouse_name_key unique (name);
alter table supplier  add constraint supplier_name_key  unique (name);

-- Explicit, auditable flag: which suppliers were deliberately engineered to
-- demonstrate the lead-time-drift-to-stockout scenario, versus suppliers
-- given ordinary randomized variation. This is what makes the synthetic
-- layer transparent rather than a black box — anyone can query exactly
-- which rows were hand-picked for the demo story.
alter table supplier add column engineered_drift_demo boolean not null default false;
