"""
CSV upload endpoints — how a real business's own data gets into the
system, replacing the local-script-only DataCo/synthetic loading path.
Every row is tagged with the uploading user's own id as tenant_id, so
their signals/decisions are never mixed with anyone else's or with the
shared demo data (which has tenant_id = NULL).

Best-effort per row: one malformed row doesn't fail the whole file — it's
reported back so the business can fix and re-upload just what's wrong,
rather than guessing which of 500 rows broke it.
"""

from __future__ import annotations

import csv
import io
from datetime import date

import psycopg
from fastapi import APIRouter, Depends, UploadFile
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.db import get_connection
from app.ingest.helpers import (
    get_or_create_category,
    get_or_create_default_customer,
    get_or_create_product,
    get_or_create_supplier,
    get_or_create_warehouse,
)

router = APIRouter(prefix="/ingest", tags=["ingest"])


class RowError(BaseModel):
    row: int
    message: str


class IngestResult(BaseModel):
    inserted: int
    errors: list[RowError]


def _parse_date(value: str) -> date:
    return date.fromisoformat(value.strip())


async def _read_csv_rows(file: UploadFile) -> list[dict[str, str]]:
    raw = (await file.read()).decode("utf-8-sig")
    return list(csv.DictReader(io.StringIO(raw)))


@router.post("/suppliers", response_model=IngestResult)
async def ingest_suppliers(
    file: UploadFile,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> IngestResult:
    """Expected columns: supplier_name, category_name, product_name,
    unit_cost, list_price, order_date, expected_delivery_date,
    actual_delivery_date, quantity_ordered. Dates as YYYY-MM-DD;
    actual_delivery_date may be blank for an order still in transit."""
    rows = await _read_csv_rows(file)
    inserted = 0
    errors: list[RowError] = []

    with conn.cursor() as cur:
        for i, row in enumerate(rows, start=2):  # row 1 is the header
            try:
                category_id = get_or_create_category(cur, user_id, row["category_name"].strip())
                product_id = get_or_create_product(
                    cur, user_id, category_id, row["product_name"].strip(),
                    float(row["unit_cost"]), float(row["list_price"]),
                )
                supplier_id = get_or_create_supplier(cur, user_id, row["supplier_name"].strip())

                actual = row.get("actual_delivery_date", "").strip()
                cur.execute(
                    """
                    INSERT INTO purchase_order
                        (tenant_id, supplier_id, product_id, quantity_ordered,
                         order_date, expected_delivery_date, actual_delivery_date)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        user_id, supplier_id, product_id, int(row["quantity_ordered"]),
                        _parse_date(row["order_date"]), _parse_date(row["expected_delivery_date"]),
                        _parse_date(actual) if actual else None,
                    ),
                )
                inserted += 1
            except (KeyError, ValueError) as e:
                errors.append(RowError(row=i, message=str(e)))

        conn.commit()

    return IngestResult(inserted=inserted, errors=errors)


@router.post("/sales", response_model=IngestResult)
async def ingest_sales(
    file: UploadFile,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> IngestResult:
    """Expected columns: product_name, quantity, unit_price, order_date.
    Products are expected to already exist from a suppliers upload."""
    rows = await _read_csv_rows(file)
    inserted = 0
    errors: list[RowError] = []

    with conn.cursor() as cur:
        customer_id = get_or_create_default_customer(cur, user_id)

        for i, row in enumerate(rows, start=2):
            try:
                cur.execute(
                    "SELECT product_id FROM product WHERE tenant_id = %s AND name = %s",
                    (user_id, row["product_name"].strip()),
                )
                product_row = cur.fetchone()
                if not product_row:
                    raise ValueError(f"Unknown product '{row['product_name']}' — upload suppliers/products first")
                product_id = product_row[0]

                cur.execute(
                    """
                    INSERT INTO sales_order (tenant_id, order_date, customer_id, order_status)
                    VALUES (%s, %s, %s, 'COMPLETE') RETURNING order_id
                    """,
                    (user_id, _parse_date(row["order_date"]), customer_id),
                )
                order_id = cur.fetchone()[0]

                cur.execute(
                    """
                    INSERT INTO order_item (tenant_id, order_id, product_id, quantity, unit_price)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (user_id, order_id, product_id, int(row["quantity"]), float(row["unit_price"])),
                )
                inserted += 1
            except (KeyError, ValueError) as e:
                errors.append(RowError(row=i, message=str(e)))

        conn.commit()

    return IngestResult(inserted=inserted, errors=errors)


@router.post("/inventory", response_model=IngestResult)
async def ingest_inventory(
    file: UploadFile,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> IngestResult:
    """Expected columns: product_name, warehouse_name, snapshot_date,
    stock_on_hand, safety_stock_level, avg_daily_demand."""
    rows = await _read_csv_rows(file)
    inserted = 0
    errors: list[RowError] = []

    with conn.cursor() as cur:
        for i, row in enumerate(rows, start=2):
            try:
                # Products referenced here are expected to already exist
                # from a suppliers upload — inventory alone has no price/
                # category info to create one honestly.
                cur.execute(
                    "SELECT product_id FROM product WHERE tenant_id = %s AND name = %s",
                    (user_id, row["product_name"].strip()),
                )
                product_row = cur.fetchone()
                if not product_row:
                    raise ValueError(f"Unknown product '{row['product_name']}' — upload suppliers/products first")
                product_id = product_row[0]

                warehouse_id = get_or_create_warehouse(cur, user_id, row["warehouse_name"].strip())

                cur.execute(
                    """
                    INSERT INTO inventory_snapshot
                        (tenant_id, product_id, warehouse_id, snapshot_date,
                         stock_on_hand, safety_stock_level, avg_daily_demand)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    ON CONFLICT (product_id, warehouse_id, snapshot_date) DO UPDATE SET
                        stock_on_hand = excluded.stock_on_hand,
                        safety_stock_level = excluded.safety_stock_level,
                        avg_daily_demand = excluded.avg_daily_demand
                    """,
                    (
                        user_id, product_id, warehouse_id, _parse_date(row["snapshot_date"]),
                        int(row["stock_on_hand"]), int(row["safety_stock_level"]), float(row["avg_daily_demand"]),
                    ),
                )
                inserted += 1
            except (KeyError, ValueError) as e:
                errors.append(RowError(row=i, message=str(e)))

        conn.commit()

    return IngestResult(inserted=inserted, errors=errors)
