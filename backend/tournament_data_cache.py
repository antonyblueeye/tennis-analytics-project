# backend/tournament_data_cache.py
"""Cached global tournament metadata reused across player profile endpoints."""
from __future__ import annotations

from database import get_connection

_global_slam_held: set[tuple[int, str]] | None = None
_masters_calendar_rows: list[dict] | None = None

SLAM_HELD_SQL = """
    SELECT DISTINCT
        SPLIT_PART(tourney_id, '-', 1)::int AS year,
        CASE SPLIT_PART(tourney_id, '-', 2)
            WHEN '580' THEN 'ao'
            WHEN '520' THEN 'rg'
            WHEN '540' THEN 'w'
            WHEN '560' THEN 'us'
        END AS slam
    FROM atp_player_matches
    WHERE SPLIT_PART(tourney_id, '-', 2) IN ('580', '520', '540', '560')
"""

MASTERS_CALENDAR_SQL = """
    SELECT
        LEFT(match_date, 4)::int AS year,
        tourney_name,
        MIN(tourney_date::numeric) AS sort_key
    FROM atp_player_matches
    WHERE tourney_level = 'M'
      AND match_date IS NOT NULL
      AND LEFT(match_date, 4) ~ '^[0-9]{4}$'
    GROUP BY 1, 2
    ORDER BY 1, 3
"""


def load_tournament_caches() -> None:
    global _global_slam_held, _masters_calendar_rows
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(SLAM_HELD_SQL)
            _global_slam_held = {
                (int(r["year"]), r["slam"])
                for r in cur.fetchall()
                if r["slam"] is not None
            }
            cur.execute(MASTERS_CALENDAR_SQL)
            _masters_calendar_rows = [dict(r) for r in cur.fetchall()]


def get_global_slam_held() -> set[tuple[int, str]]:
    if _global_slam_held is None:
        load_tournament_caches()
    assert _global_slam_held is not None
    return _global_slam_held


def get_masters_calendar_rows() -> list[dict]:
    if _masters_calendar_rows is None:
        load_tournament_caches()
    assert _masters_calendar_rows is not None
    return _masters_calendar_rows
