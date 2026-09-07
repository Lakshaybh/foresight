-- The original schema wrongly assumed category_name was unique. The real
-- DataCo data proves that wrong: "Electronics" genuinely appears as two
-- distinct Category Ids. source_id (DataCo's real natural key) is the
-- correct uniqueness guarantee for product_category, not the name.

alter table product_category drop constraint product_category_category_name_key;
