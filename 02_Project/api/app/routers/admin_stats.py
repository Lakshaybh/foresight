"""
Platform-operator view — real aggregates across every tenant, not one
business's own data. Admin-only (require_admin does the actual role
check; a valid token alone is not enough).
"""

from __future__ import annotations

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import require_admin
from app.db import get_connection

router = APIRouter(prefix="/admin", tags=["admin"])


class PlatformImpactOut(BaseModel):
    total_tenants: int
    total_signals: int
    total_open_decisions: int
    total_flagged_exposure: float
    total_reorder_cost: float


@router.get("/impact", response_model=PlatformImpactOut)
def platform_impact(
    _admin_id: str = Depends(require_admin),
    conn: psycopg.Connection = Depends(get_connection),
) -> PlatformImpactOut:
    with conn.cursor() as cur:
        cur.execute("SELECT COUNT(*) FROM user_account WHERE role = 'user' AND status = 'approved'")
        total_tenants = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM signal WHERE tenant_id IS NOT NULL")
        total_signals = cur.fetchone()[0]

        cur.execute("SELECT COUNT(*) FROM decision WHERE tenant_id IS NOT NULL AND status = 'open'")
        total_open_decisions = cur.fetchone()[0]

        # Real numbers pulled straight out of each decision's own evidence
        # (the same figures shown to the tenant that owns them) — summed
        # across everyone, not a separate estimate.
        cur.execute(
            """
            SELECT
                COALESCE(SUM((evidence->>'lost_revenue_if_no_action')::numeric), 0),
                COALESCE(SUM((evidence->>'reorder_cost')::numeric), 0)
            FROM decision
            WHERE tenant_id IS NOT NULL AND action_type = 'reorder_now'
            """
        )
        total_exposure, total_reorder_cost = cur.fetchone()

    return PlatformImpactOut(
        total_tenants=total_tenants,
        total_signals=total_signals,
        total_open_decisions=total_open_decisions,
        total_flagged_exposure=round(float(total_exposure), 2),
        total_reorder_cost=round(float(total_reorder_cost), 2),
    )
