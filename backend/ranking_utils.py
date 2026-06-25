# backend/ranking_utils.py
"""Current vs historical ATP ranking helpers."""


def get_latest_snapshot_date(cur) -> int | None:
    cur.execute("SELECT MAX(ROUND(ranking_date::numeric)::bigint) AS d FROM atp_rankings")
    row = cur.fetchone()
    return int(row["d"]) if row and row["d"] is not None else None


def get_player_ranking_status(cur, player_id: str | int) -> dict:
    """
    Current rank only if the player appears on the latest ranking snapshot.
    Otherwise status=inactive and lastRank holds the final career ranking.
    """
    pid = int(player_id)
    latest_date = get_latest_snapshot_date(cur)

    if latest_date is None:
        return {
            "currentRank": None,
            "status": "inactive",
            "lastRank": None,
            "lastRankDate": None,
            "latestSnapshotDate": None,
        }

    cur.execute(
        """
        SELECT
            ROUND(rank::numeric)::int AS rank,
            ROUND(points::numeric)::int AS points,
            ROUND(ranking_date::numeric)::bigint AS ranking_date
        FROM atp_rankings
        WHERE ROUND(player::numeric)::bigint = %s AND ROUND(ranking_date::numeric)::bigint = %s
        """,
        (pid, latest_date),
    )
    current = cur.fetchone()
    if current:
        return {
            "currentRank": current["rank"],
            "currentPoints": current.get("points"),
            "status": "active",
            "lastRank": current["rank"],
            "lastRankDate": int(current["ranking_date"]),
            "latestSnapshotDate": latest_date,
        }

    cur.execute(
        """
        SELECT
            ROUND(rank::numeric)::int AS rank,
            ROUND(ranking_date::numeric)::bigint AS ranking_date
        FROM atp_rankings
        WHERE ROUND(player::numeric)::bigint = %s
        ORDER BY ROUND(ranking_date::numeric)::bigint DESC
        LIMIT 1
        """,
        (pid,),
    )
    last = cur.fetchone()
    return {
        "currentRank": None,
        "currentPoints": None,
        "status": "inactive",
        "lastRank": last["rank"] if last else None,
        "lastRankDate": int(last["ranking_date"]) if last else None,
        "latestSnapshotDate": latest_date,
    }


def matchup_rank(status: dict) -> int | None:
    """Rank bracket for career context — prefer current, else last known."""
    return status.get("currentRank") or status.get("lastRank")
