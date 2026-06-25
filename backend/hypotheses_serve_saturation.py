# backend/hypotheses_serve_saturation.py
"""H3: First-serve percentage vs match win rate (saturation since 2015)."""
from __future__ import annotations

from typing import Any

SERVE_START_DATE = "20150101"
MIN_SERVE_POINTS = 20
PCT_MIN = 40
PCT_MAX = 80
CURVE_MIN_MATCHES = 100

SERVE_BUCKETS_SQL = """
SELECT
    CASE
        WHEN fs < 55 THEN '<55%%'
        WHEN fs < 60 THEN '55–60%%'
        WHEN fs < 65 THEN '60–65%%'
        ELSE '65%%+'
    END AS bucket,
    ROUND(AVG(fs), 1) AS first_serve,
    ROUND(100.0 * AVG(won), 1) AS win_rate,
    COUNT(*)::int AS matches
FROM (
    SELECT
        CASE WHEN won_match = '1' THEN 1.0 ELSE 0.0 END AS won,
        100.0 * "player_1stIn"::numeric / player_svpt::numeric AS fs
    FROM atp_player_matches
    WHERE tourney_date >= %(start_date)s
      AND "player_1stIn" ~ '^[0-9]'
      AND player_svpt ~ '^[0-9]'
      AND player_svpt::numeric >= %(min_svpt)s
      AND 100.0 * "player_1stIn"::numeric / player_svpt::numeric BETWEEN %(pct_min)s AND %(pct_max)s
) s
GROUP BY 1
ORDER BY MIN(fs)
"""

SERVE_CURVE_SQL = """
SELECT
    ROUND(fs::numeric, 0)::int AS pct,
    ROUND(100.0 * AVG(won), 1) AS win_rate,
    COUNT(*)::int AS matches
FROM (
    SELECT
        CASE WHEN won_match = '1' THEN 1.0 ELSE 0.0 END AS won,
        100.0 * "player_1stIn"::numeric / player_svpt::numeric AS fs
    FROM atp_player_matches
    WHERE tourney_date >= %(start_date)s
      AND "player_1stIn" ~ '^[0-9]'
      AND player_svpt ~ '^[0-9]'
      AND player_svpt::numeric >= %(min_svpt)s
      AND 100.0 * "player_1stIn"::numeric / player_svpt::numeric BETWEEN %(pct_min)s AND %(pct_max)s
) s
GROUP BY 1
HAVING COUNT(*) >= %(min_matches)s
ORDER BY 1
"""

SERVE_META_SQL = """
SELECT
    COUNT(*)::int AS matches,
    MIN(tourney_date)::bigint AS min_date,
    MAX(tourney_date)::bigint AS max_date
FROM atp_player_matches
WHERE tourney_date >= %(start_date)s
  AND "player_1stIn" ~ '^[0-9]'
  AND player_svpt ~ '^[0-9]'
  AND player_svpt::numeric >= %(min_svpt)s
  AND 100.0 * "player_1stIn"::numeric / player_svpt::numeric BETWEEN %(pct_min)s AND %(pct_max)s
"""

SQL_PARAMS = {
    "start_date": SERVE_START_DATE,
    "min_svpt": MIN_SERVE_POINTS,
    "pct_min": PCT_MIN,
    "pct_max": PCT_MAX,
    "min_matches": CURVE_MIN_MATCHES,
}


def _float(val: Any) -> float | None:
    if val is None:
        return None
    return float(val)


def _round1(val: float | None) -> float | None:
    return round(val, 1) if val is not None else None


def _format_period(min_date: int | None, max_date: int | None) -> str:
    if not min_date or not max_date:
        return "2015–present"
    return f"{str(min_date)[:4]}–{str(max_date)[:4]}"


def _interp(pct: float, curve: list[dict]) -> float | None:
    if not curve:
        return None
    points = sorted((c["pct"], c["winRate"]) for c in curve)
    if pct <= points[0][0]:
        return points[0][1]
    if pct >= points[-1][0]:
        return points[-1][1]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        if x0 <= pct <= x1:
            if x1 == x0:
                return y0
            return y0 + (y1 - y0) * (pct - x0) / (x1 - x0)
    return None


