# backend/routers/h2h.py
from fastapi import APIRouter, HTTPException, Query

from database import get_connection
from h2h_utils import (
    APM_COLUMNS,
    aggregate_h2h,
    build_matchup_context,
    format_hand,
    _float,
    _int,
)
from ranking_utils import get_player_ranking_status, matchup_rank
from player_utils import calc_age_from_dob
router = APIRouter(prefix="/api/h2h", tags=["h2h"])


def _latest_rank(cur, player_id: str) -> dict:
    return get_player_ranking_status(cur, player_id)


MIN_SURFACE_MATCHES = 5


def _best_surface(cur, player_id: str) -> str | None:
    """Surface with the highest career win rate (min MIN_SURFACE_MATCHES to qualify)."""
    cur.execute(
        """
        SELECT
            surface,
            SUM(CASE WHEN won_match::text = '1' THEN 1 ELSE 0 END)::int AS wins,
            COUNT(*)::int AS played
        FROM atp_player_matches
        WHERE player_id = %s AND surface IS NOT NULL AND surface != ''
        GROUP BY surface
        """,
        (player_id,),
    )
    rows = [dict(r) for r in cur.fetchall()]
    if not rows:
        return None

    def rank_key(row: dict) -> tuple:
        played = row["played"] or 0
        wins = row["wins"] or 0
        pct = wins / played if played else 0.0
        qualifies = played >= MIN_SURFACE_MATCHES
        return (qualifies, pct, played)

    return max(rows, key=rank_key)["surface"]


def _player_profile(cur, player_id: str) -> dict:
    cur.execute(
        """
        SELECT player_id, name_first, name_last, hand, height, ioc, dob
        FROM atp_players
        WHERE player_id::text = %s
        """,
        (player_id,),
    )
    row = cur.fetchone()
    if not row:
        raise HTTPException(status_code=404, detail=f"Player {player_id} not found")
    p = dict(row)
    ranking = _latest_rank(cur, player_id)
    best_surface = _best_surface(cur, player_id)
    age = calc_age_from_dob(p.get("dob"))

    return {
        "player_id": str(p["player_id"]),
        "name_first": p.get("name_first") or "",
        "name_last": p.get("name_last") or "",
        "hand": p.get("hand"),
        "height": _int(p.get("height")),
        "ioc": p.get("ioc"),
        "rank": ranking["currentRank"],
        "rankStatus": ranking["status"],
        "lastRank": ranking["lastRank"],
        "matchupRank": matchup_rank(ranking),
        "age": age,
        "bestSurface": best_surface,
        "handDisplay": format_hand(p.get("hand")),
    }


def _profile_response(p: dict) -> dict:
    return {
        "rank": p["rank"],
        "rankStatus": p["rankStatus"],
        "lastRank": p["lastRank"],
        "age": p["age"],
        "height": p["height"],
        "hand": p["handDisplay"],
        "bestSurface": p["bestSurface"] or "—",
    }


def _fetch_h2h_rows(cur, player_id: str, opponent_id: str) -> list[dict]:
    cur.execute(
        f"""
        SELECT {APM_COLUMNS}
        FROM atp_player_matches apm
        WHERE apm.player_id = %s AND apm.opponent_id = %s
        ORDER BY apm.match_date DESC NULLS LAST, apm.tourney_date DESC
        """,
        (player_id, opponent_id),
    )
    return [dict(r) for r in cur.fetchall()]


@router.get("")
def get_head_to_head(
    player_a: int = Query(..., description="Player A id"),
    player_b: int = Query(..., description="Player B id"),
):
    """Full H2H dashboard payload for two players."""
    if player_a == player_b:
        raise HTTPException(status_code=400, detail="Choose two different players")

    id_a, id_b = str(player_a), str(player_b)

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                profile_a = _player_profile(cur, id_a)
                profile_b = _player_profile(cur, id_b)
                rows_a = _fetch_h2h_rows(cur, id_a, id_b)

                name_a = f"{profile_a['name_first']} {profile_a['name_last']}".strip()
                name_b = f"{profile_b['name_first']} {profile_b['name_last']}".strip()

                if not rows_a:
                    return {
                        "summary": {"winsA": 0, "winsB": 0, "setsA": 0, "setsB": 0},
                        "meetings": [],
                        "profile": {
                            "a": _profile_response(profile_a),
                            "b": _profile_response(profile_b),
                        },
                        "bySurface": [],
                        "tourneyLevels": [],
                        "byRound": [],
                        "style": [],
                        "radar": [],
                        "insights": [],
                        "matchup": build_matchup_context(cur, id_a, id_b, profile_a, profile_b),
                    }

                data = aggregate_h2h(rows_a, [], name_a, name_b)
                data["profile"] = {
                    "a": _profile_response(profile_a),
                    "b": _profile_response(profile_b),
                }
                data["matchup"] = build_matchup_context(cur, id_a, id_b, profile_a, profile_b)
                return data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}") from e
