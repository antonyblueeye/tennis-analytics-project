# backend/hypotheses_peak_age.py
"""H2: Peak career age & milestone timing (milestones since 2000)."""
from __future__ import annotations

import statistics
from typing import Any

YOUNGEST_SLAM_SQL = """
SELECT
    player_name,
    player_age::numeric AS player_age,
    tourney_name,
    tourney_date
FROM atp_player_matches
WHERE tourney_level = 'G'
  AND round = 'F'
  AND won_match = '1'
  AND tourney_date >= '20000101'
  AND player_age ~ '^[0-9]'
ORDER BY player_age::numeric ASC
LIMIT 1
"""

MILESTONE_AGES_SQL = """
WITH player_dob AS (
    SELECT
        player_id,
        to_date(regexp_replace(dob, '\\..*$', ''), 'YYYYMMDD') AS birth_date
    FROM atp_players
    WHERE dob ~ '^[0-9]{8}'
),
rank_milestones AS (
    SELECT
        ROUND(r.player::numeric)::bigint AS player_id,
        MIN(r.ranking_date) FILTER (WHERE r.rank <= 100) AS first_top100_date,
        MIN(r.ranking_date) FILTER (WHERE r.rank <= 10) AS first_top10_date,
        MIN(r.ranking_date) FILTER (WHERE r.rank = 1) AS first_num1_date
    FROM atp_rankings r
    GROUP BY ROUND(r.player::numeric)::bigint
),
first_slams AS (
    SELECT
        player_id,
        MIN(player_age::numeric) AS age_at_first_slam
    FROM atp_player_matches
    WHERE tourney_level = 'G'
      AND round = 'F'
      AND won_match = '1'
      AND tourney_date >= '20000101'
      AND player_age ~ '^[0-9]'
    GROUP BY player_id
)
SELECT
    CASE
        WHEN rm.first_top100_date >= 20000101 THEN
            (to_date(rm.first_top100_date::text, 'YYYYMMDD') - d.birth_date) / 365.25
    END AS age_top100,
    CASE
        WHEN rm.first_top10_date >= 20000101 THEN
            (to_date(rm.first_top10_date::text, 'YYYYMMDD') - d.birth_date) / 365.25
    END AS age_top10,
    CASE
        WHEN rm.first_num1_date >= 20000101 THEN
            (to_date(rm.first_num1_date::text, 'YYYYMMDD') - d.birth_date) / 365.25
    END AS age_num1,
    fs.age_at_first_slam AS age_slam
FROM rank_milestones rm
JOIN player_dob d ON d.player_id = rm.player_id::text
LEFT JOIN first_slams fs ON fs.player_id = rm.player_id::text
"""

MILESTONE_LABELS = [
    ("Top 100", "age_top100"),
    ("Top 10", "age_top10"),
    ("World #1", "age_num1"),
    ("Grand Slam", "age_slam"),
]

HISTOGRAM_AGES = list(range(18, 27))


def _float(val: Any) -> float | None:
    if val is None:
        return None
    return float(val)


def _valid_age(age: float | None) -> bool:
    return age is not None and 14 <= age <= 45


def _percentile(values: list[float], q: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    n = len(ordered)
    if n == 1:
        return ordered[0]
    pos = q * (n - 1)
    lo = int(pos)
    hi = min(lo + 1, n - 1)
    frac = pos - lo
    return ordered[lo] * (1 - frac) + ordered[hi] * frac


def _round1(val: float | None) -> float | None:
    return round(val, 1) if val is not None else None


def _stats(values: list[float]) -> dict[str, float | int | None]:
    if not values:
        return {"median": None, "p25": None, "p75": None, "n": 0}
    return {
        "median": _round1(statistics.median(values)),
        "p25": _round1(_percentile(values, 0.25)),
        "p75": _round1(_percentile(values, 0.75)),
        "n": len(values),
    }


def _peak_window(values: list[float], width: int = 4) -> dict[str, int | None]:
    if not values:
        return {"start": None, "end": None}
    counts = {age: 0 for age in range(18, 35)}
    for age in values:
        counts[int(age)] = counts.get(int(age), 0) + 1
    best_start = max(range(18, 32), key=lambda start: sum(counts.get(start + i, 0) for i in range(width)))
    return {"start": best_start, "end": best_start + width - 1}


def _format_slam_sub(row: dict | None) -> str | None:
    if not row:
        return None
    year = str(row.get("tourney_date", ""))[:4]
    tourney = row.get("tourney_name") or "Grand Slam"
    return f"{row.get('player_name', 'Unknown')} · {tourney} {year}".strip()


def _histogram_bucket(age: float) -> int | str:
    bucket = int(age)
    return bucket if bucket <= 26 else "27+"


def aggregate_peak_age(youngest_slam: dict | None, rows: list[dict]) -> dict:
    ages: dict[str, list[float]] = {
        "age_top100": [],
        "age_top10": [],
        "age_num1": [],
        "age_slam": [],
    }

    for row in rows:
        for key in ages:
            val = _float(row.get(key))
            if _valid_age(val):
                ages[key].append(val)

    milestones = []
    for label, key in MILESTONE_LABELS:
        stats = _stats(ages[key])
        milestones.append({"milestone": label, **stats})

    slam_stats = _stats(ages["age_slam"])
    top10_window = _peak_window(ages["age_top10"])
    num1_ages = ages["age_num1"]
    late_num1 = sum(1 for age in num1_ages if age > 28)
    late_rate = round(late_num1 / len(num1_ages) * 100, 1) if num1_ages else None

    distribution = []
    for age in HISTOGRAM_AGES:
        distribution.append({
            "age": age,
            "top100": sum(1 for a in ages["age_top100"] if int(a) == age),
            "top10": sum(1 for a in ages["age_top10"] if int(a) == age),
            "slam": sum(1 for a in ages["age_slam"] if int(a) == age),
        })
    distribution.append({
        "age": "27+",
        "top100": sum(1 for a in ages["age_top100"] if int(a) >= 27),
        "top10": sum(1 for a in ages["age_top10"] if int(a) >= 27),
        "slam": sum(1 for a in ages["age_slam"] if int(a) >= 27),
    })

    youngest_age = _round1(_float(youngest_slam.get("player_age"))) if youngest_slam else None

    return {
        "milestones": [
            {
                "milestone": m["milestone"],
                "median": m["median"],
                "p25": m["p25"],
                "p75": m["p75"],
            }
            for m in milestones
        ],
        "distribution": distribution,
        "kpis": {
            "youngestSlamAge": youngest_age,
            "youngestSlamSub": _format_slam_sub(youngest_slam),
            "medianFirstSlam": slam_stats["median"],
            "slamP25": slam_stats["p25"],
            "slamP75": slam_stats["p75"],
            "slamSampleSize": slam_stats["n"],
            "peakTop10Start": top10_window["start"],
            "peakTop10End": top10_window["end"],
            "lateNum1Rate": late_rate,
            "lateNum1Count": late_num1,
            "num1SampleSize": len(num1_ages),
        },
        "period": "2000–present",
        "sampleDefinition": (
            "First Top-100 / Top-10 / #1 ranking week and first Slam title on or after 2000-01-01; "
            "ages from atp_players.dob (rankings) or match player_age (Slams)"
        ),
    }
