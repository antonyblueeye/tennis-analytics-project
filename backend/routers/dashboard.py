# backend/routers/dashboard.py
from datetime import date

from fastapi import APIRouter, HTTPException, Query
from database import get_connection
from tourney_utils import (
    LOGICAL_TOURNEY_ID_SQL,
    _DATE_FILTER_SQL,
    format_tourney_date,
    map_tourney_level,
    tourney_code,
)
from dashboard_highlights import get_highlights

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

_DATE_FILTER = _DATE_FILTER_SQL


@router.get("/summary")
def get_dashboard_summary(
    from_date: date = Query(..., alias="from", description="Start date (YYYY-MM-DD)"),
    to_date: date = Query(..., alias="to", description="End date (YYYY-MM-DD)"),
):
    """KPI summary for the dashboard: match/tournament counts and surface split."""
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="'from' must be on or before 'to'")

    counts_sql = f"""
        SELECT
            COUNT(*) AS matches_played,
            COUNT(DISTINCT {LOGICAL_TOURNEY_ID_SQL}) AS tournaments_played
        FROM atp_matches
        WHERE {_DATE_FILTER}
    """

    surfaces_sql = f"""
        SELECT
            COALESCE(SUM(CASE WHEN surface = 'Hard' THEN 1 ELSE 0 END), 0) AS hard_matches,
            COALESCE(SUM(CASE WHEN surface = 'Clay' THEN 1 ELSE 0 END), 0) AS clay_matches,
            COALESCE(SUM(CASE WHEN surface = 'Grass' THEN 1 ELSE 0 END), 0) AS grass_matches,
            COALESCE(SUM(CASE WHEN surface = 'Carpet' THEN 1 ELSE 0 END), 0) AS carpet_matches
        FROM atp_matches
        WHERE {_DATE_FILTER}
    """

    params = [from_date, to_date]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(counts_sql, params)
                counts = dict(cur.fetchone())
                cur.execute(surfaces_sql, params)
                surfaces = dict(cur.fetchone())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e

    surface_rows = [
        ("Hard", int(surfaces["hard_matches"])),
        ("Clay", int(surfaces["clay_matches"])),
        ("Grass", int(surfaces["grass_matches"])),
        ("Carpet", int(surfaces["carpet_matches"])),
    ]
    total_surface = sum(v for _, v in surface_rows)
    by_surface = [
        {
            "name": name,
            "value": value,
            "pct": round(value / total_surface * 100, 1) if total_surface else 0,
        }
        for name, value in surface_rows
        if value > 0
    ]

    return {
        "matches_played": int(counts["matches_played"]),
        "tournaments_played": int(counts["tournaments_played"]),
        "by_surface": by_surface,
    }


@router.get("/titles")
def get_dashboard_titles(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
    limit: int = Query(15, ge=1, le=50),
):
    """Players ranked by singles titles (finals won) in the period."""
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="'from' must be on or before 'to'")

    sql = f"""
        SELECT
            apm.player_id,
            apm.player_name,
            MAX(apm.player_ioc) AS player_ioc,
            COUNT(DISTINCT {LOGICAL_TOURNEY_ID_SQL}) AS titles
        FROM atp_player_matches apm
        WHERE {_DATE_FILTER}
          AND apm.round = 'F'
          AND apm.won_match::text = '1'
          AND apm.tourney_level != 'D'
        GROUP BY apm.player_id, apm.player_name
        ORDER BY titles DESC, apm.player_name
        LIMIT %s
    """
    params = [from_date, to_date, limit]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e

    return {
        "results": [
            {
                "player_id": int(r["player_id"]) if r["player_id"] else None,
                "player_name": r["player_name"],
                "player_ioc": r["player_ioc"],
                "titles": int(r["titles"]),
            }
            for r in rows
        ]
    }


@router.get("/tournaments")
def get_dashboard_tournaments(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
):
    """Completed tournaments in the period (final winners) for timeline and map."""
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="'from' must be on or before 'to'")

    sql = f"""
        SELECT DISTINCT ON ({LOGICAL_TOURNEY_ID_SQL})
            {LOGICAL_TOURNEY_ID_SQL} AS logical_id,
            tourney_id,
            tourney_name,
            tourney_level,
            surface,
            tourney_date,
            winner_name,
            winner_ioc
        FROM atp_matches
        WHERE {_DATE_FILTER}
          AND round = 'F'
          AND tourney_level != 'D'
        ORDER BY {LOGICAL_TOURNEY_ID_SQL}, tourney_date
    """
    params = [from_date, to_date]

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, params)
                rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e

    results = []
    for r in rows:
        tid = r["tourney_id"]
        results.append({
            "logical_id": r["logical_id"],
            "tourney_id": tid,
            "tourney_code": tourney_code(tid),
            "name": r["tourney_name"],
            "level": map_tourney_level(r["tourney_level"], tid),
            "surface": r["surface"],
            "date": format_tourney_date(r["tourney_date"]),
            "winner": r["winner_name"],
            "winner_ioc": r["winner_ioc"],
        })

    results.sort(key=lambda x: x["date"])
    return {"results": results}


@router.get("/highlights")
def get_dashboard_highlights(
    from_date: date = Query(..., alias="from"),
    to_date: date = Query(..., alias="to"),
):
    """Period highlight cards: streaks, upset, tiebreaks, rankings, age."""
    if from_date > to_date:
        raise HTTPException(status_code=400, detail="'from' must be on or before 'to'")

    try:
        items = get_highlights(from_date, to_date)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e

    return {"results": items}

