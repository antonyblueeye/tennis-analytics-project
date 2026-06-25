# backend/routers/hypotheses.py
from fastapi import APIRouter, HTTPException

from database import get_connection
from db_indexes import ensure_rankings_indexes
from hypotheses_early_success import PLAYER_STATS_SQL, aggregate_player_stats
from hypotheses_peak_age import (
    MILESTONE_AGES_SQL,
    YOUNGEST_SLAM_SQL,
    aggregate_peak_age,
)
from hypotheses_serve_saturation import (
    SERVE_BUCKETS_SQL,
    SERVE_CURVE_SQL,
    SERVE_META_SQL,
    SQL_PARAMS,
    aggregate_serve_saturation,
)

router = APIRouter(prefix="/api/hypotheses", tags=["hypotheses"])

_early_success_cache: dict | None = None
_peak_age_cache: dict | None = None
_serve_saturation_cache: dict | None = None


def _load_early_success() -> dict:
    global _early_success_cache
    with get_connection() as conn:
        ensure_rankings_indexes(conn)
        with conn.cursor() as cur:
            cur.execute(PLAYER_STATS_SQL)
            rows = [dict(r) for r in cur.fetchall()]

    payload = aggregate_player_stats(rows)
    _early_success_cache = payload
    return payload


def _load_peak_age() -> dict:
    global _peak_age_cache
    with get_connection() as conn:
        ensure_rankings_indexes(conn)
        with conn.cursor() as cur:
            cur.execute(YOUNGEST_SLAM_SQL)
            youngest = cur.fetchone()
            cur.execute(MILESTONE_AGES_SQL)
            rows = [dict(r) for r in cur.fetchall()]

    payload = aggregate_peak_age(dict(youngest) if youngest else None, rows)
    _peak_age_cache = payload
    return payload


def _load_serve_saturation() -> dict:
    global _serve_saturation_cache
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(SERVE_META_SQL, SQL_PARAMS)
            meta = cur.fetchone()
            cur.execute(SERVE_BUCKETS_SQL, SQL_PARAMS)
            buckets = [dict(r) for r in cur.fetchall()]
            cur.execute(SERVE_CURVE_SQL, SQL_PARAMS)
            curve = [dict(r) for r in cur.fetchall()]

    payload = aggregate_serve_saturation(
        dict(meta) if meta else None,
        buckets,
        curve,
    )
    _serve_saturation_cache = payload
    return payload


@router.get("/early-success")
def get_early_success_hypothesis():
    """H1: Top-100 entry age vs Top-10 probability and elite tenure."""
    try:
        return _early_success_cache or _load_early_success()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e


@router.get("/peak-age")
def get_peak_age_hypothesis():
    """H2: Median ages and distributions at career milestones since 2000."""
    try:
        return _peak_age_cache or _load_peak_age()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e


@router.get("/serve-saturation")
def get_serve_saturation_hypothesis():
    """H3: First-serve % vs match win rate and saturation threshold."""
    try:
        return _serve_saturation_cache or _load_serve_saturation()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e
