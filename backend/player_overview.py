# backend/player_overview.py
"""Player profile overview aggregates from atp_player_matches."""
from __future__ import annotations

import math
from typing import Any

from h2h_utils import (
    SET_PATTERN,
    count_tiebreak_sets_won,
    is_deciding_set_match,
    row_to_dict,
)
from score_utils import player_perspective_score

SURFACE_COLORS = {
    "Hard": "#3b82f6",
    "Clay": "#ea580c",
    "Grass": "#22c55e",
    "Carpet": "#8b5cf6",
}

def _float(val: Any) -> float | None:
    if val is None or val == "":
        return None
    s = str(val).strip().lower()
    if s in ("nan", "none", "null"):
        return None
    try:
        x = float(s)
        return x if math.isfinite(x) else None
    except (ValueError, TypeError):
        return None


def _int(val: Any) -> int | None:
    f = _float(val)
    return int(f) if f is not None else None


def _fmt_date(iso: str | None) -> str:
    if not iso:
        return "—"
    parts = str(iso)[:10].split("-")
    if len(parts) != 3:
        return str(iso)
    months = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()
    try:
        return f"{int(parts[2])} {months[int(parts[1]) - 1]} {parts[0]}"
    except (ValueError, IndexError):
        return str(iso)


def _fmt_duration(minutes: float | None) -> str:
    if minutes is None or minutes <= 0:
        return "—"
    m = int(round(minutes))
    if m >= 60:
        return f"{m // 60}h {m % 60}m"
    return f"{m}m"


def _age_bucket(age: float | None) -> str | None:
    a = _float(age)
    if a is None:
        return None
    if a < 21:
        return "Under 21"
    if a <= 25:
        return "21 – 25"
    if a <= 30:
        return "26 – 30"
    if a <= 35:
        return "31 – 35"
    return "36+"


def _height_bucket(ht: float | None) -> str | None:
    h = _int(ht)
    if h is None:
        return None
    if h < 180:
        return "Under 180 cm"
    if h <= 190:
        return "180 – 190 cm"
    if h <= 200:
        return "191 – 200 cm"
    return "200 cm+"


def _comeback_from_02(score: str | None, won: bool) -> bool:
    if not won or not score:
        return False
    display = player_perspective_score(score, won)
    tokens = [t for t in display.split() if SET_PATTERN.match(t)]
    if len(tokens) < 3:
        return False
    lost_first_two = True
    for token in tokens[:2]:
        m = SET_PATTERN.match(token)
        if not m:
            return False
        if int(m.group(1)) > int(m.group(2)):
            lost_first_two = False
            break
    return lost_first_two


def _bucket_stats(rows: list[dict], bucket_fn) -> list[dict]:
    order: list[str] = []
    data: dict[str, dict[str, int]] = {}
    for m in rows:
        label = bucket_fn(m)
        if not label:
            continue
        if label not in data:
            order.append(label)
            data[label] = {"wins": 0, "losses": 0}
        if m["won"]:
            data[label]["wins"] += 1
        else:
            data[label]["losses"] += 1
    out = []
    for label in order:
        w, l = data[label]["wins"], data[label]["losses"]
        total = w + l
        out.append({
            "bucket": label,
            "wins": w,
            "losses": l,
            "pct": round(w / total * 100, 1) if total else 0.0,
        })
    return out


