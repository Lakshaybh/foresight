-- DataCo provides product price and per-order profit, but no true wholesale
-- unit cost. Rather than deriving a fabricated cost number and presenting it
-- as fact, unit_cost is made nullable — it stays NULL for real DataCo
-- products until a documented estimation method exists (or a real cost
-- source is added). Never back-filled with a guessed number silently.

alter table product alter column unit_cost drop not null;
