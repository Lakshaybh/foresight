from datetime import datetime
from typing import Literal

import psycopg
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.db import get_connection
from app.decision.engine import persist_decisions, run_decision_engine

router = APIRouter(prefix="/decisions", tags=["decisions"])


class Decision(BaseModel):
    decision_id: str
    signal_id: str
    action_type: str
    evidence: dict
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


def _row_to_decision(r: tuple) -> Decision:
    return Decision(
        decision_id=str(r[0]), signal_id=str(r[1]), action_type=r[2], evidence=r[3],
        confidence=float(r[4]), status=r[5], owner_role=r[6], created_at=r[7],
        resolved_at=r[8], outcome=r[9],
    )


_SELECT_COLUMNS = """
    decision_id, signal_id, action_type, evidence, confidence,
    status, owner_role, created_at, resolved_at, outcome
"""


@router.get("", response_model=list[Decision])
def list_decisions(conn: psycopg.Connection = Depends(get_connection)) -> list[Decision]:
    with conn.cursor() as cur:
        cur.execute(f"SELECT {_SELECT_COLUMNS} FROM decision ORDER BY created_at DESC")
        rows = cur.fetchall()

    return [_row_to_decision(r) for r in rows]


@router.post("/run", response_model=RunResult)
def run(conn: psycopg.Connection = Depends(get_connection)) -> RunResult:
    with conn.cursor() as cur:
        decisions = run_decision_engine(cur)
        created = persist_decisions(cur, decisions)
        conn.commit()

    return RunResult(created=created)


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
        cur.execute("SELECT status FROM decision WHERE decision_id = %s", (decision_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(404, "Decision not found")
        if row[0] != "open":
            raise HTTPException(409, f"Decision is already '{row[0]}', not open for review")

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
        conn.commit()

    return _row_to_decision(updated)


@router.patch("/{decision_id}/outcome", response_model=Decision)
def record_outcome(
    decision_id: str,
    body: OutcomeRequest,
    user_id: str = Depends(get_current_user_id),  # noqa: ARG001 — auth required, not otherwise used
    conn: psycopg.Connection = Depends(get_connection),
) -> Decision:
    """Records what actually happened, after the fact — separate from the
    review step above since an outcome is only knowable once time has
    passed (e.g. did the stockout actually get avoided). Requires the
    decision to have already been reviewed; an outcome for something never
    acted on isn't a real observation."""
    with conn.cursor() as cur:
        cur.execute("SELECT status FROM decision WHERE decision_id = %s", (decision_id,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(404, "Decision not found")
        if row[0] == "open":
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
        conn.commit()

    return _row_to_decision(updated)
