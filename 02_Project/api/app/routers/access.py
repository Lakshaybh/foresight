"""
Authenticated actions around a lapsed account — right now, just the
re-access request sent from /access-expired. Separate from auth_check.py
(which runs pre-login, unauthenticated) since this requires a real signed-in
user asking on their own behalf.
"""

from __future__ import annotations

import psycopg
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.db import get_connection
from app.notify import send_payment_link_request, send_reaccess_request

router = APIRouter(prefix="/access", tags=["access"])

VALID_PLANS = {"starter", "growth", "enterprise"}


class ReaccessRequest(BaseModel):
    plan: str


@router.post("/request-reaccess")
def request_reaccess(
    payload: ReaccessRequest,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, bool]:
    if payload.plan not in VALID_PLANS:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid plan")

    with conn.cursor() as cur:
        cur.execute(
            "UPDATE user_account SET requested_plan = %s WHERE user_id = %s RETURNING email",
            (payload.plan, user_id),
        )
        row = cur.fetchone()
        conn.commit()

    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")

    sent = send_reaccess_request(row[0], payload.plan)
    return {"sent": sent}


@router.post("/request-payment-link")
def request_payment_link(
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> dict[str, bool]:
    with conn.cursor() as cur:
        cur.execute("SELECT email, requested_plan FROM user_account WHERE user_id = %s", (user_id,))
        row = cur.fetchone()

    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Account not found")

    sent = send_payment_link_request(row[0], row[1])
    return {"sent": sent}
