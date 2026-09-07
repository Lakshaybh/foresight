"""
Stockout risk forecast — the "what happens next" half of the one decision
workflow this MVP proves (detection covers "what changed").

Baseline method only (per the catalog's credibility rule — show the simple
formula, don't hide behind a model): for each product,

    effective_lead_time = the product's supplier's normal lead time
                           + any currently-detected lead-time drift
    required_days        = effective_lead_time + a fixed safety buffer
    days_of_stock_remaining = current stock_on_hand / avg_daily_demand
    risk_score            = 0 if days remaining comfortably covers the
                             required days, ramping to 1 as it falls short

This deliberately reuses the detection engine's own output (the supplier's
most recent lead_time_drift_days signal) rather than recomputing drift
independently — this is the literal "what changed -> what happens next"
link the product is built around.
"""

from __future__ import annotations

from dataclasses import dataclass

SAFETY_BUFFER_DAYS = 2.0
RISK_SIGNAL_THRESHOLD = 0.3  # only worth surfacing as a signal above this


@dataclass
class StockoutForecast:
    product_id: str
    snapshot_date: str
    stock_on_hand: float
    avg_daily_demand: float
    days_of_stock_remaining: float
    supplier_id: str | None
    baseline_lead_time_days: float
    current_drift_days: float
    effective_lead_time_days: float
    required_days: float
    risk_score: float


def compute_forecast(cur) -> list[StockoutForecast]:
    cur.execute("""
        SELECT DISTINCT ON (product_id)
            product_id, snapshot_date, stock_on_hand, avg_daily_demand
        FROM inventory_snapshot
        ORDER BY product_id, snapshot_date DESC
    """)
    latest_snapshot = {
        row[0]: {"snapshot_date": row[1], "stock_on_hand": float(row[2]), "avg_daily_demand": float(row[3])}
        for row in cur.fetchall()
    }

    cur.execute("""
        SELECT DISTINCT ON (product_id) product_id, supplier_id
        FROM purchase_order
        ORDER BY product_id, order_date DESC
    """)
    supplier_by_product = dict(cur.fetchall())

    cur.execute("""
        SELECT supplier_id, AVG(expected_delivery_date - order_date)
        FROM purchase_order
        GROUP BY supplier_id
    """)
    baseline_lead_time_by_supplier = {row[0]: float(row[1]) for row in cur.fetchall()}

    cur.execute("""
        SELECT DISTINCT ON (entity_id) entity_id, baseline_value, observed_value, detected_at
        FROM signal
        WHERE entity_type = 'supplier' AND metric = 'lead_time_drift_days'
        ORDER BY entity_id, detected_at DESC
    """)
    drift_by_supplier = {
        row[0]: max(0.0, float(row[2]) - float(row[1]))
        for row in cur.fetchall()
    }

    results = []
    for product_id, snap in latest_snapshot.items():
        if snap["avg_daily_demand"] <= 0:
            continue  # no meaningful demand signal to forecast against

        supplier_id = supplier_by_product.get(product_id)
        baseline_lead_time = baseline_lead_time_by_supplier.get(supplier_id, 7.0) if supplier_id else 7.0
        current_drift = drift_by_supplier.get(supplier_id, 0.0) if supplier_id else 0.0
        effective_lead_time = baseline_lead_time + current_drift
        required_days = effective_lead_time + SAFETY_BUFFER_DAYS

        days_remaining = snap["stock_on_hand"] / snap["avg_daily_demand"]

        if days_remaining <= 0:
            risk_score = 1.0
        else:
            risk_score = max(0.0, min(1.0, 1 - (days_remaining / required_days)))

        results.append(StockoutForecast(
            product_id=product_id,
            snapshot_date=str(snap["snapshot_date"]),
            stock_on_hand=snap["stock_on_hand"],
            avg_daily_demand=round(snap["avg_daily_demand"], 2),
            days_of_stock_remaining=round(days_remaining, 1),
            supplier_id=supplier_id,
            baseline_lead_time_days=round(baseline_lead_time, 1),
            current_drift_days=round(current_drift, 1),
            effective_lead_time_days=round(effective_lead_time, 1),
            required_days=round(required_days, 1),
            risk_score=round(risk_score, 3),
        ))

    return results


METRIC_NAME = "stockout_risk"


def persist_risk_signals(cur, forecasts: list[StockoutForecast], threshold: float = RISK_SIGNAL_THRESHOLD) -> tuple[int, int]:
    """Idempotent insert, same pattern as detection.persist_signals: won't
    duplicate a signal for the same product + metric on the same day. Only
    forecasts at or above the risk threshold are worth surfacing."""
    inserted = 0
    skipped = 0
    for f in forecasts:
        if f.risk_score < threshold:
            continue

        cur.execute(
            """
            SELECT 1 FROM signal
            WHERE entity_type = 'product' AND entity_id = %s AND metric = %s
              AND detected_at::date = CURRENT_DATE
            """,
            (f.product_id, METRIC_NAME),
        )
        if cur.fetchone():
            skipped += 1
            continue

        cur.execute(
            """
            INSERT INTO signal
                (entity_type, entity_id, metric, baseline_value, observed_value, deviation, detected_at)
            VALUES ('product', %s, %s, %s, %s, %s, now())
            """,
            (f.product_id, METRIC_NAME, f.required_days, f.days_of_stock_remaining, f.risk_score),
        )
        inserted += 1

    return inserted, skipped
