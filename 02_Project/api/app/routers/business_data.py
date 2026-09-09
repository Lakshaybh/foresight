"""
Read-only views over a tenant's own uploaded data, for the Suppliers,
Sales, and Inventory dashboard pages — plain aggregates over real rows,
nothing modeled or predicted here (that's detection/forecast's job).
"""

from __future__ import annotations

from collections import defaultdict

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import get_effective_tenant_id
from app.db import get_connection

router = APIRouter(tags=["business-data"])


class SupplierOut(BaseModel):
    supplier_id: str
    name: str
    order_count: int
    avg_lead_time_days: float | None
    latest_drift_days: float | None
    latest_drift_detected_at: str | None
    faster_alternative_name: str | None
    faster_alternative_lead_time_days: float | None


class ProductSalesOut(BaseModel):
    product_name: str
    units_sold: int
    revenue: float


class SalesSummaryOut(BaseModel):
    period_days: int
    total_revenue: float
    total_units: int
    top_products: list[ProductSalesOut]


class InventoryItemOut(BaseModel):
    product_id: str
    product_name: str
    warehouse_name: str
    snapshot_date: str
    stock_on_hand: int
    safety_stock_level: int
    avg_daily_demand: float
    days_remaining: float | None


class StockPointOut(BaseModel):
    snapshot_date: str
    stock_on_hand: int


class DeliveryPointOut(BaseModel):
    order_date: str
    delay_days: float


