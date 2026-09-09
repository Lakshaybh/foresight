from datetime import datetime
from typing import Literal

import psycopg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user_id, get_effective_tenant_id
from app.db import get_connection
from app.decision.engine import persist_decisions, run_decision_engine
from app.notify import URGENT_CONFIDENCE_THRESHOLD, send_urgent_alert

router = APIRouter(prefix="/decisions", tags=["decisions"])


class Decision(BaseModel):
    decision_id: str
    signal_id: str
    action_type: str
    evidence: dict
    entity_name: str | None
    confidence: float
    status: str
    owner_role: str
    created_at: datetime
    resolved_at: datetime | None
    outcome: str | None


class RunResult(BaseModel):
    created: int


class ReviewRequest(BaseModel):
    status: Literal["approved", "rejected", "snoozed"]


class OutcomeRequest(BaseModel):
    # Human-recorded ground truth, not a system guess — CLAUDE.md forbids
    # fabricating outcomes, so this is filled in by whoever actually
    # observed what happened, on their own schedule, not computed here.
    outcome: str


def _resolve_entity_name(cur, evidence: dict, cache: dict[tuple[str, str], str | None]) -> str | None:
    """A decision's evidence carries an internal entity_id (a UUID) — not
    something a shop owner can read. This resolves it to the actual
    supplier or product name, so "this supplier is late" can say which
    one. Cached per request since the same supplier/product recurs across
    several decisions."""
    entity_type = evidence.get("entity_type")
    entity_id = evidence.get("entity_id")
    if not entity_type or not entity_id:
        return None

    key = (entity_type, entity_id)
    if key in cache:
        return cache[key]

    table = {"supplier": "supplier", "product": "product"}.get(entity_type)
    if table is None:
        cache[key] = None
        return None

    cur.execute(f"SELECT name FROM {table} WHERE {table}_id = %s", (entity_id,))  # noqa: S608 — table is from a fixed allowlist above, not user input
    row = cur.fetchone()
    name = row[0] if row else None
    cache[key] = name
    return name


def _row_to_decision(r: tuple, entity_name: str | None) -> Decision:
    return Decision(
        decision_id=str(r[0]), signal_id=str(r[1]), action_type=r[2], evidence=r[3], entity_name=entity_name,
        confidence=float(r[4]), status=r[5], owner_role=r[6], created_at=r[7],
        resolved_at=r[8], outcome=r[9],
    )


_SELECT_COLUMNS = """
    decision_id, signal_id, action_type, evidence, confidence,
    status, owner_role, created_at, resolved_at, outcome
"""


@router.get("", response_model=list[Decision])
def list_decisions(
    tenant_id: str = Depends(get_effective_tenant_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[Decision]:
    with conn.cursor() as cur:
        cur.execute(
            f"SELECT {_SELECT_COLUMNS} FROM decision WHERE tenant_id = %s ORDER BY created_at DESC",
            (tenant_id,),
        )
        rows = cur.fetchall()

        name_cache: dict[tuple[str, str], str | None] = {}
        return [_row_to_decision(r, _resolve_entity_name(cur, r[3], name_cache)) for r in rows]


@router.post("/run", response_model=RunResult)
def run(
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> RunResult:
    with conn.cursor() as cur:
        decisions = run_decision_engine(cur, tenant_id=user_id)
        created = persist_decisions(cur, decisions, tenant_id=user_id)
        conn.commit()

        # Urgent signals get emailed, not just saved for someone to
        # eventually notice — this is what makes the product tap the
        # owner's shoulder instead of waiting to be checked on.
        urgent = [d for d in decisions if d.confidence >= URGENT_CONFIDENCE_THRESHOLD and d.action_type != "monitor"]
        if urgent:
            cur.execute("SELECT email FROM user_account WHERE user_id = %s", (user_id,))
            email_row = cur.fetchone()
            if email_row:
                name_cache: dict[tuple[str, str], str | None] = {}
                for d in urgent:
                    entity_name = _resolve_entity_name(cur, d.evidence, name_cache) or "An item in your data"
                    send_urgent_alert(email_row[0], d.action_type, entity_name, d.confidence, d.evidence)

    return RunResult(created=created)


def _check_owned_by(cur, decision_id: str, user_id: str) -> str:
    """Returns the decision's current status, or raises if it doesn't
    exist or belongs to a different tenant — reviewing someone else's
    decision is never allowed, not even by omission."""
    cur.execute("SELECT status, tenant_id FROM decision WHERE decision_id = %s", (decision_id,))
    row = cur.fetchone()
    if row is None:
        raise HTTPException(404, "Decision not found")
    if row[1] != user_id:
        raise HTTPException(404, "Decision not found")
    return row[0]


@router.patch("/{decision_id}/review", response_model=Decision)
def review_decision(
    decision_id: str,
    body: ReviewRequest,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> Decision:
    """The human-in-the-loop step CLAUDE.md requires: a person approves,
    rejects, or snoozes — never the model deciding for itself. Only an
    'open' decision can be reviewed, and only once; reviewing again means
    creating a fresh decision, not silently overwriting an audit record."""
    with conn.cursor() as cur:
        status = _check_owned_by(cur, decision_id, user_id)
        if status != "open":
            raise HTTPException(409, f"Decision is already '{status}', not open for review")

        cur.execute(
            f"""
            UPDATE decision
            SET status = %s, reviewed_by_user_id = %s, resolved_at = now()
            WHERE decision_id = %s
            RETURNING {_SELECT_COLUMNS}
            """,
            (body.status, user_id, decision_id),
        )
        updated = cur.fetchone()
        entity_name = _resolve_entity_name(cur, updated[3], {})
        conn.commit()

    return _row_to_decision(updated, entity_name)


@router.patch("/{decision_id}/outcome", response_model=Decision)
def record_outcome(
    decision_id: str,
    body: OutcomeRequest,
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> Decision:
    """Records what actually happened, after the fact — separate from the
    review step above since an outcome is only knowable once time has
    passed (e.g. did the stockout actually get avoided). Requires the
    decision to have already been reviewed; an outcome for something never
    acted on isn't a real observation."""
    with conn.cursor() as cur:
        status = _check_owned_by(cur, decision_id, user_id)
        if status == "open":
            raise HTTPException(
                409, "Decision must be reviewed (approved/rejected/snoozed) before an outcome can be recorded"
            )

        cur.execute(
            f"""
            UPDATE decision SET outcome = %s WHERE decision_id = %s
            RETURNING {_SELECT_COLUMNS}
            """,
            (body.outcome, decision_id),
        )
        updated = cur.fetchone()
        entity_name = _resolve_entity_name(cur, updated[3], {})
        conn.commit()

    return _row_to_decision(updated, entity_name)
