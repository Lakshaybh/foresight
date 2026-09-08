import psycopg
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import get_current_user_id
from app.db import get_connection
from app.forecast.stockout_risk import compute_forecast, persist_risk_signals

router = APIRouter(prefix="/forecast", tags=["forecast"])


class StockoutForecastOut(BaseModel):
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


class DetectionResult(BaseModel):
    detected: int
    inserted: int
    skipped_already_today: int


@router.get("/stockout-risk", response_model=list[StockoutForecastOut])
def stockout_risk(
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> list[StockoutForecastOut]:
    with conn.cursor() as cur:
        forecasts = compute_forecast(cur, tenant_id=user_id)
    return [StockoutForecastOut(**f.__dict__) for f in forecasts]


@router.post("/detect", response_model=DetectionResult)
def detect_stockout_risk(
    user_id: str = Depends(get_current_user_id),
    conn: psycopg.Connection = Depends(get_connection),
) -> DetectionResult:
    with conn.cursor() as cur:
        forecasts = compute_forecast(cur, tenant_id=user_id)
        at_risk = [f for f in forecasts if f.risk_score >= 0.3]
        inserted, skipped = persist_risk_signals(cur, forecasts, tenant_id=user_id)
        conn.commit()

    return DetectionResult(detected=len(at_risk), inserted=inserted, skipped_already_today=skipped)
