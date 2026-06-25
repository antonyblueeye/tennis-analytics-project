# backend/dashboard_highlights.py
from datetime import date

from database import get_connection
from tourney_utils import _DATE_FILTER_SQL

_APM_DATE = _DATE_FILTER_SQL.replace("tourney_date", "apm.tourney_date")
_AM_DATE = _DATE_FILTER_SQL


def _fmt_date(d) -> str:
    if d is None:
        return ""
    if hasattr(d, "strftime"):
        return d.strftime("%d %b %Y")
    s = str(d)[:10]
    parts = s.split("-")
    if len(parts) == 3:
        months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
        return f"{int(parts[2])} {months[int(parts[1]) - 1]} {parts[0]}"
    return s


def _fmt_range(start, end) -> str:
    a, b = _fmt_date(start), _fmt_date(end)
    return f"{a} – {b}" if a != b else a


def _fetch_one(cur, sql: str, params: list) -> dict | None:
    cur.execute(sql, params)
    row = cur.fetchone()
    return dict(row) if row else None


def _insight(icon: str, label: str, value: str, sub: str | None = None) -> dict:
    return {"icon": icon, "label": label, "value": value, "sub": sub}


def get_highlights(from_date: date, to_date: date) -> list[dict]:
    from_yyyymmdd = int(from_date.strftime("%Y%m%d"))
    to_yyyymmdd = int(to_date.strftime("%Y%m%d"))
    params = [from_date, to_date]
    rank_params = [from_yyyymmdd, to_yyyymmdd]
    items: list[dict] = []

    streak_sql = f"""
        WITH m AS (
            SELECT apm.player_id, apm.player_name, apm.match_date, apm.won_match::int AS won,
                   ROW_NUMBER() OVER (
                       PARTITION BY apm.player_id ORDER BY apm.match_date, apm.row_id
                   ) AS rn
            FROM atp_player_matches apm
            WHERE {_APM_DATE}
        ),
        g AS (
            SELECT *,
                   rn - ROW_NUMBER() OVER (
                       PARTITION BY player_id, won ORDER BY match_date, rn
                   ) AS grp
            FROM m
        ),
        streaks AS (
            SELECT player_name, won,
                   COUNT(*) AS streak_len,
                   MIN(match_date) AS start_date,
                   MAX(match_date) AS end_date
            FROM g
            GROUP BY player_id, player_name, won, grp
        )
        SELECT player_name, streak_len, start_date, end_date
        FROM streaks
        WHERE won = %s
        ORDER BY streak_len DESC, player_name
        LIMIT 1
    """

    upset_sql = f"""
        SELECT
            winner_name,
            loser_name,
            ROUND(winner_rank::numeric)::int AS winner_rank,
            ROUND(loser_rank::numeric)::int AS loser_rank,
            tourney_name,
            round,
            ROUND(winner_rank::numeric)::int - ROUND(loser_rank::numeric)::int AS rank_gap
        FROM atp_matches
        WHERE {_AM_DATE}
          AND winner_rank ~ '^[0-9]'
          AND loser_rank ~ '^[0-9]'
          AND winner_rank NOT ILIKE '%%nan%%'
          AND loser_rank NOT ILIKE '%%nan%%'
          AND ROUND(winner_rank::numeric) > ROUND(loser_rank::numeric)
        ORDER BY rank_gap DESC
        LIMIT 1
    """

    tiebreaks_sql = f"""
        SELECT apm.player_name,
               SUM(
                   COALESCE(
                       (SELECT COUNT(*)::int FROM regexp_matches(apm.score, '7-6|6-7', 'g')),
                       0
                   )
               ) AS tiebreak_sets
        FROM atp_player_matches apm
        WHERE {_APM_DATE}
          AND apm.score IS NOT NULL
          AND apm.score ~ '7-6|6-7'
        GROUP BY apm.player_id, apm.player_name
        ORDER BY tiebreak_sets DESC, apm.player_name
        LIMIT 1
    """

    countries_sql = f"""
        SELECT COUNT(DISTINCT apm.player_ioc) AS countries
        FROM atp_player_matches apm
        WHERE {_APM_DATE}
          AND apm.player_ioc IS NOT NULL
          AND TRIM(apm.player_ioc) != ''
    """

    ranking_change_sql = """
        WITH in_range AS (
            SELECT DISTINCT ON (
                ROUND(player::numeric)::bigint,
                ROUND(ranking_date::numeric)::bigint
            )
                ROUND(player::numeric)::bigint AS player_id,
                ROUND(rank::numeric)::int AS rank_val,
                ROUND(ranking_date::numeric)::bigint AS rd
            FROM atp_rankings
            WHERE ROUND(ranking_date::numeric)::bigint >= %s
              AND ROUND(ranking_date::numeric)::bigint <= %s
            ORDER BY
                ROUND(player::numeric)::bigint,
                ROUND(ranking_date::numeric)::bigint,
                id ASC
        ),
        bounds AS (
            SELECT
                player_id,
                MIN(rd) AS first_rd,
                MAX(rd) AS last_rd
            FROM in_range
            GROUP BY player_id
            HAVING MIN(rd) < MAX(rd)
        ),
        changes AS (
            SELECT
                b.player_id,
                f.rank_val AS first_rank,
                l.rank_val AS last_rank,
                l.rank_val - f.rank_val AS rank_change
            FROM bounds b
            JOIN in_range f ON f.player_id = b.player_id AND f.rd = b.first_rd
            JOIN in_range l ON l.player_id = b.player_id AND l.rd = b.last_rd
        )
        SELECT
            c.rank_change,
            c.first_rank,
            c.last_rank,
            p.name_first || ' ' || p.name_last AS player_name
        FROM changes c
        JOIN atp_players p ON p.player_id::text = c.player_id::text
        ORDER BY c.rank_change {direction}
        LIMIT 1
    """

    avg_age_sql = f"""
        SELECT ROUND(AVG(apm.player_age::numeric), 1) AS avg_age
        FROM atp_player_matches apm
        WHERE {_APM_DATE}
          AND apm.player_age ~ '^[0-9]'
    """

    with get_connection() as conn:
        with conn.cursor() as cur:
            win = _fetch_one(cur, streak_sql, [*params, 1])
            if win and win["streak_len"] > 1:
                items.append(_insight(
                    "🔥",
                    "Longest win streak",
                    win["player_name"],
                    f"{win['streak_len']} matches · {_fmt_range(win['start_date'], win['end_date'])}",
                ))

            loss = _fetch_one(cur, streak_sql, [*params, 0])
            if loss and loss["streak_len"] > 1:
                items.append(_insight(
                    "📉",
                    "Longest lose streak",
                    loss["player_name"],
                    f"{loss['streak_len']} matches · {_fmt_range(loss['start_date'], loss['end_date'])}",
                ))

            upset = _fetch_one(cur, upset_sql, params)
            if upset:
                items.append(_insight(
                    "💥",
                    "Biggest upset",
                    f"#{upset['winner_rank']} def #{upset['loser_rank']}",
                    f"{upset['winner_name']} def. {upset['loser_name']} · {upset['tourney_name']} {upset['round']}",
                ))

            tb = _fetch_one(cur, tiebreaks_sql, params)
            if tb and tb["tiebreak_sets"] > 0:
                items.append(_insight(
                    "🏟️",
                    "Most tiebreaks played",
                    tb["player_name"],
                    f"{tb['tiebreak_sets']} tiebreak sets in period",
                ))

            countries = _fetch_one(cur, countries_sql, params)
            if countries and countries["countries"]:
                n = int(countries["countries"])
                items.append(_insight(
                    "🌍",
                    "Most countries represented",
                    str(n),
                    f"{n} nations across all tournament fields",
                ))

            jump = _fetch_one(cur, ranking_change_sql.format(direction="ASC"), rank_params)
            if jump and jump["rank_change"] < 0:
                places = -int(jump["rank_change"])
                items.append(_insight(
                    "📈",
                    "Best ranking jump",
                    jump["player_name"],
                    f"+{places} places · #{jump['first_rank']} → #{jump['last_rank']}",
                ))

            drop = _fetch_one(cur, ranking_change_sql.format(direction="DESC"), rank_params)
            if drop and drop["rank_change"] > 0:
                places = int(drop["rank_change"])
                items.append(_insight(
                    "🔻",
                    "Best ranking drop",
                    drop["player_name"],
                    f"−{places} places · #{drop['first_rank']} → #{drop['last_rank']}",
                ))

            age = _fetch_one(cur, avg_age_sql, params)
            if age and age["avg_age"] is not None:
                items.append(_insight(
                    "🎂",
                    "Average age",
                    f"{age['avg_age']} years",
                    "Mean player age at match date in period",
                ))

    return items
