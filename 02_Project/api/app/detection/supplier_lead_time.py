"""
Supplier lead-time drift detection.

The one signal type this MVP proves (per 01_Documents/Entities_KPIs_Decision_
Catalog.md, Section 2 and CLAUDE.md): is a supplier's delivery performance
getting worse compared to its own history?

Baseline method (per the catalog's "Robust z-score / IQR" baseline row, not an
average-and-hope approach): a modified z-score using median and MAD (median
absolute deviation), which is far less sensitive to one-off outliers than a
plain mean/stddev z-score would be. This is the credibility rule from the
blueprint in code: show the baseline math plainly, don't hide behind a model.

No forecasting, no confidence scoring, no recommended action here - that's
the forecast engine and decision engine, built next. This module's only job
is: given real delivery history, does this supplier's recent behavior look
statistically different from its own past?
"""

from __future__ import annotations

import statistics
from dataclasses import dataclass
from datetime import date, datetime, timezone

RECENT_WINDOW = 3          # most recent purchase orders treated as "current behavior"
MIN_HISTORY = 3            # minimum historical (non-recent) observations required
Z_THRESHOLD = 3.5          # standard modified-z-score anomaly threshold
MAD_FALLBACK_MIN = 0.5     # guards against a divide-by-near-zero MAD on tightly-clustered data


@dataclass
class LeadTimeSignal:
    supplier_id: str
    baseline_value: float
    observed_value: float
    deviation: float
    detected_at: datetime


def _modified_z_scores(historical: list[float], observed_mean: float) -> tuple[float, float, float]:
    """Returns (baseline_median, deviation_from_median, modified_z_score)."""
    median_h = statistics.median(historical)
    mad_h = statistics.median([abs(x - median_h) for x in historical])
    mad_h = max(mad_h, MAD_FALLBACK_MIN)
    modified_z = 0.6745 * (observed_mean - median_h) / mad_h
    return median_h, observed_mean - median_h, modified_z


def detect_for_supplier(delay_days_by_order_date: list[tuple[date, float]]) -> LeadTimeSignal | None:
    """
    delay_days_by_order_date: [(order_date, delay_days), ...] sorted ascending
    by order_date, where delay_days = actual_delivery_date - expected_delivery_date
    (positive = late, negative = early, zero = on time).

    Returns a signal only if there's enough history to judge against, and the
    recent behavior is a statistically significant *worsening* (not just any
    deviation — a supplier getting faster is not a risk).
    """
    if len(delay_days_by_order_date) < MIN_HISTORY + RECENT_WINDOW:
        return None

    delays = [d for _, d in delay_days_by_order_date]
    historical = delays[:-RECENT_WINDOW]
    recent = delays[-RECENT_WINDOW:]

    if len(historical) < MIN_HISTORY:
        return None

    observed_mean = statistics.mean(recent)
    baseline_median, deviation, modified_z = _modified_z_scores(historical, observed_mean)

    if modified_z <= Z_THRESHOLD:
        return None

    return LeadTimeSignal(
        supplier_id="",  # filled in by the caller, which knows the supplier_id
        baseline_value=round(baseline_median, 2),
        observed_value=round(observed_mean, 2),
        deviation=round(modified_z, 2),
        detected_at=datetime.now(timezone.utc),
    )


METRIC_NAME = "lead_time_drift_days"


def persist_signals(cur, signals: list[LeadTimeSignal]) -> tuple[int, int]:
    """Idempotent insert: won't create a duplicate signal for the same
    supplier + metric on the same calendar day. Returns (inserted, skipped)."""
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

    return inserted, skipped


def run_detection(cur) -> list[LeadTimeSignal]:
    """Runs detection for every supplier with enough delivery history, against
    the live database. Does not write anything — the caller decides how to
    persist results (see scripts/run_detection.py)."""
    cur.execute("""
        SELECT supplier_id, order_date,
               (actual_delivery_date - expected_delivery_date) AS delay_days
        FROM purchase_order
        WHERE actual_delivery_date IS NOT NULL
        ORDER BY supplier_id, order_date
    """)

    by_supplier: dict[str, list[tuple[date, float]]] = {}
    for supplier_id, order_date_, delay_days in cur.fetchall():
        by_supplier.setdefault(supplier_id, []).append((order_date_, float(delay_days)))

    signals = []
    for supplier_id, rows in by_supplier.items():
        result = detect_for_supplier(rows)
        if result is not None:
            result.supplier_id = supplier_id
            signals.append(result)

    return signals
