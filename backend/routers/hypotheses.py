# backend/routers/hypotheses.py
from fastapi import APIRouter, HTTPException

from database import get_connection
from db_indexes import ensure_rankings_indexes
from hypotheses_early_success import PLAYER_STATS_SQL, aggregate_player_stats

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

_cache: dict | None = None


def _load_early_success() -> dict:
    global _cache
    with get_connection() as conn:
        ensure_rankings_indexes(conn)
        with conn.cursor() as cur:
            cur.execute(PLAYER_STATS_SQL)
            rows = [dict(r) for r in cur.fetchall()]

    payload = aggregate_player_stats(rows)
    _cache = payload
    return payload


@router.get("/early-success")
def get_early_success_hypothesis():
    """H1: Top-100 entry age vs Top-10 probability and elite tenure."""
    try:
        return _cache or _load_early_success()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e
