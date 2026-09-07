"""
Generates the synthetic supplier / purchase_order / inventory_snapshot layer
on top of the real DataCo data already loaded by ingest_dataco.py.

Nothing here is random noise disconnected from reality:
  - avg_daily_demand is computed from real order_item quantities.
  - Weekly stock_on_hand is a real ledger: real units sold (from order_item)
    minus/plus synthetic purchase-order receipts, not an arbitrary number.
  - Only a small, explicitly flagged set of suppliers (supplier.engineered_
    drift_demo = true) are made to drift late near the end of the timeline,
    to demonstrate the one decision workflow this MVP proves. Every other
    supplier gets ordinary small random variation, mostly on time.

Fully deterministic: re-running with the same SEED reproduces identical
data. This script resets (truncates) the four synthetic tables first, since
they're entirely derived and meant to be regenerated, unlike the real
DataCo-backed tables which are upserted, never truncated.

Usage:
    python scripts/generate_synthetic.py
"""

from __future__ import annotations

import random
import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402

SEED = 42
SUPPLIERS_PER_CATEGORY = (2, 3)  # inclusive range, chosen per category
DRIFT_SUPPLIER_COUNT = 6         # explicitly engineered "slipping supplier" demo cases
DRIFT_WINDOW_WEEKS = 10          # how far back from the end the drift ramps up
PO_INTERVAL_DAYS = 14
SAFETY_STOCK_LEAD_MULTIPLE = 1.0
INITIAL_STOCK_LEAD_MULTIPLE = 2.0

NAME_PREFIXES = [
    "Atlas", "Meridian", "Summit", "Horizon", "Vanguard", "Crestline",
    "Ironclad", "Bluewave", "Silverline", "Northgate", "Anchor", "Cascade",
    "Titan", "Beacon", "Palisade", "Redwood", "Sterling", "Granite",
    "Harborline", "Frontier", "Windward", "Highland", "Cobalt", "Amber",
    "Cedar", "Falcon", "Everline", "Trueline", "Pioneer", "Lattice",
]
NAME_SUFFIXES = [
    "Supply Co.", "Trading Co.", "Sourcing Ltd.", "Industries",
    "Distribution Group", "Manufacturing Co.", "Logistics Ltd.",
    "Global Supply", "Materials Co.", "Exports Ltd.",
]


def week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


def daterange_weeks(start: date, end: date):
    cur = week_start(start)
    while cur <= end:
        yield cur
        cur += timedelta(days=7)


