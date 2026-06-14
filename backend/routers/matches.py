# backend/routers/matches.py
import re

from fastapi import APIRouter, HTTPException, Query
from database import get_connection

router = APIRouter(prefix="/api/matches", tags=["matches"])

MATCH_SELECT = """
    id,
    tourney_id,
    tourney_name,
    surface,
    draw_size,
    tourney_level,
    tourney_date,
    match_num,
    round,
    score,
    best_of,
    minutes,
    winner_id,
    winner_seed,
    winner_entry,
    winner_name,
    winner_hand,
    winner_ht,
    winner_ioc,
    winner_age,
    winner_rank,
    winner_rank_points,
    loser_id,
    loser_seed,
    loser_entry,
    loser_name,
    loser_hand,
    loser_ht,
    loser_ioc,
    loser_age,
    loser_rank,
    loser_rank_points,
    w_ace,
    w_df,
    w_svpt,
    "w_1stIn",
    "w_1stWon",
    "w_2ndWon",
    "w_SvGms",
    "w_bpSaved",
    "w_bpFaced",
    l_ace,
    l_df,
    l_svpt,
    "l_1stIn",
    "l_1stWon",
    "l_2ndWon",
    "l_SvGms",
    "l_bpSaved",
    "l_bpFaced"
"""


def _row_to_match(row: dict) -> dict:
    return dict(row)


_BASE_WHERE = """
    tourney_date IS NOT NULL
    AND tourney_date ~ '^[0-9]{8}$'
"""


def _build_filters(
    date: str | None,
    tournament: str | None,
    player: str | None,
) -> tuple[str, list]:
    clauses = [_BASE_WHERE]
    params: list = []

    if date and date.strip():
        digits = re.sub(r"\D", "", date.strip())
        if digits:
            clauses.append("tourney_date LIKE %s")
            params.append(f"{digits}%")

    if tournament and tournament.strip():
        clauses.append("tourney_name ILIKE %s")
        params.append(f"%{tournament.strip()}%")

    if player and player.strip():
        clauses.append("(winner_name ILIKE %s OR loser_name ILIKE %s)")
        pattern = f"%{player.strip()}%"
        params.extend([pattern, pattern])

    return " AND ".join(clauses), params


def _list_matches(
    page: int,
    page_size: int,
    date: str | None = None,
    tournament: str | None = None,
    player: str | None = None,
) -> dict:
    where_sql, params = _build_filters(date, tournament, player)
    offset = (page - 1) * page_size

    count_sql = f"SELECT COUNT(*) AS cnt FROM atp_matches WHERE {where_sql}"
    list_sql = f"""
        SELECT {MATCH_SELECT}
        FROM atp_matches
        WHERE {where_sql}
        ORDER BY tourney_date::numeric DESC, match_num::numeric DESC NULLS LAST
        LIMIT %s OFFSET %s
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(count_sql, params)
                total = int(cur.fetchone()["cnt"])
                cur.execute(list_sql, [*params, page_size, offset])
                rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e

    total_pages = max(1, (total + page_size - 1) // page_size) if total else 0
    return {
        "results": [_row_to_match(dict(r)) for r in rows],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@router.get("")
def list_matches(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    date: str | None = Query(None, description="Год (2024) или дата (2024-06-10, 20240610)"),
    tournament: str | None = Query(None, description="Название турнира"),
    player: str | None = Query(None, description="Имя игрока (победитель или проигравший)"),
):
    """Список матчей с фильтрами и пагинацией."""
    return _list_matches(page, page_size, date, tournament, player)


@router.get("/recent")
def get_recent_matches(limit: int = Query(10, ge=1, le=50)):
    """Последние матчи по дате турнира (legacy)."""
    data = _list_matches(page=1, page_size=limit)
    return {"results": data["results"]}


@router.get("/{match_id}")
def get_match(match_id: int):
    """Один матч по id (для модалки)."""
    sql = f"""
        SELECT {MATCH_SELECT}
        FROM atp_matches
        WHERE id = %s
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (match_id,))
                row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Match not found")
        return _row_to_match(dict(row))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")
