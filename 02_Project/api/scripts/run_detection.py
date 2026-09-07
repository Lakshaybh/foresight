"""
Runs supplier lead-time drift detection against the live database and
persists any signals found into the `signal` table.

Idempotent: won't create a duplicate signal for the same supplier + metric on
the same calendar day if run more than once (blueprint SS11).

Usage:
    python scripts/run_detection.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402
from app.detection.supplier_lead_time import persist_signals, run_detection  # noqa: E402


def main() -> None:
    import psycopg

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set in api/.env")

    with psycopg.connect(settings.database_url, prepare_threshold=None) as conn:
        with conn.cursor() as cur:
            signals = run_detection(cur)
            print(f"Detected {len(signals)} supplier lead-time drift signal(s).")

            inserted, skipped = persist_signals(cur, signals)

        conn.commit()

    print(f"Inserted {inserted} new signal(s), skipped {skipped} already-detected-today.")


if __name__ == "__main__":
    main()
