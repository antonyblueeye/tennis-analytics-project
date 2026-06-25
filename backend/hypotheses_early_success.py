# backend/hypotheses_early_success.py
"""H1: Early Top-100 entry vs career trajectory (since 2000, through latest ranking)."""
from __future__ import annotations

import statistics
from typing import Any

PLAYER_STATS_SQL = """
WITH ranking_bounds AS (
    SELECT MAX(ranking_date)::bigint AS max_date
    FROM atp_rankings
    WHERE ranking_date::bigint >= 20000101
),
player_dob AS (
    SELECT
        player_id,
        to_date(regexp_replace(dob, '\\..*$', ''), 'YYYYMMDD') AS birth_date
    FROM atp_players
    WHERE dob ~ '^[0-9]{8}'
),
player_first AS (
    SELECT
        ROUND(r.player::numeric)::bigint AS player_id,
        MIN(r.ranking_date) FILTER (WHERE r.rank <= 100) AS first_top100_date
    FROM atp_rankings r
    GROUP BY ROUND(r.player::numeric)::bigint
    HAVING MIN(r.ranking_date) FILTER (WHERE r.rank <= 100) IS NOT NULL
       AND MIN(r.ranking_date::bigint) FILTER (WHERE r.rank <= 100) >= 20000101
),
player_period AS (
    SELECT
        ROUND(r.player::numeric)::bigint AS player_id,
        BOOL_OR(r.rank <= 10) AS reached_top10,
        COUNT(*) FILTER (WHERE r.rank <= 100)::float / 52.0 AS years_in_top100
    FROM atp_rankings r
    INNER JOIN player_first f ON f.player_id = ROUND(r.player::numeric)::bigint
    CROSS JOIN ranking_bounds b
    WHERE r.ranking_date::bigint BETWEEN 20000101 AND b.max_date
    GROUP BY ROUND(r.player::numeric)::bigint
)
SELECT
    f.player_id,
    f.first_top100_date,
    b.max_date AS rankings_through,
    (to_date(f.first_top100_date::text, 'YYYYMMDD') - d.birth_date) / 365.25 AS age_at_top100,
    p.reached_top10,
    p.years_in_top100
FROM player_first f
JOIN player_dob d ON d.player_id = f.player_id::text
JOIN player_period p ON p.player_id = f.player_id
CROSS JOIN ranking_bounds b
"""

COHORT_ORDER = ["<=17", "18", "19", "20", "21", "22+"]
COHORT_LABELS = {"<=17": "≤17"}


def _cohort_key(age: float) -> str:
    if age < 18:
        return "<=17"
    if age < 19:
        return "18"
    if age < 20:
        return "19"
    if age < 21:
        return "20"
    if age < 22:
        return "21"
    return "22+"


def _float(val: Any) -> float | None:
    if val is None:
        return None
    return float(val)


def _median(values: list[float]) -> float | None:
    return round(statistics.median(values), 1) if values else None


def _pct(num: int, den: int) -> float:
    return round(num / den * 100, 1) if den else 0.0


def _format_period(rankings_through: int | None) -> str:
    if not rankings_through:
        return "2000–present"
    return f"2000–{int(str(rankings_through)[:4])}"


def aggregate_player_stats(rows: list[dict]) -> dict:
    players = [
        {
            "age": _float(r["age_at_top100"]),
            "reached_top10": bool(r["reached_top10"]),
            "years_in_top100": _float(r["years_in_top100"]) or 0.0,
            "cohort": _cohort_key(_float(r["age_at_top100"]) or 0),
        }
        for r in rows
        if r.get("age_at_top100") is not None and 14 <= _float(r["age_at_top100"]) <= 40
    ]

    rankings_through = int(rows[0]["rankings_through"]) if rows else None

    cohort_map: dict[str, list] = {k: [] for k in COHORT_ORDER}
    for p in players:
        cohort_map[p["cohort"]].append(p)

    cohorts = []
    for key in COHORT_ORDER:
        group = cohort_map[key]
        if not group:
            continue
        top10_hits = sum(1 for p in group if p["reached_top10"])
        cohorts.append({
            "age": COHORT_LABELS.get(key, key),
            "top10Prob": _pct(top10_hits, len(group)),
            "eliteYears": round(sum(p["years_in_top100"] for p in group) / len(group), 1),
            "n": len(group),
        })

    top10_players = [p["age"] for p in players if p["reached_top10"]]
    non_top10_players = [p["age"] for p in players if not p["reached_top10"]]
    early = [p for p in players if p["age"] < 20]
    late = [p for p in players if p["age"] >= 22]

    p_early = _pct(sum(1 for p in early if p["reached_top10"]), len(early))
    p_late = _pct(sum(1 for p in late if p["reached_top10"]), len(late))

    return {
        "cohorts": cohorts,
        "kpis": {
            "medianAgeTop10": _median(top10_players),
            "medianAgeNonTop10": _median(non_top10_players),
            "pTop10By19": p_early,
            "pTop10Late": p_late,
            "top10Ratio": round(p_early / p_late, 1) if p_late > 0 else None,
            "avgYearsEarly": round(
                sum(p["years_in_top100"] for p in early) / len(early), 1
            ) if early else None,
            "sampleSize": len(players),
        },
        "period": _format_period(rankings_through),
        "rankingsThrough": rankings_through,
        "sampleDefinition": (
            "Players whose first-ever Top-100 ranking week fell on or after 2000-01-01 "
            "(one row per player, not per year)"
        ),
    }
