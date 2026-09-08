"""
Read-only views over a tenant's own uploaded data, for the Suppliers,
Sales, and Inventory dashboard pages — plain aggregates over real rows,
nothing modeled or predicted here (that's detection/forecast's job).
"""

from __future__ import annotations

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.db import get_connection

router = APIRouter(tags=["business-data"])


class SupplierOut(BaseModel):
    supplier_id: str
    name: str
    order_count: int
    avg_lead_time_days: float | None
    latest_drift_days: float | None
    latest_drift_detected_at: str | None


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
    product_name: str
    warehouse_name: str
    snapshot_date: str
    stock_on_hand: int
    safety_stock_level: int
    avg_daily_demand: float
    days_remaining: float | None


@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(
    user_id: str = Depends(get_current_user_id),
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
            (user_id, user_id),
        )
        suppliers = cur.fetchall()

        results = []
        for supplier_id, name, order_count, avg_lead_time in suppliers:
            cur.execute(
                """
                SELECT deviation, detected_at FROM signal
                WHERE entity_type = 'supplier' AND entity_id = %s AND metric = 'lead_time_drift_days'
                  AND tenant_id = %s
                ORDER BY detected_at DESC LIMIT 1
                """,
                (supplier_id, user_id),
            )
            drift_row = cur.fetchone()
            results.append(SupplierOut(
                supplier_id=str(supplier_id),
                name=name,
                order_count=order_count,
                avg_lead_time_days=round(float(avg_lead_time), 1) if avg_lead_time is not None else None,
                latest_drift_days=round(float(drift_row[0]), 2) if drift_row else None,
                latest_drift_detected_at=drift_row[1].isoformat() if drift_row else None,
            ))

    return results


@router.get("/sales/summary", response_model=SalesSummaryOut)
def sales_summary(
    days: int = 30,
    user_id: str = Depends(get_current_user_id),
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
            (user_id, days),
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
            (user_id, days),
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
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[InventoryItemOut]:
    with conn.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT ON (inv.product_id, inv.warehouse_id)
                p.name, w.name, inv.snapshot_date, inv.stock_on_hand, inv.safety_stock_level, inv.avg_daily_demand
            FROM inventory_snapshot inv
            JOIN product p ON p.product_id = inv.product_id
            JOIN warehouse w ON w.warehouse_id = inv.warehouse_id
            WHERE inv.tenant_id = %s
            ORDER BY inv.product_id, inv.warehouse_id, inv.snapshot_date DESC
            """,
            (user_id,),
        )
        rows = cur.fetchall()

    results = []
    for product_name, warehouse_name, snapshot_date, stock_on_hand, safety_stock_level, avg_daily_demand in rows:
        demand = float(avg_daily_demand)
        days_remaining = round(float(stock_on_hand) / demand, 1) if demand > 0 else None
        results.append(InventoryItemOut(
            product_name=product_name, warehouse_name=warehouse_name, snapshot_date=snapshot_date.isoformat(),
            stock_on_hand=stock_on_hand, safety_stock_level=safety_stock_level, avg_daily_demand=demand,
            days_remaining=days_remaining,
        ))

    return results
