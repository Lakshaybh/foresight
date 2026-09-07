"""
Per-request Postgres connection. Short-lived, one per request — no pooling
library yet, since request volume doesn't justify it (added later if it
ever does, not preemptively).

prepare_threshold=None: required for Supabase's pooler (PgBouncer transaction
mode), which doesn't reliably support psycopg's automatic prepared
statements — see scripts/run_detection.py for the same fix and why.
"""

from collections.abc import Generator

import psycopg

from app.config import settings


def get_connection() -> Generator[psycopg.Connection, None, None]:
    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not configured")
    with psycopg.connect(settings.database_url, prepare_threshold=None) as conn:
        yield conn
