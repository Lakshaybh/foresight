from datetime import datetime

import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.db import get_connection
from app.detection.supplier_lead_time import persist_signals, run_detection

router = APIRouter(prefix="/signals", tags=["signals"])


class Signal(BaseModel):
    signal_id: str
    entity_type: str
    entity_id: str
    metric: str
    baseline_value: float
    observed_value: float
    deviation: float
    detected_at: datetime


class DetectionResult(BaseModel):
    detected: int
    inserted: int
    skipped_already_today: int


@router.get("", response_model=list[Signal])
def list_signals(conn: psycopg.Connection = Depends(get_connection)) -> list[Signal]:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT signal_id, entity_type, entity_id, metric,
                   baseline_value, observed_value, deviation, detected_at
            FROM signal
            ORDER BY detected_at DESC
        """)
        rows = cur.fetchall()

    return [
        Signal(
            signal_id=str(r[0]), entity_type=r[1], entity_id=str(r[2]), metric=r[3],
            baseline_value=float(r[4]), observed_value=float(r[5]), deviation=float(r[6]),
            detected_at=r[7],
        )
        for r in rows
    ]


@router.post("/detect/supplier-lead-time", response_model=DetectionResult)
def detect_supplier_lead_time(conn: psycopg.Connection = Depends(get_connection)) -> DetectionResult:
    with conn.cursor() as cur:
        found = run_detection(cur)
        inserted, skipped = persist_signals(cur, found)
        conn.commit()

    return DetectionResult(detected=len(found), inserted=inserted, skipped_already_today=skipped)