@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(
    tenant_id: str = Depends(get_effective_tenant_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[SupplierOut]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT s.supplier_id, s.name,
                   COUNT(po.po_id) AS order_count,
                   AVG(po.expected_delivery_date - po.order_date) AS avg_lead_time_days
            FROM supplier s
            LEFT JOIN purchase_order po ON po.supplier_id = s.supplier_id AND po.tenant_id = %s
            WHERE s.tenant_id = %s
            GROUP BY s.supplier_id, s.name
            ORDER BY s.name
            """,
            (tenant_id, tenant_id),
        )
        suppliers = cur.fetchall()

        # Which product categories each supplier has actually shipped —
        # the basis for "who else could cover this," not just a global
        # fastest-of-all-suppliers ranking that might compare unrelated
        # goods (a fast stationery supplier isn't a real alternative to a
        # slow electronics one).
        cur.execute(
            """
            SELECT DISTINCT po.supplier_id, p.category_id
            FROM purchase_order po
            JOIN product p ON p.product_id = po.product_id
            WHERE po.tenant_id = %s
            """,
            (tenant_id,),
        )
        categories_by_supplier: dict[str, set[str]] = defaultdict(set)
        for supplier_id, category_id in cur.fetchall():
            categories_by_supplier[supplier_id].add(category_id)

        drift_by_supplier: dict[str, tuple[float, str]] = {}
        for supplier_id, *_ in suppliers:
            cur.execute(
                """
                SELECT deviation, detected_at FROM signal
                WHERE entity_type = 'supplier' AND entity_id = %s AND metric = 'lead_time_drift_days'
                  AND tenant_id = %s
                ORDER BY detected_at DESC LIMIT 1
                """,
                (supplier_id, tenant_id),
            )
            row = cur.fetchone()
            if row:
                drift_by_supplier[supplier_id] = (float(row[0]), row[1].isoformat())

        results = []
        for supplier_id, name, order_count, avg_lead_time in suppliers:
            lead_time = float(avg_lead_time) if avg_lead_time is not None else None
            drift = drift_by_supplier.get(supplier_id)

            # A faster alternative: another of this tenant's suppliers who
            # has shipped at least one shared category, with a genuinely
            # lower average lead time.
            alt_name, alt_lead_time = None, None
            if lead_time is not None:
                my_categories = categories_by_supplier.get(supplier_id, set())
                best = None
                for other_id, other_name, _, other_avg in suppliers:
                    if other_id == supplier_id or other_avg is None:
                        continue
                    if not (categories_by_supplier.get(other_id, set()) & my_categories):
                        continue
                    other_lead_time = float(other_avg)
                    if other_lead_time < lead_time and (best is None or other_lead_time < best[1]):
                        best = (other_name, other_lead_time)
                if best:
                    alt_name, alt_lead_time = best[0], round(best[1], 1)

            results.append(SupplierOut(
                supplier_id=str(supplier_id),
                name=name,
                order_count=order_count,
                avg_lead_time_days=round(lead_time, 1) if lead_time is not None else None,
                latest_drift_days=round(drift[0], 2) if drift else None,
                latest_drift_detected_at=drift[1] if drift else None,
                faster_alternative_name=alt_name,
                faster_alternative_lead_time_days=alt_lead_time,
            ))

    return results


@router.get("/suppliers/{supplier_id}/deliveries", response_model=list[DeliveryPointOut])
def supplier_delivery_history(
    supplier_id: str,
    tenant_id: str = Depends(get_effective_tenant_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[DeliveryPointOut]:
    """Delay per order over time — the real trend a lead-time drift signal
    is computed from, not just the two-number before/after summary."""
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT order_date, (actual_delivery_date - expected_delivery_date)
            FROM purchase_order
            WHERE supplier_id = %s AND tenant_id = %s AND actual_delivery_date IS NOT NULL
            ORDER BY order_date
            """,
            (supplier_id, tenant_id),
        )
        return [DeliveryPointOut(order_date=d.isoformat(), delay_days=float(delay)) for d, delay in cur.fetchall()]


@router.get("/sales/summary", response_model=SalesSummaryOut)
def sales_summary(
    days: int = 30,
    tenant_id: str = Depends(get_effective_tenant_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> SalesSummaryOut:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT COALESCE(SUM(oi.quantity * oi.unit_price), 0), COALESCE(SUM(oi.quantity), 0)
            FROM order_item oi
            JOIN sales_order so ON so.order_id = oi.order_id
            WHERE oi.tenant_id = %s AND so.order_date >= CURRENT_DATE - (%s || ' days')::interval
            """,
            (tenant_id, days),
        )
        total_revenue, total_units = cur.fetchone()

        cur.execute(
            """
            SELECT p.name, SUM(oi.quantity), SUM(oi.quantity * oi.unit_price)
            FROM order_item oi
            JOIN sales_order so ON so.order_id = oi.order_id
            JOIN product p ON p.product_id = oi.product_id
            WHERE oi.tenant_id = %s AND so.order_date >= CURRENT_DATE - (%s || ' days')::interval
            GROUP BY p.name
            ORDER BY SUM(oi.quantity * oi.unit_price) DESC
            LIMIT 5
            """,
            (tenant_id, days),
        )
        top_products = [
            ProductSalesOut(product_name=name, units_sold=int(units), revenue=round(float(revenue), 2))
            for name, units, revenue in cur.fetchall()
        ]

    return SalesSummaryOut(
        period_days=days,
        total_revenue=round(float(total_revenue), 2),
        total_units=int(total_units),
        top_products=top_products,
    )


@router.get("/inventory", response_model=list[InventoryItemOut])
def list_inventory(
    tenant_id: str = Depends(get_effective_tenant_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[InventoryItemOut]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT ON (inv.product_id, inv.warehouse_id)
                inv.product_id, p.name, w.name, inv.snapshot_date,
                inv.stock_on_hand, inv.safety_stock_level, inv.avg_daily_demand
            FROM inventory_snapshot inv
            JOIN product p ON p.product_id = inv.product_id
            JOIN warehouse w ON w.warehouse_id = inv.warehouse_id
            WHERE inv.tenant_id = %s
            ORDER BY inv.product_id, inv.warehouse_id, inv.snapshot_date DESC
            """,
            (tenant_id,),
        )
        rows = cur.fetchall()

    results = []
    for product_id, product_name, warehouse_name, snapshot_date, stock_on_hand, safety_stock_level, avg_daily_demand in rows:
        demand = float(avg_daily_demand)
        days_remaining = round(float(stock_on_hand) / demand, 1) if demand > 0 else None
        results.append(InventoryItemOut(
            product_id=str(product_id), product_name=product_name, warehouse_name=warehouse_name,
            snapshot_date=snapshot_date.isoformat(), stock_on_hand=stock_on_hand,
            safety_stock_level=safety_stock_level, avg_daily_demand=demand, days_remaining=days_remaining,
        ))

    return results


@router.get("/inventory/{product_id}/history", response_model=list[StockPointOut])
def inventory_history(
    product_id: str,
    tenant_id: str = Depends(get_effective_tenant_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[StockPointOut]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT snapshot_date, SUM(stock_on_hand)
            FROM inventory_snapshot
            WHERE product_id = %s AND tenant_id = %s
            GROUP BY snapshot_date
            ORDER BY snapshot_date
            """,
            (product_id, tenant_id),
        )
        return [StockPointOut(snapshot_date=d.isoformat(), stock_on_hand=int(stock)) for d, stock in cur.fetchall()]
