from datetime import datetime

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

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


@router.get("", response_model=list[Decision])
def list_decisions(conn: psycopg.Connection = Depends(get_connection)) -> list[Decision]:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT decision_id, signal_id, action_type, evidence, confidence,
                   status, owner_role, created_at, resolved_at, outcome
            FROM decision
            ORDER BY created_at DESC
        """)
        rows = cur.fetchall()

    return [
        Decision(
            decision_id=str(r[0]), signal_id=str(r[1]), action_type=r[2], evidence=r[3],
            confidence=float(r[4]), status=r[5], owner_role=r[6], created_at=r[7],
            resolved_at=r[8], outcome=r[9],
        )
        for r in rows
    ]


@router.post("/run", response_model=RunResult)
def run(conn: psycopg.Connection = Depends(get_connection)) -> RunResult:
    with conn.cursor() as cur:
        decisions = run_decision_engine(cur)
        created = persist_decisions(cur, decisions)
        conn.commit()

    return RunResult(created=created)
