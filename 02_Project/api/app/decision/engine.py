"""
Decision engine: turns a signal into exactly one of the five catalog actions
(01_Documents/Entities_KPIs_Decision_Catalog.md, Section 5). This is the last
step of the one workflow this MVP proves — detect -> forecast -> decide ->
(human approves) -> track outcome.

Every decision maps to exactly one catalog action. If a future signal type
doesn't fit one of these five, that's a sign the catalog needs a deliberate
update — never a reason to invent a sixth action ad hoc (see the catalog
doc's closing rule).

Confidence, not just a raw statistic, decides whether something becomes a
real recommendation or just "monitor" — a low-confidence signal becomes
"monitor," never a false-certainty action (CLAUDE.md, non-negotiable
principles).
"""

from __future__ import annotations

from dataclasses import dataclass, field

CONFIDENCE_THRESHOLD = 0.4


@dataclass
class DecisionResult:
    signal_id: str
    action_type: str
    confidence: float
    owner_role: str
    evidence: dict = field(default_factory=dict)


def _confidence_for_lead_time_drift(deviation: float) -> float:
    """deviation is the modified z-score from the detection engine. The
    detector's own threshold is 3.5 (see app/detection/supplier_lead_time.py)
    — a signal only exists at all above that, so confidence starts around
    0.35 there and climbs toward 1.0 for more extreme drift."""
    return round(min(1.0, deviation / 10), 3)


def _confidence_for_stockout_risk(risk_score: float) -> float:
    """risk_score is already a well-defined 0-1 value from the forecast
    engine — used directly as confidence, no further transformation."""
    return round(risk_score, 3)


def decide_for_signal(cur, signal_row: tuple) -> DecisionResult:
    signal_id, entity_type, entity_id, metric, baseline_value, observed_value, deviation = signal_row

    if metric == "lead_time_drift_days":
        confidence = _confidence_for_lead_time_drift(float(deviation))
        evidence = {
            "metric": metric,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "baseline_value": float(baseline_value),
            "observed_value": float(observed_value),
            "deviation_zscore": float(deviation),
        }

        if confidence < CONFIDENCE_THRESHOLD:
            return DecisionResult(str(signal_id), "monitor", confidence, "system", evidence)

        cur.execute(
            """
            SELECT d.decision_id, s.deviation
            FROM decision d
            JOIN signal s ON s.signal_id = d.signal_id
            WHERE s.entity_type = 'supplier' AND s.entity_id = %s
              AND d.action_type = 'escalate_supplier'
            ORDER BY d.created_at DESC
            LIMIT 1
            """,
            (entity_id,),
        )
        prior = cur.fetchone()

        if prior is not None and float(deviation) >= float(prior[1]):
            action = "shift_to_backup_supplier"
        else:
            action = "escalate_supplier"

        return DecisionResult(str(signal_id), action, confidence, "ops_manager", evidence)

    if metric == "stockout_risk":
        risk_score = float(deviation)
        confidence = _confidence_for_stockout_risk(risk_score)
        evidence = {
            "metric": metric,
            "entity_type": entity_type,
            "entity_id": str(entity_id),
            "required_days": float(baseline_value),
            "days_of_stock_remaining": float(observed_value),
            "risk_score": risk_score,
        }

        action = "reorder_now" if confidence >= CONFIDENCE_THRESHOLD else "monitor"
        return DecisionResult(str(signal_id), action, confidence, "ops_manager", evidence)

    # A signal type outside the current catalog scope. Per CLAUDE.md, no
    # signal type ships until the one locked workflow is proven — this
    # branch should be unreachable given what run_detection/run_forecast
    # currently produce, but fails loudly rather than silently guessing.
    raise ValueError(f"No decision mapping defined for signal metric '{metric}'")


def run_decision_engine(cur) -> list[DecisionResult]:
    """Only considers signals that don't already have a decision — each
    signal gets exactly one decision, ever."""
    cur.execute("""
        SELECT s.signal_id, s.entity_type, s.entity_id, s.metric,
               s.baseline_value, s.observed_value, s.deviation
        FROM signal s
        WHERE NOT EXISTS (SELECT 1 FROM decision d WHERE d.signal_id = s.signal_id)
        ORDER BY s.detected_at
    """)
    rows = cur.fetchall()
    return [decide_for_signal(cur, row) for row in rows]


def persist_decisions(cur, decisions: list[DecisionResult]) -> int:
    from psycopg.types.json import Jsonb

    for d in decisions:
        cur.execute(
            """
            INSERT INTO decision
                (signal_id, action_type, evidence, confidence, status, owner_role)
            VALUES (%s, %s, %s, %s, 'open', %s)
            """,
            (d.signal_id, d.action_type, Jsonb(d.evidence), d.confidence, d.owner_role),
        )
    return len(decisions)
