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
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import settings

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