def build_player_overview(rows: list[dict]) -> dict:
    matches = [row_to_dict(r) for r in rows]
    if not matches:
        return {
            "lastMatches": [],
            "winRate": {"pct": 0, "wins": 0, "losses": 0, "total": 0},
            "surfaces": [],
            "duration": {"avg": "—", "longest": "—", "shortest": "—"},
            "aces": {"avg": 0, "total": 0, "bySurface": []},
            "doubleFaults": {"avg": 0, "total": 0, "bySurface": []},
            "vsAge": [],
            "vsHeight": [],
            "highlights": [],
        }

    sorted_desc = sorted(
        matches,
        key=lambda x: (x.get("match_date") or "", x.get("tourney_date") or ""),
        reverse=True,
    )
    last_matches = []
    for m in sorted_desc[:5]:
        won = m["won"]
        last_matches.append({
            "date": _fmt_date(m.get("match_date")),
            "tournament": m.get("tourney_name") or "—",
            "round": m.get("round") or "",
            "opponent": m.get("opponent_name") or "—",
            "result": "W" if won else "L",
            "score": player_perspective_score(m.get("score"), won),
            "surface": m.get("surface") or "",
        })

    wins = sum(1 for m in matches if m["won"])
    losses = len(matches) - wins
    total = len(matches)
    win_pct = round(wins / total * 100, 1) if total else 0.0

    surface_map: dict[str, dict[str, int]] = {}
    for m in matches:
        s = (m.get("surface") or "Unknown").strip() or "Unknown"
        surface_map.setdefault(s, {"wins": 0, "matches": 0})
        surface_map[s]["matches"] += 1
        if m["won"]:
            surface_map[s]["wins"] += 1
    surfaces = []
    for label, v in sorted(surface_map.items(), key=lambda x: -x[1]["matches"]):
        pct = round(v["wins"] / v["matches"] * 100, 1) if v["matches"] else 0
        surfaces.append({
            "key": label.lower().replace(" ", "-"),
            "label": label,
            "wins": v["wins"],
            "matches": v["matches"],
            "pct": pct,
            "color": SURFACE_COLORS.get(label, "#94a3b8"),
        })

    minutes = [_float(m.get("minutes")) for m in matches]
    mins = [m for m in minutes if m and m > 0]
    duration = {
        "avg": _fmt_duration(sum(mins) / len(mins)) if mins else "—",
        "longest": _fmt_duration(max(mins)) if mins else "—",
        "shortest": _fmt_duration(min(mins)) if mins else "—",
    }

    def serve_stats(field: str) -> dict:
        vals = [_float(m.get(field)) for m in matches]
        nums = [v for v in vals if v is not None]
        total_val = int(sum(nums)) if nums else 0
        avg = round(sum(nums) / len(nums), 1) if nums else 0.0
        by_surf: dict[str, list[float]] = {}
        for m in matches:
            v = _float(m.get(field))
            if v is None:
                continue
            s = (m.get("surface") or "Unknown").strip() or "Unknown"
            by_surf.setdefault(s, []).append(v)
        by_surface = [
            {"label": s, "avg": round(sum(vs) / len(vs), 1)}
            for s, vs in sorted(by_surf.items(), key=lambda x: -len(x[1]))
        ]
        return {"avg": avg, "total": total_val, "bySurface": by_surface}

    vs_age = _bucket_stats(
        matches,
        lambda m: _age_bucket(_float(m.get("opponent_age"))),
    )
    vs_height = _bucket_stats(
        matches,
        lambda m: _height_bucket(_float(m.get("opponent_ht"))),
    )

    highlights = _build_highlights(matches)

    return {
        "lastMatches": last_matches,
        "winRate": {"pct": win_pct, "wins": wins, "losses": losses, "total": total},
        "surfaces": surfaces,
        "duration": duration,
        "aces": serve_stats("player_ace"),
        "doubleFaults": serve_stats("player_df"),
        "vsAge": vs_age,
        "vsHeight": vs_height,
        "highlights": highlights,
    }


def _build_highlights(matches: list[dict]) -> list[dict]:
    items: list[dict] = []

    chrono = sorted(matches, key=lambda x: x.get("match_date") or "")
    best_streak = current = 0
    for m in chrono:
        if m["won"]:
            current += 1
            best_streak = max(best_streak, current)
        else:
            current = 0
    if best_streak > 1:
        items.append({
            "icon": "🔥",
            "label": "Best win streak",
            "value": f"{best_streak} matches",
        })

    tb_w = tb_l = 0
    for m in matches:
        p, o = count_tiebreak_sets_won(m.get("score"), m["won"])
        tb_w += p
        tb_l += o
    if tb_w + tb_l > 0:
        pct = round(tb_w / (tb_w + tb_l) * 100, 1)
        items.append({
            "icon": "🎯",
            "label": "Tiebreak win rate",
            "value": f"{pct}%",
        })

    dec_w = dec_l = 0
    for m in matches:
        if is_deciding_set_match(m.get("score"), m.get("best_of")):
            if m["won"]:
                dec_w += 1
            else:
                dec_l += 1
    if dec_w or dec_l:
        items.append({
            "icon": "⏱️",
            "label": "Deciding set record",
            "value": f"{dec_w} – {dec_l}",
        })

    top10_w = top10_l = 0
    for m in matches:
        r = _int(m.get("opponent_rank"))
        if r is None or r > 10:
            continue
        if m["won"]:
            top10_w += 1
        else:
            top10_l += 1
    if top10_w or top10_l:
        items.append({
            "icon": "🏆",
            "label": "Vs top-10 record",
            "value": f"{top10_w} – {top10_l}",
        })

    comebacks = sum(
        1 for m in matches if _comeback_from_02(m.get("score"), m["won"])
    )
    if comebacks:
        items.append({
            "icon": "💪",
            "label": "Comebacks from 0–2 sets",
            "value": str(comebacks),
        })

    return items


OVERVIEW_COLUMNS = """
    tourney_name, surface, tourney_date, match_date, round, score, best_of, minutes,
    won_match, opponent_name, opponent_age, opponent_ht, opponent_rank,
    player_ace, player_df
"""
