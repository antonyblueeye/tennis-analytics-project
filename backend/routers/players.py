# backend/routers/players.py
from fastapi import APIRouter, Query, HTTPException
from database import get_connection

router = APIRouter(prefix="/api/players", tags=["players"])


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
