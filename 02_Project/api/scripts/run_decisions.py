"""
Runs the decision engine against live signals and persists new decisions.
Each signal gets exactly one decision, ever — safe to re-run.

Usage:
    python scripts/run_decisions.py
"""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from app.config import settings  # noqa: E402
from app.decision.engine import persist_decisions, run_decision_engine  # noqa: E402


def main() -> None:
    import psycopg

    if not settings.database_url:
        raise RuntimeError("DATABASE_URL is not set in api/.env")

    with psycopg.connect(settings.database_url, prepare_threshold=None) as conn:
        with conn.cursor() as cur:
            decisions = run_decision_engine(cur)
            for d in decisions:
                print(f"  {d.action_type} (confidence={d.confidence}, owner={d.owner_role})")
            created = persist_decisions(cur, decisions)

        conn.commit()

    print(f"Created {created} new decision(s).")


if __name__ == "__main__":
    main()
