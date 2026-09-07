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
from app.detection.supplier_lead_time import run_detection  # noqa: E402

METRIC_NAME = "lead_time_drift_days"


def main() -> None:
    import psycopg

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set in api/.env")

    with psycopg.connect(settings.database_url, prepare_threshold=None) as conn:
        with conn.cursor() as cur:
            signals = run_detection(cur)
            print(f"Detected {len(signals)} supplier lead-time drift signal(s).")

            inserted = 0
            skipped = 0
            for sig in signals:
                cur.execute(
                    """
                    SELECT 1 FROM signal
                    WHERE entity_type = 'supplier' AND entity_id = %s AND metric = %s
                      AND detected_at::date = CURRENT_DATE
                    """,
                    (sig.supplier_id, METRIC_NAME),
                )
                if cur.fetchone():
                    skipped += 1
                    continue

                cur.execute(
                    """
                    INSERT INTO signal
                        (entity_type, entity_id, metric, baseline_value, observed_value, deviation, detected_at)
                    VALUES ('supplier', %s, %s, %s, %s, %s, %s)
                    """,
                    (sig.supplier_id, METRIC_NAME, sig.baseline_value, sig.observed_value,
                     sig.deviation, sig.detected_at),
                )
                inserted += 1

        conn.commit()

    print(f"Inserted {inserted} new signal(s), skipped {skipped} already-detected-today.")


if __name__ == "__main__":
    main()