def _weighted_r2(xs: list[float], ys: list[float], ws: list[float], degree: int) -> float | None:
    if len(xs) < degree + 2:
        return None
    size = degree + 1
    xtx = [[0.0] * size for _ in range(size)]
    xty = [0.0] * size
    for x, y, w in zip(xs, ys, ws):
        for i in range(size):
            xi = w * (x ** i)
            xty[i] += xi * y
            for j in range(size):
                xtx[i][j] += xi * (x ** j)

    aug = [xtx[i][:] + [xty[i]] for i in range(size)]
    for col in range(size):
        pivot = max(range(col, size), key=lambda row: abs(aug[row][col]))
        aug[col], aug[pivot] = aug[pivot], aug[col]
        div = aug[col][col]
        if abs(div) < 1e-12:
            return None
        aug[col] = [value / div for value in aug[col]]
        for row in range(size):
            if row == col:
                continue
            factor = aug[row][col]
            aug[row] = [aug[row][idx] - factor * aug[col][idx] for idx in range(size + 1)]

    coef = [aug[i][size] for i in range(size)]
    weight_sum = sum(ws)
    ybar = sum(y * w for y, w in zip(ys, ws)) / weight_sum
    ss_tot = sum(w * (y - ybar) ** 2 for y, w in zip(ys, ws))
    ss_res = sum(
        w * (y - sum(coef[k] * (x ** k) for k in range(size))) ** 2
        for x, y, w in zip(xs, ys, ws)
    )
    if ss_tot <= 0:
        return None
    return round(1 - ss_res / ss_tot, 2)


def _saturation_point(curve: list[dict], window: int = 5, threshold: float = 0.5) -> int | None:
    if not curve:
        return None
    lo = max(min(c["pct"] for c in curve), 55)
    hi = min(max(c["pct"] for c in curve) - window, 68)
    for pct in range(lo, hi + 1):
        start = _interp(float(pct), curve)
        end = _interp(float(pct + window), curve)
        if start is None or end is None:
            continue
        marginal = (end - start) / window
        if marginal < threshold:
            return pct
    return None


def aggregate_serve_saturation(
    meta: dict | None,
    bucket_rows: list[dict],
    curve_rows: list[dict],
) -> dict:
    buckets = [
        {
            "bucket": row["bucket"],
            "firstServe": _float(row["first_serve"]),
            "winRate": _float(row["win_rate"]),
            "matches": int(row["matches"]),
        }
        for row in bucket_rows
    ]

    curve = [
        {
            "pct": int(row["pct"]),
            "winRate": _float(row["win_rate"]),
            "matches": int(row["matches"]),
        }
        for row in curve_rows
    ]

    xs = [float(c["pct"]) for c in curve]
    ys = [float(c["winRate"]) for c in curve]
    ws = [float(c["matches"]) for c in curve]

    win_55 = _interp(55.0, curve)
    win_65 = _interp(65.0, curve)
    lift = _round1(win_65 - win_55) if win_55 is not None and win_65 is not None else None

    saturation = _saturation_point(curve)
    matches = int(meta["matches"]) if meta and meta.get("matches") else sum(b["matches"] for b in buckets)

    return {
        "buckets": buckets,
        "curve": curve,
        "kpis": {
            "saturationPoint": saturation,
            "winRateLift": lift,
            "matchCount": matches,
            "r2Linear": _weighted_r2(xs, ys, ws, 1),
            "r2Quadratic": _weighted_r2(xs, ys, ws, 2),
        },
        "period": _format_period(
            int(meta["min_date"]) if meta and meta.get("min_date") else None,
            int(meta["max_date"]) if meta and meta.get("max_date") else None,
        ),
        "sampleDefinition": (
            "Player-match rows from atp_player_matches with valid serve stats "
            f"({PCT_MIN}–{PCT_MAX}% 1st-serve in, ≥{MIN_SERVE_POINTS} serve points)"
        ),
    }
