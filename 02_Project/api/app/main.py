from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import admin_stats, business_data, decisions, forecast, ingest, signals

app = FastAPI(title="Foresight Intelligence API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://foresight-xi-mocha.vercel.app",
        "https://foresight-ls.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)
app.include_router(forecast.router)
app.include_router(decisions.router)
app.include_router(ingest.router)
app.include_router(business_data.router)
app.include_router(admin_stats.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
