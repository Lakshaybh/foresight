"""
Runs the stockout-risk forecast against live data and persists at-risk
signals into the `signal` table.

Usage:
    python scripts/run_forecast.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402
from app.forecast.stockout_risk import compute_forecast, persist_risk_signals  # noqa: E402


def main() -> None:
    import psycopg

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set in api/.env")

    with psycopg.connect(settings.database_url, prepare_threshold=None) as conn:
        with conn.cursor() as cur:
            forecasts = compute_forecast(cur)
            at_risk = [f for f in forecasts if f.risk_score >= 0.3]
            print(f"Forecast computed for {len(forecasts)} products, {len(at_risk)} at or above risk threshold.")

            for f in sorted(at_risk, key=lambda x: -x.risk_score)[:10]:
                print(f"  product={f.product_id} risk={f.risk_score} "
                      f"days_remaining={f.days_of_stock_remaining} required={f.required_days} "
                      f"drift={f.current_drift_days}")

            inserted, skipped = persist_risk_signals(cur, forecasts)

        conn.commit()

    print(f"Inserted {inserted} new signal(s), skipped {skipped} already-detected-today.")


if __name__ == "__main__":
    main()
