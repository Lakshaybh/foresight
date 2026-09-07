"""
Ingests the real DataCo Smart Supply Chain dataset into Postgres.

Source of truth for the mapping: 01_Documents/Entities_KPIs_Decision_Catalog.md.
Real data only — this script never invents a value. Where DataCo doesn't have a
fact (e.g. a true wholesale unit cost), the column is left NULL, not guessed.

Idempotent: every insert is an upsert on each table's unique `source_id`
(DataCo's own natural ID), so re-running this script on the same file updates
existing rows instead of duplicating them (blueprint SS11).

Usage:
    python scripts/ingest_dataco.py --dry-run     # transform only, no DB writes
    python scripts/ingest_dataco.py                # actually load into Postgres
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

import polars as pl

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402

CSV_PATH = Path(__file__).resolve().parent.parent.parent / "data" / "raw" / "DataCoSupplyChainDataset.csv"
BATCH_SIZE = 5000


def load_source() -> pl.DataFrame:
    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"DataCo CSV not found at {CSV_PATH}. Download it first (see 05_Daily_Log)."
        )
    return pl.read_csv(CSV_PATH, encoding="latin1", infer_schema_length=200000)


def build_categories(df: pl.DataFrame) -> pl.DataFrame:
    return (
        df.select(
            pl.col("Category Id").alias("source_id"),
            pl.col("Category Name").alias("category_name"),
        )
        .unique(subset=["source_id"])
        .sort("source_id")
    )


def build_departments(df: pl.DataFrame) -> pl.DataFrame:
    return (
        df.select(
            pl.col("Department Id").alias("source_id"),
            pl.col("Department Name").alias("department_name"),
            pl.col("Market").alias("market"),
        )
        .unique(subset=["source_id"])
        .sort("source_id")
    )


def build_customers(df: pl.DataFrame) -> pl.DataFrame:
    return (
        df.select(
            pl.col("Customer Id").alias("source_id"),
            pl.col("Customer Segment").alias("segment"),
            pl.col("Customer State").alias("region"),
            pl.col("Customer Country").alias("country"),
        )
        .unique(subset=["source_id"])
        .sort("source_id")
    )


def build_products(df: pl.DataFrame) -> pl.DataFrame:
    return (
        df.select(
            pl.col("Product Card Id").alias("source_id"),
            pl.col("Category Id").alias("category_source_id"),
            pl.col("Product Name").alias("name"),
            pl.col("Product Price").alias("list_price"),
        )
        .unique(subset=["source_id"])
        .sort("source_id")
    )


def build_orders(df: pl.DataFrame) -> pl.DataFrame:
    return (
        df.select(
            pl.col("Order Id").alias("source_id"),
            pl.col("order date (DateOrders)").alias("order_date_raw"),
            pl.col("Order Customer Id").alias("customer_source_id"),
            pl.col("Department Id").alias("department_source_id"),
            pl.col("Order Status").alias("order_status"),
            pl.col("Shipping Mode").alias("shipping_mode"),
            pl.col("Days for shipment (scheduled)").alias("days_for_shipping_scheduled"),
            pl.col("Days for shipping (real)").alias("days_for_shipping_actual"),
        )
        .unique(subset=["source_id"])
        .sort("source_id")
        .with_columns(
            pl.col("order_date_raw").str.strptime(pl.Date, "%m/%d/%Y %H:%M", strict=False).alias("order_date")
        )
    )


def build_order_items(df: pl.DataFrame) -> pl.DataFrame:
    return df.select(
        pl.col("Order Item Id").alias("source_id"),
        pl.col("Order Id").alias("order_source_id"),
        pl.col("Product Card Id").alias("product_source_id"),
        pl.col("Order Item Quantity").alias("quantity"),
        pl.col("Order Item Product Price").alias("unit_price"),
        pl.col("Order Item Discount").alias("discount"),
    )


def summarize(name: str, frame: pl.DataFrame) -> None:
    print(f"{name}: {frame.height} rows")


def run_dry(df: pl.DataFrame) -> None:
    categories = build_categories(df)
    departments = build_departments(df)
    customers = build_customers(df)
    products = build_products(df)
    orders = build_orders(df)
    order_items = build_order_items(df)

    summarize("product_category", categories)
    summarize("department", departments)
    summarize("customer", customers)
    summarize("product", products)
    summarize("sales_order", orders)
    summarize("order_item", order_items)

    unparsed_dates = orders.filter(pl.col("order_date").is_null()).height
    print(f"orders with unparseable order_date: {unparsed_dates}")


def run_load(df: pl.DataFrame) -> None:
    import psycopg

    if not settings.database_url:
        raise RuntimeError(
            "DATABASE_URL is not set in api/.env — add it from the Supabase "
            "dashboard (Project Settings -> Database -> Connection string) "
            "before running with --execute."
        )

    categories = build_categories(df)
    departments = build_departments(df)
    customers = build_customers(df)
    products = build_products(df)
    orders = build_orders(df)
    order_items = build_order_items(df)

    with psycopg.connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            upsert(cur, "product_category", categories,
                   cols=["source_id", "category_name"])
            upsert(cur, "department", departments,
                   cols=["source_id", "department_name", "market"])
            upsert(cur, "customer", customers,
                   cols=["source_id", "segment", "region", "country"])

            category_map = fetch_id_map(cur, "product_category")

            products_resolved = products.with_columns(
                pl.col("category_source_id").replace_strict(category_map, default=None).alias("category_id")
            ).drop("category_source_id")
            upsert(cur, "product", products_resolved,
                   cols=["source_id", "category_id", "name", "list_price"])

            customer_map = fetch_id_map(cur, "customer")
            department_map = fetch_id_map(cur, "department")

            orders_resolved = orders.with_columns(
                pl.col("customer_source_id").replace_strict(customer_map, default=None).alias("customer_id"),
                pl.col("department_source_id").replace_strict(department_map, default=None).alias("department_id"),
            ).drop(["customer_source_id", "department_source_id", "order_date_raw"])
            upsert(cur, "sales_order", orders_resolved,
                   cols=["source_id", "order_date", "customer_id", "department_id",
                         "order_status", "shipping_mode", "days_for_shipping_scheduled",
                         "days_for_shipping_actual"])

            product_map = fetch_id_map(cur, "product")
            order_map = fetch_id_map(cur, "sales_order")

            items_resolved = order_items.with_columns(
                pl.col("order_source_id").replace_strict(order_map, default=None).alias("order_id"),
                pl.col("product_source_id").replace_strict(product_map, default=None).alias("product_id"),
            ).drop(["order_source_id", "product_source_id"])
            upsert(cur, "order_item", items_resolved,
                   cols=["source_id", "order_id", "product_id", "quantity", "unit_price", "discount"])

        conn.commit()

    print("Load complete.")


def fetch_id_map(cur, table: str) -> dict:
    # Cast the uuid PK to str — psycopg returns Python UUID objects, which
    # Polars can't use as replacement values (they aren't a primitive type).
    cur.execute(f"SELECT source_id, {table_pk(table)} FROM {table}")
    return {row[0]: str(row[1]) for row in cur.fetchall()}


def table_pk(table: str) -> str:
    return {
        "product_category": "category_id",
        "department": "department_id",
        "customer": "customer_id",
        "product": "product_id",
        "sales_order": "order_id",
    }[table]


def upsert(cur, table: str, frame: pl.DataFrame, cols: list[str]) -> None:
    placeholders = ", ".join(["%s"] * len(cols))
    col_list = ", ".join(cols)
    updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in cols if c != "source_id")
    sql = (
        f"INSERT INTO {table} ({col_list}) VALUES ({placeholders}) "
        f"ON CONFLICT (source_id) DO UPDATE SET {updates}"
    )
    rows = frame.select(cols).rows()
    for i in range(0, len(rows), BATCH_SIZE):
        batch = rows[i:i + BATCH_SIZE]
        cur.executemany(sql, batch)
    print(f"{table}: upserted {len(rows)} rows")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true", help="Transform only, no DB writes")
    args = parser.parse_args()

    df = load_source()
    print(f"Loaded {df.height} rows from {CSV_PATH.name}")

    if args.dry_run:
        run_dry(df)
    else:
        run_load(df)


if __name__ == "__main__":
    main()
