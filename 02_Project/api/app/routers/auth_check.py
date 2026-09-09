"""
Pre-login check: does this email already have an account, and has it set a
password? The login page uses this to decide whether to show the
first-time OTP-verify flow or the returning-user password field — without
it, the frontend would have no way to tell the two apart before Supabase
Auth itself rejects an attempt.

Deliberately unauthenticated (there's no session yet at this point in the
flow) and deliberately minimal in what it returns — existence and
has-a-password, nothing else about the account. This is an email-enumeration
oracle by design (that's the point of the feature the user asked for); kept
narrow rather than expanded to leak anything more.
"""

from __future__ import annotations

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_connection

router = APIRouter(prefix="/auth", tags=["auth"])


class CheckEmailRequest(BaseModel):
    # Plain str, not EmailStr — validating shape isn't the concern here
    # (Supabase itself validates on actual send), and EmailStr would pull
    # in the email-validator dependency for one field.
    email: str


class CheckEmailResponse(BaseModel):
    exists: bool
    has_password: bool


@router.post("/check-email")
def check_email(
    payload: CheckEmailRequest,
    conn: psycopg.Connection = Depends(get_connection),
) -> CheckEmailResponse:
    with conn.cursor() as cur:
        cur.execute(
            "SELECT encrypted_password FROM auth.users WHERE lower(email) = lower(%s)",
            (payload.email,),
        )
        row = cur.fetchone()

    if row is None:
        return CheckEmailResponse(exists=False, has_password=False)
    return CheckEmailResponse(exists=True, has_password=bool(row[0]))
