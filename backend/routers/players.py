# backend/routers/players.py
from fastapi import APIRouter, Query, HTTPException
from database import get_connection
from ranking_utils import get_player_ranking_status
from tournament_calendar import (
    normalize_masters_calendar,
    resolve_masters_result,
    resolve_slam_result,
    RESULT_ABSENT,
)

from score_utils import player_perspective_score

router = APIRouter(prefix="/api/players", tags=["players"])

SLAM_KEYS = ("ao", "rg", "w", "us")
SLAM_SUFFIX = {"ao": "580", "rg": "520", "w": "540", "us": "560"}

ROUND_ORDER_SQL = """
    CASE
        WHEN round = 'R128' THEN 1
        WHEN round = 'R64'  THEN 2
        WHEN round = 'R32'  THEN 3
        WHEN round = 'R16'  THEN 4
        WHEN round = 'R48'  THEN 4
        WHEN round = 'R24'  THEN 4
        WHEN round = 'QF'   THEN 5
        WHEN round = 'SF'   THEN 6
        WHEN round = 'F'    THEN 7
        ELSE 99
    END
"""


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
        SELECT player_id, name_first, name_last, hand, height, ioc, dob, wikidata_id
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
        SELECT player_id, name_first, name_last, hand, height, ioc, dob, wikidata_id
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
    """Current ranking if on latest snapshot; otherwise inactive + last known rank."""
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    SELECT player_id, name_first, name_last
                    FROM atp_players WHERE player_id = %s
                    """,
                    (str(player_id),),
                )
                player = cur.fetchone()
                if not player:
                    raise HTTPException(status_code=404, detail="Игрок не найден")

                status = get_player_ranking_status(cur, player_id)

        if status["lastRank"] is None and status["currentRank"] is None:
            raise HTTPException(status_code=404, detail="Рейтинг не найден")

        return {
            **dict(player),
            "rank": status["currentRank"],
            "points": status.get("currentPoints"),
            "rankStatus": status["status"],
            "lastRank": status["lastRank"],
            "lastRankDate": status["lastRankDate"],
            "latestSnapshotDate": status["latestSnapshotDate"],
            "isActive": status["status"] == "active",
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e

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
            p.wikidata_id,

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

@router.get("/{player_id}/rankings-history")
def get_rankings_history(player_id: int):
    """
    История рейтинга игрока.
    Сортировка: от самой новой даты к самой старой.
    """

    sql = """
        SELECT
            to_date(
                ROUND(ranking_date::numeric)::text,
                'YYYYMMDD'
            ) AS ranking_date,

            ROUND(rank::numeric)::int AS rank,
            ROUND(points::numeric)::int AS points

        FROM atp_rankings

        WHERE ROUND(player::numeric)::int = %s

        ORDER BY ranking_date DESC
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (player_id,))
                rows = cur.fetchall()
                status = get_player_ranking_status(cur, player_id)

        return {
            "player_id": player_id,
            "rankStatus": status["status"],
            "currentRank": status["currentRank"],
            "lastRank": status["lastRank"],
            "lastRankDate": status["lastRankDate"],
            "latestSnapshotDate": status["latestSnapshotDate"],
            "results": [dict(r) for r in rows],
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ошибка базы данных: {e}"
        )


