"""
Find-or-create helpers, scoped to one tenant. A CSV upload names things by
their human label ("Acme Supplies," "Blue Widget") — these resolve that
name to the tenant's existing row if one already matches, or create a new
one, so re-uploading a corrected file doesn't spawn duplicate suppliers or
products every time.
"""

from __future__ import annotations


def get_or_create_category(cur, tenant_id: str, name: str) -> str:
    cur.execute(
        "SELECT category_id FROM product_category WHERE tenant_id = %s AND category_name = %s",
        (tenant_id, name),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO product_category (tenant_id, category_name) VALUES (%s, %s) RETURNING category_id",
        (tenant_id, name),
    )
    return cur.fetchone()[0]


def get_or_create_product(cur, tenant_id: str, category_id: str, name: str, unit_cost: float, list_price: float) -> str:
    cur.execute(
        "SELECT product_id FROM product WHERE tenant_id = %s AND name = %s",
        (tenant_id, name),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        """
        INSERT INTO product (tenant_id, category_id, name, unit_cost, list_price)
        VALUES (%s, %s, %s, %s, %s) RETURNING product_id
        """,
        (tenant_id, category_id, name, unit_cost, list_price),
    )
    return cur.fetchone()[0]


def get_or_create_supplier(cur, tenant_id: str, name: str) -> str:
    cur.execute(
        "SELECT supplier_id FROM supplier WHERE tenant_id = %s AND name = %s",
        (tenant_id, name),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO supplier (tenant_id, name) VALUES (%s, %s) RETURNING supplier_id",
        (tenant_id, name),
    )
    return cur.fetchone()[0]


def get_or_create_default_customer(cur, tenant_id: str) -> str:
    """The customer table has no name field at all (by design — no
    individual identities are tracked, see 0001's schema comment). A
    small-business sales upload has no per-customer breakdown to give
    either, so every sale for a tenant is attributed to one shared
    placeholder customer row, just to satisfy sales_order's real
    customer_id foreign key."""
    cur.execute("SELECT customer_id FROM customer WHERE tenant_id = %s LIMIT 1", (tenant_id,))
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute("INSERT INTO customer (tenant_id) VALUES (%s) RETURNING customer_id", (tenant_id,))
    return cur.fetchone()[0]


def get_or_create_warehouse(cur, tenant_id: str, name: str) -> str:
    cur.execute(
        "SELECT warehouse_id FROM warehouse WHERE tenant_id = %s AND name = %s",
        (tenant_id, name),
    )
    row = cur.fetchone()
    if row:
        return row[0]
    cur.execute(
        "INSERT INTO warehouse (tenant_id, name) VALUES (%s, %s) RETURNING warehouse_id",
        (tenant_id, name),
    )
    return cur.fetchone()[0]
