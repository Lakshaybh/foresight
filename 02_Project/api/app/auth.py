"""
Verifies the Supabase-issued JWT the Next.js frontend already holds — this
API has no login of its own, it trusts Supabase Auth as the identity
provider and checks the token's signature itself rather than trusting
whatever user_id a caller claims. Required before any endpoint writes to a
business-critical table (CLAUDE.md: "never let a model write directly to
critical business tables — always through a controlled service layer").

Signature verification uses Supabase's public JWKS endpoint (asymmetric
keys — this project's publishable/secret key pair implies the newer
Supabase key system, which signs tokens asymmetrically), not a shared
secret, so nothing sensitive needs to live in this service's own config.
"""

from __future__ import annotations

import jwt
import psycopg
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings
from app.db import get_connection

_bearer = HTTPBearer(auto_error=False)
_jwks_client = jwt.PyJWKClient(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json")


def get_current_user_id(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> str:
    if credentials is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token")

    token = credentials.credentials
    try:
        signing_key = _jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
        )
    except jwt.PyJWTError as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, f"Invalid token: {e}") from e

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Token missing subject")
    return user_id


def require_admin(
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> str:
    """Same identity check as get_current_user_id, plus a real role lookup —
    used for platform-operator endpoints (impact stats, viewing another
    tenant's data). A valid token alone is never enough for these; the
    caller's own user_account.role must actually say admin."""
    with conn.cursor() as cur:
        cur.execute("SELECT role FROM user_account WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
    if not row or row[0] != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Admin access required")
    return user_id


def get_effective_tenant_id(
    as_tenant: str | None = None,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> str:
    """For read endpoints only: an admin may pass ?as_tenant=<id> to view
    another tenant's data (support/debugging) — validated server-side
    against their real role, never trusted from the query alone. Anyone
    else always gets their own id regardless of what they pass."""
    if as_tenant is None or as_tenant == user_id:
        return user_id

    with conn.cursor() as cur:
        cur.execute("SELECT role FROM user_account WHERE user_id = %s", (user_id,))
        row = cur.fetchone()
    if not row or row[0] != "admin":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Only an admin can view another tenant's data")
    return as_tenant