def main() -> None:
    import psycopg

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set in api/.env")

    rng = random.Random(SEED)

    with psycopg.connect(settings.database_url) as conn:
        with conn.cursor() as cur:
            print("Resetting synthetic tables...")
            cur.execute(
                "TRUNCATE inventory_snapshot, purchase_order, supplier, warehouse "
                "RESTART IDENTITY CASCADE"
            )

            cur.execute("SELECT DISTINCT market FROM department WHERE market IS NOT NULL ORDER BY market")
            markets = [r[0] for r in cur.fetchall()]
            print("Real markets found:", markets)

            cur.execute("SELECT category_id, category_name FROM product_category")
            categories = cur.fetchall()

            cur.execute("SELECT MIN(order_date), MAX(order_date) FROM sales_order")
            min_date, max_date = cur.fetchone()
            total_days = max(1, (max_date - min_date).days)
            print(f"Real order date range: {min_date} to {max_date} ({total_days} days)")

            cur.execute("""
                SELECT p.product_id, COALESCE(SUM(oi.quantity), 0)
                FROM product p
                LEFT JOIN order_item oi ON oi.product_id = p.product_id
                GROUP BY p.product_id
            """)
            total_qty_by_product = dict(cur.fetchall())

            cur.execute("SELECT product_id, category_id FROM product")
            product_category = dict(cur.fetchall())

            # --- warehouses: one per real market ---
            warehouse_ids: dict[str, str] = {}
            for market in markets:
                cur.execute(
                    "INSERT INTO warehouse (name, region) VALUES (%s, %s) RETURNING warehouse_id",
                    (f"{market} Distribution Center", market),
                )
                warehouse_ids[market] = cur.fetchone()[0]
            print(f"warehouse: inserted {len(warehouse_ids)} rows")

            # --- suppliers: 2-3 per category, drawn from a fixed name pool ---
            used_names: set[str] = set()

            def make_name() -> str:
                while True:
                    name = f"{rng.choice(NAME_PREFIXES)} {rng.choice(NAME_SUFFIXES)}"
                    if name not in used_names:
                        used_names.add(name)
                        return name

            all_suppliers: list[tuple] = []  # (supplier_id, category_id, lead_time, is_drift)
            suppliers_by_category: dict[str, list[tuple]] = {}

            for category_id, _category_name in categories:
                n = rng.randint(*SUPPLIERS_PER_CATEGORY)
                bucket = []
                for _ in range(n):
                    name = make_name()
                    region = rng.choice(markets)
                    lead_time = rng.randint(5, 12)
                    cur.execute(
                        """INSERT INTO supplier (name, region, category_id, engineered_drift_demo)
                           VALUES (%s, %s, %s, false) RETURNING supplier_id""",
                        (name, region, category_id),
                    )
                    supplier_id = cur.fetchone()[0]
                    bucket.append((supplier_id, lead_time))
                    all_suppliers.append((supplier_id, category_id, lead_time))
                suppliers_by_category[category_id] = bucket

            print(f"supplier: inserted {len(all_suppliers)} rows across {len(categories)} categories")

            # --- pick and flag the engineered drift-demo suppliers ---
            drift_supplier_ids = set(
                s[0] for s in rng.sample(all_suppliers, min(DRIFT_SUPPLIER_COUNT, len(all_suppliers)))
            )
            if drift_supplier_ids:
                cur.execute(
                    "UPDATE supplier SET engineered_drift_demo = true WHERE supplier_id = ANY(%s)",
                    (list(drift_supplier_ids),),
                )
            print(f"supplier: flagged {len(drift_supplier_ids)} as engineered_drift_demo")

            lead_time_by_supplier = {s[0]: s[2] for s in all_suppliers}
            drift_start_date = max_date - timedelta(weeks=DRIFT_WINDOW_WEEKS)

            # --- assign each product a primary supplier from its category ---
            primary_supplier_by_product: dict[str, str] = {}
            for product_id, category_id in product_category.items():
                bucket = suppliers_by_category.get(category_id)
                if not bucket:
                    continue
                supplier_id, _ = rng.choice(bucket)
                primary_supplier_by_product[product_id] = supplier_id

            # --- avg daily demand per product, from real sales ---
            avg_daily_demand: dict[str, float] = {
                pid: total_qty_by_product.get(pid, 0) / total_days
                for pid in product_category
            }

            # --- purchase orders ---
            po_rows = []
            po_receipts: dict[tuple[str, date], int] = {}  # (product_id, week) -> qty received

            for product_id, category_id in product_category.items():
                supplier_id = primary_supplier_by_product.get(product_id)
                if not supplier_id:
                    continue
                lead_time = lead_time_by_supplier[supplier_id]
                demand = avg_daily_demand[product_id]
                is_drift = supplier_id in drift_supplier_ids

                cursor_date = min_date
                while cursor_date <= max_date:
                    qty = max(1, round(demand * PO_INTERVAL_DAYS * 1.2))
                    expected = cursor_date + timedelta(days=lead_time)

                    if is_drift and cursor_date >= drift_start_date:
                        span = max(1, (max_date - drift_start_date).days)
                        progress = (cursor_date - drift_start_date).days / span
                        delay = round(progress * 7) + rng.randint(0, 1)
                    else:
                        delay = rng.choice([0, 0, 0, 0, 1, -1, 1, 2])

                    actual = expected + timedelta(days=max(delay, -lead_time + 1))

                    po_rows.append((supplier_id, product_id, qty, cursor_date, expected, actual))

                    receipt_week = week_start(actual)
                    key = (product_id, receipt_week)
                    po_receipts[key] = po_receipts.get(key, 0) + qty

                    cursor_date += timedelta(days=PO_INTERVAL_DAYS)

            for i in range(0, len(po_rows), 5000):
                batch = po_rows[i:i + 5000]
                cur.executemany(
                    """INSERT INTO purchase_order
                       (supplier_id, product_id, quantity_ordered, order_date,
                        expected_delivery_date, actual_delivery_date)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    batch,
                )
            print(f"purchase_order: inserted {len(po_rows)} rows")

            # --- real weekly sales per product, from order_item + sales_order ---
            cur.execute("""
                SELECT oi.product_id, date_trunc('week', so.order_date)::date, SUM(oi.quantity)
                FROM order_item oi
                JOIN sales_order so ON so.order_id = oi.order_id
                GROUP BY oi.product_id, date_trunc('week', so.order_date)
            """)
            weekly_sales: dict[tuple[str, date], int] = {(r[0], r[1]): r[2] for r in cur.fetchall()}

            # --- inventory ledger, one row per product per week ---
            weeks = list(daterange_weeks(min_date, max_date))
            snapshot_rows = []

            # deterministic home warehouse per product
            warehouse_list = list(warehouse_ids.values())
            home_warehouse_by_product = {
                pid: warehouse_list[i % len(warehouse_list)]
                for i, pid in enumerate(sorted(product_category))
            }

            for product_id in product_category:
                supplier_id = primary_supplier_by_product.get(product_id)
                lead_time = lead_time_by_supplier.get(supplier_id, 7)
                demand = avg_daily_demand[product_id]
                warehouse_id = home_warehouse_by_product[product_id]

                stock = demand * lead_time * INITIAL_STOCK_LEAD_MULTIPLE
                safety_stock = demand * lead_time * SAFETY_STOCK_LEAD_MULTIPLE

                for wk in weeks:
                    sold = weekly_sales.get((product_id, wk), 0)
                    received = po_receipts.get((product_id, wk), 0)
                    stock = max(stock - sold + received, 0)

                    snapshot_rows.append((
                        product_id, warehouse_id, wk,
                        round(stock), round(safety_stock), round(demand, 2),
                    ))

            for i in range(0, len(snapshot_rows), 5000):
                batch = snapshot_rows[i:i + 5000]
                cur.executemany(
                    """INSERT INTO inventory_snapshot
                       (product_id, warehouse_id, snapshot_date, stock_on_hand,
                        safety_stock_level, avg_daily_demand)
                       VALUES (%s, %s, %s, %s, %s, %s)""",
                    batch,
                )
            print(f"inventory_snapshot: inserted {len(snapshot_rows)} rows")

        conn.commit()

    print("Synthetic generation complete.")


if __name__ == "__main__":
    main()
