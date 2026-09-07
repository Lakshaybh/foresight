from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import decisions, forecast, signals

app = FastAPI(title="Foresight Intelligence API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(signals.router)
app.include_router(forecast.router)
app.include_router(decisions.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