@router.get("/{player_id}/grand-slams")
def get_grand_slam_results(player_id: int):
    """
    Лучший результат игрока на каждом шлеме по годам.
    tourney_id: YYYY-580 (AO), YYYY-520 (RG), YYYY-540 (W), YYYY-560 (US)
    """

    sql = """
        WITH slam_matches AS (
            SELECT
                SPLIT_PART(tourney_id, '-', 1)::int AS year,
                CASE SPLIT_PART(tourney_id, '-', 2)
                    WHEN '580' THEN 'ao'
                    WHEN '520' THEN 'rg'
                    WHEN '540' THEN 'w'
                    WHEN '560' THEN 'us'
                END AS slam,
                round,
                won_match,
                CASE
                    WHEN round = 'R128' THEN 1
                    WHEN round = 'R64'  THEN 2
                    WHEN round = 'R32'  THEN 3
                    WHEN round = 'R16'  THEN 4
                    WHEN round = 'R48'  THEN 4
                    WHEN round = 'R24'  THEN 4
                    WHEN round = 'QF'   THEN 5
                    WHEN round = 'SF'   THEN 6
                    WHEN round = 'F'    THEN 7
                    ELSE 0
                END AS round_rank
            FROM atp_player_matches
            WHERE player_id = %s
              AND SPLIT_PART(tourney_id, '-', 2) IN ('580', '520', '540', '560')
        ),

        best_rounds AS (
            SELECT DISTINCT ON (year, slam)
                year,
                slam,
                round,
                won_match,
                round_rank
            FROM slam_matches
            WHERE slam IS NOT NULL
            ORDER BY year, slam, round_rank DESC
        )

        SELECT
            year,
            slam,
            CASE
                WHEN round = 'F' AND won_match IN ('1', '1.0') THEN 'W'
                ELSE round
            END AS result
        FROM best_rounds
        ORDER BY year DESC, slam;
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(player_id),))
                rows = cur.fetchall()

        return {
            "player_id": player_id,
            "results": _enrich_grand_slam_results(
                [dict(r) for r in rows],
                global_held=_fetch_global_slam_held(),
            ),
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")


def _fetch_global_slam_held() -> set[tuple[int, str]]:
    sql = """
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
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    return {
        (int(r["year"]), r["slam"])
        for r in rows
        if r["slam"] is not None
    }


def _enrich_grand_slam_results(
    player_rows: list[dict],
    global_held: set[tuple[int, str]],
) -> list[dict]:
    """Добавляет N/T и предстоящие турниры (Wimbledon 2020, текущий год)."""
    if not player_rows:
        return player_rows

    existing = {(int(r["year"]), r["slam"]) for r in player_rows}
    player_by_year: dict[int, set[str]] = {}
    years: list[int] = []

    for row in player_rows:
        year = int(row["year"])
        years.append(year)
        player_by_year.setdefault(year, set()).add(row["slam"])

    first_year = min(years)
    last_year = max(years)

    enriched = list(player_rows)

    for year in range(first_year, last_year + 1):
        for slam in SLAM_KEYS:
            key = (year, slam)
            if key in existing:
                continue
            status = resolve_slam_result(
                year,
                slam,
                None,
                global_held,
                player_by_year.get(year, set()),
            )
            if status != RESULT_ABSENT:
                enriched.append({"year": year, "slam": slam, "result": status})
                existing.add(key)

    enriched.sort(key=lambda r: (-int(r["year"]), r["slam"]))
    return enriched


def _build_masters_era_groups(calendar_rows, player_rows):
    """Группирует годы с одинаковым набором Masters и строит строки для игрока."""
    raw_calendar: dict[int, list[str]] = {}
    global_held: set[tuple[int, str]] = set()

    for row in calendar_rows:
        year = int(row["year"])
        name = row["tourney_name"]
        global_held.add((year, name))
        if year not in raw_calendar:
            raw_calendar[year] = []
        if name not in raw_calendar[year]:
            raw_calendar[year].append(name)

    year_tournaments = normalize_masters_calendar(raw_calendar)

    if not year_tournaments:
        return []

    player_results: dict[tuple[int, str], str] = {}
    player_by_year: dict[int, set[str]] = {}
    player_years: list[int] = []

    for row in player_rows:
        year = int(row["year"])
        name = row["tourney_name"]
        player_results[(year, name)] = row["result"]
        player_by_year.setdefault(year, set()).add(name)
        player_years.append(year)

    if not player_years:
        return []

    player_first = min(player_years)
    player_last = max(player_years)

    years = sorted(year_tournaments.keys())
    groups = []
    i = 0

    while i < len(years):
        era_start = years[i]
        tournament_set = frozenset(year_tournaments[era_start])
        j = i + 1
        while j < len(years) and frozenset(year_tournaments[years[j]]) == tournament_set:
            j += 1
        era_end = years[j - 1]
        # Порядок колонок — хронология последнего года эпохи (актуальный календарь)
        tournaments = list(year_tournaments[era_end])

        row_start = max(era_start, player_first)
        row_end = min(era_end, player_last)

        if row_start <= row_end:
            rows = []
            for year in range(row_end, row_start - 1, -1):
                tourneys_in_year = player_by_year.get(year, set())
                rows.append({
                    "year": year,
                    "results": {
                        name: resolve_masters_result(
                            year,
                            name,
                            player_results.get((year, name)),
                            global_held,
                            tourneys_in_year,
                        )
                        for name in tournaments
                    },
                })

            groups.append({
                "startYear": era_start,
                "endYear": era_end,
                "tournaments": tournaments,
                "rows": rows,
            })

        i = j

    groups.sort(key=lambda g: g["startYear"], reverse=True)
    return groups


