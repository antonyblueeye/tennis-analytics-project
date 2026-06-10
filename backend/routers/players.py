# backend/routers/players.py
from fastapi import APIRouter, Query, HTTPException
from database import get_connection

router = APIRouter(prefix="/api/players", tags=["players"])


@router.get("/count")
def get_players_count():
    """Получить общее количество игроков в базе данных."""
    sql = "SELECT COUNT(*) as count FROM atp_players"
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                row = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")
    return {"count": row["count"] if row else 0}

@router.get("/count-matches")
def get_matches_count():
    """Получить общее количество игроков в базе данных."""
    sql = "SELECT COUNT(*) as count FROM atp_matches"
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                row = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")
    return {"count": row["count"] if row else 0}

@router.get("/count-tourneys")
def get_tourneys_count():
    """Получить общее количество игроков в базе данных."""
    sql = "select count(distinct split_part(tourney_id, '-', 2)) from atp_matches am"
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                row = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")
    return {"count": row["count"] if row else 0}


@router.get("/search")
def search_players(q: str = Query(..., min_length=1, description="Имя или фамилия игрока")):
    """Поиск игроков по имени или фамилии (частичное совпадение, без учёта регистра)."""
    like = f"%{q}%"
    sql = """
        SELECT player_id, name_first, name_last, hand, height, ioc
        FROM atp_players
        WHERE name_first ILIKE %s OR name_last ILIKE %s
        ORDER BY name_last, name_first
        LIMIT 50
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (like, like))
                rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")

    return {"results": [dict(r) for r in rows]}

@router.get("/{player_id}")
def get_player(player_id: int):
    """Получить данные одного игрока по ID."""
    sql = """
        SELECT player_id, name_first, name_last, hand, height, ioc
        FROM atp_players
        WHERE player_id = %s
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                # player_id в БД хранится как VARCHAR (импорт из CSV)
                cur.execute(sql, (str(player_id),))
                row = cur.fetchone()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")

    if not row:
        raise HTTPException(status_code=404, detail="Игрок не найден")

    return dict(row)

@router.get("/{player_id}/latest-ranking")
def get_latest_ranking(player_id: int):
    """
    Возвращает последний рейтинг игрока + имя/фамилию
    """

    sql = """
        SELECT
            p.player_id,
            p.name_first,
            p.name_last,

            ROUND(r.rank::numeric)::int AS rank,
            ROUND(r.points::numeric)::int AS points,

            to_date(ROUND(r.ranking_date::numeric)::text, 'YYYYMMDD') AS ranking_date

        FROM atp_rankings r
        JOIN atp_players p
            ON p.player_id::text = ROUND(r.player::numeric)::text

        WHERE ROUND(r.player::numeric)::int = %s

        ORDER BY r.ranking_date DESC
        LIMIT 1;
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (player_id,))
                row = cur.fetchone()

        if not row:
            raise HTTPException(status_code=404, detail="Игрок не найден")

        return dict(row)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")

@router.get("/rankings/top")
def get_top_rankings(limit: int = 100):
    """
    Топ игроков по актуальному рейтингу (последняя доступная дата)
    """

    sql = """
        WITH latest_date AS (
            SELECT MAX(ranking_date) AS max_date
            FROM atp_rankings
        )
        SELECT
            p.player_id,
            p.name_first,
            p.name_last,

            ROUND(r.rank::numeric)::int AS rank,
            ROUND(r.points::numeric)::int AS points,

            to_date(ROUND(r.ranking_date::numeric)::text, 'YYYYMMDD') AS ranking_date

        FROM atp_rankings r
        JOIN atp_players p
            ON p.player_id::text = ROUND(r.player::numeric)::text

        JOIN latest_date ld
            ON r.ranking_date = ld.max_date

        ORDER BY rank ASC
        LIMIT %s;
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (limit,))
                rows = cur.fetchall()

        return {"results": [dict(r) for r in rows]}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))