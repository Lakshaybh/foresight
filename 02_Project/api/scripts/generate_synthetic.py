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
PO_INTERVAL_DAYS = 14  # informs the target-level formula, not a fixed order schedule

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

    with psycopg.connect(settings.database_url, prepare_threshold=None) as conn:
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

            lead_time_by_supplier = {s[0]: s[2] for s in all_suppliers}

            # --- assign each product a primary supplier from its category ---
            # Must happen BEFORE picking drift-demo suppliers below: with only
            # 118 products spread across 131 suppliers, a purely random pick
            # from *all* suppliers can select one that no product ever uses,
            # leaving it with zero purchase orders — not a realistic "slipping
            # supplier" if it never receives any orders in the first place.
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

            # --- real weekly sales per product, from order_item + sales_order ---
            cur.execute("""
                SELECT oi.product_id, date_trunc('week', so.order_date)::date, SUM(oi.quantity)
                FROM order_item oi
                JOIN sales_order so ON so.order_id = oi.order_id
                GROUP BY oi.product_id, date_trunc('week', so.order_date)
            """)
            weekly_sales: dict[tuple[str, date], int] = {(r[0], r[1]): r[2] for r in cur.fetchall()}

            # deterministic home warehouse per product
            warehouse_list = list(warehouse_ids.values())
            home_warehouse_by_product = {
                pid: warehouse_list[i % len(warehouse_list)]
                for i, pid in enumerate(sorted(product_category))
            }

            weeks = list(daterange_weeks(min_date, max_date))
            RAMP_LENGTH = 5  # the drift ramps over a product's own last N orders

            def simulate(drift_start_index_by_product: dict[str, int]) -> tuple[list, list, dict]:
                """Runs the full weekly order-up-to-level simulation for every
                product. Returns (po_rows, snapshot_rows, order_count_by_product).

                Real, stock-responsive policy: each week, receive anything
                that has arrived, subtract real sales, then look at stock
                POSITION (on-hand + already-ordered-but-not-yet-arrived) and
                order enough to bring it back to a target level. This
                replaces an earlier, broken version that ordered a fixed
                quantity on a fixed schedule regardless of actual stock,
                which let inventory balloon to hundreds of days of cover
                over the 3-year simulation and masked any stockout risk.

                Drift is applied by ORDER SEQUENCE POSITION, not calendar
                date: once a drift-flagged product's order counter reaches
                its assigned start index, the next RAMP_LENGTH orders get an
                increasing delay. This deliberately ties the engineered
                scenario to "this product's own most recent orders" — the
                exact thing the detection engine looks at — rather than a
                fixed calendar cutoff, which earlier attempts showed breaks
                down because different products' real DataCo sales histories
                end at different points (a genuine, honest fact about the
                data — see the code history / daily log for what was tried).
                """
                po_rows_ = []
                snapshot_rows_ = []
                order_count_by_product: dict[str, int] = {}

                for product_id in product_category:
                    supplier_id = primary_supplier_by_product.get(product_id)
                    if not supplier_id:
                        continue
                    lead_time = lead_time_by_supplier[supplier_id]
                    demand = avg_daily_demand[product_id]
                    warehouse_id = home_warehouse_by_product[product_id]
                    drift_start_index = drift_start_index_by_product.get(product_id)

                    safety_stock = demand * lead_time
                    target_level = demand * (lead_time + PO_INTERVAL_DAYS / 2 + 2)

                    stock = target_level
                    pending: list[list] = []
                    order_count = 0

                    for wk in weeks:
                        arrived = sum(q for arr, q in pending if arr <= wk)
                        pending = [[arr, q] for arr, q in pending if arr > wk]
                        stock += arrived

                        sold = weekly_sales.get((product_id, wk), 0)
                        stock = max(stock - sold, 0)

                        snapshot_rows_.append((
                            product_id, warehouse_id, wk,
                            round(stock), round(safety_stock), round(demand, 2),
                        ))

                        stock_position = stock + sum(q for _, q in pending)
                        order_qty = max(0, round(target_level - stock_position))
                        if order_qty > 0:
                            expected = wk + timedelta(days=lead_time)

                            if drift_start_index is not None and order_count >= drift_start_index:
                                progress = (order_count - drift_start_index) / RAMP_LENGTH
                                delay = round(min(progress, 1.0) * 7) + rng.randint(0, 1)
                            else:
                                delay = rng.choice([0, 0, 0, 0, 1, -1, 1, 2])

                            actual = expected + timedelta(days=max(delay, -lead_time + 1))
                            po_rows_.append((supplier_id, product_id, order_qty, wk, expected, actual))
                            pending.append([week_start(actual), order_qty])
                            order_count += 1

                    order_count_by_product[product_id] = order_count

                return po_rows_, snapshot_rows_, order_count_by_product

            # --- pass 1: simulate with no drift, to see REAL order frequency
            # per product under the honest, stock-responsive policy. Two
            # earlier proxy heuristics (average demand, then + recent-sales-
            # activity) both failed to reliably predict this — the discrete,
            # rounding-driven reorder cadence this policy produces isn't
            # something you can guess from demand alone.
            _, _, order_count_baseline = simulate(drift_start_index_by_product={})

            MIN_ORDERS_FOR_DRIFT_DEMO = 10  # comfortably above the detector's own minimum of 6
            eligible_products = [
                pid for pid, count in order_count_baseline.items()
                if count >= MIN_ORDERS_FOR_DRIFT_DEMO
            ]
            drift_products = rng.sample(eligible_products, min(DRIFT_SUPPLIER_COUNT, len(eligible_products)))
            drift_supplier_ids = {primary_supplier_by_product[pid] for pid in drift_products}
            drift_start_index_by_product = {
                pid: max(0, order_count_baseline[pid] - RAMP_LENGTH) for pid in drift_products
            }

            if drift_supplier_ids:
                cur.execute(
                    "UPDATE supplier SET engineered_drift_demo = true WHERE supplier_id = ANY(%s)",
                    (list(drift_supplier_ids),),
                )
            print(f"supplier: flagged {len(drift_supplier_ids)} as engineered_drift_demo "
                  f"(from {len(eligible_products)} products with >= {MIN_ORDERS_FOR_DRIFT_DEMO} real orders)")

            # --- pass 2: simulate for real, now that we know which products'
            # last few orders should actually drift ---
            po_rows, snapshot_rows, _ = simulate(drift_start_index_by_product)

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