@router.get("/{player_id}/masters")
def get_masters_results(player_id: int):
    """
    ATP Masters 1000: лучший результат игрока по каждому турниру в году,
    с группировкой эпох, когда менялся состав Masters на туре.
    """

    calendar_sql = """
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

    player_sql = """
        WITH masters_matches AS (
            SELECT
                LEFT(match_date, 4)::int AS year,
                tourney_name,
                round,
                won_match,
                CASE
                    WHEN round = 'R128' THEN 1
                    WHEN round = 'R64'  THEN 2
                    WHEN round = 'R32'  THEN 3
                    WHEN round = 'R16'  THEN 4
                    WHEN round = 'R48'  THEN 4
                    WHEN round = 'R24'  THEN 4
                    WHEN round = 'QF'   THEN 5
                    WHEN round = 'SF'   THEN 6
                    WHEN round = 'F'    THEN 7
                    ELSE 0
                END AS round_rank
            FROM atp_player_matches
            WHERE player_id = %s
              AND tourney_level = 'M'
              AND match_date IS NOT NULL
        ),

        best_rounds AS (
            SELECT DISTINCT ON (year, tourney_name)
                year,
                tourney_name,
                round,
                won_match,
                round_rank
            FROM masters_matches
            ORDER BY year, tourney_name, round_rank DESC
        )

        SELECT
            year,
            tourney_name,
            CASE
                WHEN round = 'F' AND won_match IN ('1', '1.0') THEN 'W'
                ELSE round
            END AS result
        FROM best_rounds
        ORDER BY year DESC, tourney_name
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(calendar_sql)
                calendar_rows = cur.fetchall()

                cur.execute(player_sql, (str(player_id),))
                player_rows = cur.fetchall()

        groups = _build_masters_era_groups(
            [dict(r) for r in calendar_rows],
            [dict(r) for r in player_rows],
        )

        return {
            "player_id": player_id,
            "groups": groups,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")


@router.get("/{player_id}/tournament-matches")
def get_tournament_matches(
    player_id: int,
    year: int = Query(..., ge=1968, le=2100),
    slam: str | None = Query(None),
    tourney_name: str | None = Query(None),
):
    """
    Матчи игрока на турнире (от первого круга до вылета/титула).
    slam: ao|rg|w|us  или  tourney_name для Masters.
    """
    if slam and tourney_name:
        raise HTTPException(status_code=400, detail="Укажите slam или tourney_name, не оба")
    if not slam and not tourney_name:
        raise HTTPException(status_code=400, detail="Нужен slam или tourney_name")

    if slam:
        suffix = SLAM_SUFFIX.get(slam)
        if not suffix:
            raise HTTPException(status_code=400, detail="Неизвестный slam")
        filter_sql = "tourney_id = %s"
        filter_params: tuple = (f"{year}-{suffix}",)
    else:
        filter_sql = "tourney_level = 'M' AND tourney_name = %s AND LEFT(match_date, 4) = %s"
        filter_params = (tourney_name, str(year))

    sql = f"""
        SELECT
            round,
            opponent_name,
            score,
            won_match,
            tourney_name,
            {ROUND_ORDER_SQL} AS round_order
        FROM atp_player_matches
        WHERE player_id = %s
          AND {filter_sql}
        ORDER BY round_order, match_num::numeric NULLS LAST
    """

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (str(player_id), *filter_params))
                rows = cur.fetchall()

        if not rows:
            return {
                "player_id": player_id,
                "year": year,
                "tournament": tourney_name or slam,
                "matches": [],
            }

        matches = []
        for row in rows:
            won = str(row["won_match"]) in ("1", "1.0")
            matches.append({
                "round": row["round"],
                "opponent": row["opponent_name"] or "—",
                "score": player_perspective_score(row["score"], won),
                "won": won,
            })

        return {
            "player_id": player_id,
            "year": year,
            "tournament": rows[0]["tourney_name"],
            "matches": matches,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")