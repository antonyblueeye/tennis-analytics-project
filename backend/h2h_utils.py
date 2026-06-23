# backend/h2h_utils.py
"""Head-to-head aggregation from atp_player_matches."""
from __future__ import annotations

import re
from typing import Any

from score_utils import player_perspective_score

SET_PATTERN = re.compile(r"^(\d+)-(\d+)(?:\([^)]*\))?$")

LEVEL_LABELS = {
    "G": "Grand Slam",
    "M": "Masters",
    "D": "Davis Cup",
    "F": "Finals",
}

LEVEL_COLORS = {
    "Grand Slam": "#eab308",
    "Masters": "#8b5cf6",
    "Finals": "#f97316",
    "ATP 500": "#06b6d4",
    "ATP 250": "#94a3b8",
    "Other": "#64748b",
}


def _int(val: Any) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(float(str(val).strip()))
    except (ValueError, TypeError):
        return None


def _float(val: Any) -> float | None:
    if val is None or val == "":
        return None
    try:
        return float(str(val).strip())
    except (ValueError, TypeError):
        return None


def _pct(wins: int, losses: int) -> float:
    total = wins + losses
    return round(wins / total * 100, 1) if total else 0.0


def format_hand(hand: str | None) -> str:
    if not hand:
        return "Unknown"
    h = hand.strip().upper()
    if h in ("R", "RIGHT"):
        return "Right"
    if h in ("L", "LEFT"):
        return "Left"
    if h == "U":
        return "Ambidextrous"
    return hand.strip().capitalize()


def format_hand_matchup(hand: str | None) -> str:
    label = format_hand(hand)
    if label == "Unknown":
        return "unknown-hand"
    return f"{label.lower()}-handed"


def age_bracket(age: float | int | None) -> str:
    a = _float(age)
    if a is None:
        return "unknown age"
    if a < 21:
        return "under 21"
    if a <= 25:
        return "21–25"
    if a <= 30:
        return "26–30"
    if a <= 35:
        return "31–35"
    return "36+"


def height_bracket(ht: int | None) -> tuple[int | None, int | None, str]:
    h = _int(ht)
    if h is None:
        return None, None, "unknown height"
    base = (h // 10) * 10
    return base, base + 9, f"{base}–{base + 9} cm"


def rank_bracket(rank: int | None) -> str:
    r = _int(rank)
    if r is None:
        return "unranked opponents"
    if r <= 5:
        return "top-5 ranked"
    if r <= 10:
        return "top-10 ranked"
    if r <= 20:
        return "top-20 ranked"
    if r <= 50:
        return "top-50 ranked"
    if r <= 100:
        return "top-100 ranked"
    return "outside top-100"


def tourney_level_label(level: str | None, tourney_id: str | None) -> str:
    from tourney_utils import is_atp_finals, map_tourney_level

    if level == "F" or is_atp_finals(tourney_id):
        return "Finals"
    if level == "G":
        return "Grand Slam"
    if level == "M":
        return "Masters"
    if level == "D":
        return "Davis Cup"
    if level == "A" and tourney_id:
        mapped = map_tourney_level("A", tourney_id)
        return "ATP 500" if mapped == "500" else "ATP 250"
    return "Other"


def parse_sets(score: str | None, won: bool) -> tuple[int, int]:
    if not score:
        return 0, 0
    display = player_perspective_score(score, won)
    if display in ("—", "W/O", "DEF", "RET", "ABD", "UNP"):
        return 0, 0
    p_sets = o_sets = 0
    for token in display.split():
        m = SET_PATTERN.match(token)
        if not m:
            continue
        a, b = int(m.group(1)), int(m.group(2))
        if a > b:
            p_sets += 1
        elif b > a:
            o_sets += 1
    return p_sets, o_sets


def count_tiebreak_sets_won(score: str | None, won: bool) -> tuple[int, int]:
    """Tiebreak sets won by player and opponent (from player's perspective)."""
    if not score:
        return 0, 0
    display = player_perspective_score(score, won)
    if display in ("—", "W/O", "DEF", "RET", "ABD", "UNP"):
        return 0, 0
    p_tb = o_tb = 0
    for token in display.split():
        m = SET_PATTERN.match(token)
        if not m:
            continue
        a, b = int(m.group(1)), int(m.group(2))
        if a == 7 and b == 6:
            p_tb += 1
        elif a == 6 and b == 7:
            o_tb += 1
    return p_tb, o_tb


def is_deciding_set_match(score: str | None, best_of: str | None) -> bool:
    if not score:
        return False
    tokens = [t for t in score.split() if SET_PATTERN.match(t)]
    if len(tokens) < 2:
        return False
    bo = _int(best_of) or 3
    needed = (bo + 1) // 2
    return len(tokens) >= needed and len(tokens) <= needed + 1


def round_sort_key(r: str) -> int:
    order = {"F": 0, "SF": 1, "QF": 2, "R16": 3, "R32": 4, "R64": 5, "R128": 6, "RR": 7, "BR": 8}
    return order.get(r, 99)


APM_COLUMNS = """
    row_id, tourney_id, tourney_name, surface, tourney_level, tourney_date, match_date,
    round, score, best_of, minutes, won_match,
    player_rank, opponent_rank, player_ht, opponent_ht,
    player_hand, opponent_hand, player_ioc, opponent_ioc,
    player_age, opponent_age,
    player_ace, player_df, player_svpt, "player_1stIn", "player_1stWon",
    "player_bpSaved", "player_bpFaced",
    opponent_ace, opponent_df, opponent_svpt, "opponent_1stIn", "opponent_1stWon",
    "opponent_bpSaved", "opponent_bpFaced"
"""


def row_to_dict(row: dict) -> dict:
    won = str(row.get("won_match", "0")) in ("1", "1.0", "True", "true")
    p_sets, o_sets = parse_sets(row.get("score"), won)
    return {
        **row,
        "won": won,
        "player_sets": p_sets,
        "opponent_sets": o_sets,
    }


def aggregate_h2h(rows_a: list[dict], rows_b: list[dict], name_a: str, name_b: str) -> dict:
    """rows_a: matches from player A perspective vs B."""
    a = [row_to_dict(r) for r in rows_a]

    wins_a = sum(1 for m in a if m["won"])
    wins_b = len(a) - wins_a
    sets_a = sum(m["player_sets"] for m in a)
    sets_b = sum(m["opponent_sets"] for m in a)

    meetings = []
    for m in sorted(a, key=lambda x: x.get("match_date") or "", reverse=True):
        meetings.append({
            "date": m.get("match_date") or "",
            "tournament": m.get("tourney_name") or "",
            "round": m.get("round") or "",
            "surface": m.get("surface") or "",
            "winner": "a" if m["won"] else "b",
            "score": player_perspective_score(m.get("score"), m["won"]),
        })

    surface_map: dict[str, dict[str, int]] = {}
    for m in a:
        s = m.get("surface") or "Unknown"
        surface_map.setdefault(s, {"a": 0, "b": 0})
        if m["won"]:
            surface_map[s]["a"] += 1
        else:
            surface_map[s]["b"] += 1
    by_surface = [{"surface": k, "a": v["a"], "b": v["b"]} for k, v in sorted(surface_map.items())]

    level_map: dict[str, int] = {}
    for m in a:
        lbl = tourney_level_label(m.get("tourney_level"), m.get("tourney_id"))
        level_map[lbl] = level_map.get(lbl, 0) + 1
    tourney_levels = [
        {"name": k, "value": v, "color": LEVEL_COLORS.get(k, "#64748b")}
        for k, v in sorted(level_map.items(), key=lambda x: -x[1])
    ]

    round_map: dict[str, dict[str, int]] = {}
    for m in a:
        r = m.get("round") or "?"
        round_map.setdefault(r, {"a": 0, "b": 0})
        if m["won"]:
            round_map[r]["a"] += 1
        else:
            round_map[r]["b"] += 1
    by_round = [
        {"round": r, "a": v["a"], "b": v["b"]}
        for r, v in sorted(round_map.items(), key=lambda x: round_sort_key(x[0]))
    ]

    style = _avg_style(a)
    radar = _radar_from_style(style)
    insights = _insights(a, name_a, name_b, wins_a, wins_b)

    return {
        "summary": {"winsA": wins_a, "winsB": wins_b, "setsA": sets_a, "setsB": sets_b},
        "meetings": meetings,
        "bySurface": by_surface,
        "tourneyLevels": tourney_levels,
        "byRound": by_round,
        "style": style,
        "radar": radar,
        "insights": insights,
    }


def _avg_style(matches: list[dict]) -> list[dict]:
    def avg(field: str) -> float | None:
        vals = [_float(m.get(field)) for m in matches]
        nums = [v for v in vals if v is not None]
        return round(sum(nums) / len(nums), 1) if nums else None

    def avg_pct(num_field: str, den_field: str) -> float | None:
        nums, dens = [], []
        for m in matches:
            n, d = _float(m.get(num_field)), _float(m.get(den_field))
            if n is not None and d and d > 0:
                nums.append(n)
                dens.append(d)
        if not dens:
            return None
        return round(sum(nums) / sum(dens) * 100, 1)

    def avg_bp_saved() -> float | None:
        saved, faced = [], []
        for m in matches:
            s, f = _float(m.get("player_bpSaved")), _float(m.get("player_bpFaced"))
            if s is not None and f and f > 0:
                saved.append(s)
                faced.append(f)
        if not faced:
            return None
        return round(sum(saved) / sum(faced) * 100, 1)

    ace = avg("player_ace")
    first_in = avg_pct("player_1stIn", "player_svpt")
    first_won = avg_pct("player_1stWon", "player_1stIn")
    bp = avg_bp_saved()
    df = avg("player_df")

    def avg_opp_bp_saved() -> float | None:
        saved, faced = [], []
        for m in matches:
            s, f = _float(m.get("opponent_bpSaved")), _float(m.get("opponent_bpFaced"))
            if s is not None and f and f > 0:
                saved.append(s)
                faced.append(f)
        if not faced:
            return None
        return round(sum(saved) / sum(faced) * 100, 1)

    b_ace = avg("opponent_ace")
    b_first_in = avg_pct("opponent_1stIn", "opponent_svpt")
    b_first_won = avg_pct("opponent_1stWon", "opponent_1stIn")
    b_bp = avg_opp_bp_saved()

    items = [
        {"label": "Aces / match", "a": ace, "b": b_ace, "max": 15, "invert": False},
        {"label": "1st serve %", "a": first_in, "b": b_first_in, "max": 80, "pct": True},
        {"label": "1st serve won %", "a": first_won, "b": b_first_won, "max": 85, "pct": True},
        {"label": "BP saved %", "a": bp, "b": b_bp, "max": 80, "pct": True},
        {"label": "DF / match", "a": df, "b": avg("opponent_df"), "max": 6, "invert": True},
    ]
    return [i for i in items if i["a"] is not None or i["b"] is not None]


def _radar_from_style(style: list[dict]) -> list[dict]:
    """Relative 0–100 index from H2H serve averages."""
    mapping = {
        "Aces / match": "Serve",
        "1st serve %": "1st serve",
        "1st serve won %": "1st serve won",
        "BP saved %": "Clutch",
        "DF / match": "Consistency",
    }
    out = []
    for s in style:
        stat = mapping.get(s["label"])
        if not stat:
            continue
        max_v = s.get("max") or 100
        a_val = s.get("a")
        b_val = s.get("b")
        invert = s.get("invert", False)
        if a_val is None and b_val is None:
            continue

        def norm(v: float | None) -> int:
            if v is None:
                return 50
            pct = min(100, max(0, (v / max_v) * 100))
            return int(100 - pct) if invert else int(pct)

        out.append({"stat": stat, "a": norm(a_val), "b": norm(b_val)})
    return out


def _insights(matches: list[dict], name_a: str, name_b: str, wins_a: int, wins_b: int) -> list[dict]:
    items: list[dict] = []

    minutes = [_float(m.get("minutes")) for m in matches]
    mins = [m for m in minutes if m and m > 0]
    if mins:
        avg_m = int(round(sum(mins) / len(mins)))
        items.append({
            "icon": "⏱️",
            "label": "Avg. H2H duration",
            "value": f"{avg_m // 60}h {avg_m % 60}m" if avg_m >= 60 else f"{avg_m} min",
        })

    tb_a = tb_b = 0
    for m in matches:
        p_tb, o_tb = count_tiebreak_sets_won(m.get("score"), m["won"])
        tb_a += p_tb
        tb_b += o_tb
    if tb_a or tb_b:
        last_a = name_a.split()[-1]
        last_b = name_b.split()[-1]
        items.append({
            "icon": "🎯",
            "label": f"Tiebreak sets ({last_a} – {last_b})",
            "value": f"{tb_a} – {tb_b}",
        })

    dec_a = dec_b = 0
    for m in matches:
        if is_deciding_set_match(m.get("score"), m.get("best_of")):
            if m["won"]:
                dec_a += 1
            else:
                dec_b += 1
    if dec_a or dec_b:
        last_a = name_a.split()[-1]
        last_b = name_b.split()[-1]
        items.append({
            "icon": "💪",
            "label": f"Deciding set record ({last_a} – {last_b})",
            "value": f"{dec_a} – {dec_b}",
        })

    streak = best = 0
    current = 0
    for m in sorted(matches, key=lambda x: x.get("match_date") or ""):
        if m["won"]:
            current += 1
            best = max(best, current)
        else:
            current = 0
    if best > 1:
        items.append({"icon": "🔥", "label": f"Longest win streak ({name_a.split()[-1]})", "value": f"{best} matches"})

    surf_counts: dict[str, int] = {}
    for m in matches:
        s = m.get("surface") or "?"
        surf_counts[s] = surf_counts.get(s, 0) + 1
    if surf_counts:
        top = max(surf_counts, key=surf_counts.get)
        items.append({"icon": "🌡️", "label": "Most common surface", "value": f"{top} ({surf_counts[top]})"})

    stage_order = {"F": 0, "SF": 1, "QF": 2, "RR": 3}
    best_win = None
    for m in matches:
        if not m["won"]:
            continue
        r = m.get("round") or ""
        key = stage_order.get(r, 99)
        if best_win is None or key < best_win[0]:
            best_win = (key, m)
    if best_win:
        m = best_win[1]
        items.append({
            "icon": "🏆",
            "label": f"Biggest stage win ({name_a.split()[-1]})",
            "value": f"{m.get('tourney_name', '')} {m.get('round', '')}".strip(),
        })

    return items


def career_matchup_row(
    cur,
    player_id: str,
    exclude_opponent_id: str,
    label: str,
    where_extra: str,
    params: list,
) -> dict:
    sql = f"""
        SELECT
            SUM(CASE WHEN won_match::text = '1' THEN 1 ELSE 0 END)::int AS wins,
            SUM(CASE WHEN won_match::text = '0' THEN 1 ELSE 0 END)::int AS losses
        FROM atp_player_matches apm
        WHERE apm.player_id = %s
          AND apm.opponent_id != %s
          AND {where_extra}
    """
    cur.execute(sql, [player_id, exclude_opponent_id, *params])
    row = dict(cur.fetchone())
    wins = row.get("wins") or 0
    losses = row.get("losses") or 0
    return {
        "label": label,
        "wins": wins,
        "losses": losses,
        "pct": _pct(wins, losses),
    }


def build_matchup_context(
    cur,
    player_a_id: str,
    player_b_id: str,
    profile_a: dict,
    profile_b: dict,
) -> dict:
    ht_b = _int(profile_b.get("height"))
    ht_a = _int(profile_a.get("height"))
    _, _, ht_label_b = height_bracket(ht_b)
    _, _, ht_label_a = height_bracket(ht_a)
    lo_b, hi_b, _ = height_bracket(ht_b)
    lo_a, hi_a, _ = height_bracket(ht_a)

    rank_b = _int(profile_b.get("rank"))
    rank_a = _int(profile_a.get("rank"))
    age_b = _float(profile_b.get("age"))
    age_a = _float(profile_a.get("age"))

    vs_height_a = {"wins": 0, "losses": 0, "pct": 0.0, "label": f"vs {ht_label_b} opponents"}
    vs_height_b = {"wins": 0, "losses": 0, "pct": 0.0, "label": f"vs {ht_label_a} opponents"}
    if lo_b is not None:
        vs_height_a = career_matchup_row(
            cur, player_a_id, player_b_id, vs_height_a["label"],
            "apm.opponent_ht ~ '^[0-9]' AND apm.opponent_ht::numeric >= %s AND apm.opponent_ht::numeric <= %s",
            [lo_b, hi_b],
        )
    if lo_a is not None:
        vs_height_b = career_matchup_row(
            cur, player_b_id, player_a_id, vs_height_b["label"],
            "apm.opponent_ht ~ '^[0-9]' AND apm.opponent_ht::numeric >= %s AND apm.opponent_ht::numeric <= %s",
            [lo_a, hi_a],
        )

    rank_label_b = rank_bracket(rank_b)
    rank_label_a = rank_bracket(rank_a)

    def rank_filter(rank: int | None) -> tuple[str, list]:
        r = _int(rank)
        if r is None:
            return "apm.opponent_rank IS NULL OR apm.opponent_rank = ''", []
        nan_guard = "apm.opponent_rank NOT ILIKE '%%nan%%'"
        if r <= 5:
            return f"apm.opponent_rank ~ '^[0-9]' AND {nan_guard} AND apm.opponent_rank::numeric <= 5", []
        if r <= 10:
            return f"apm.opponent_rank ~ '^[0-9]' AND {nan_guard} AND apm.opponent_rank::numeric <= 10", []
        if r <= 20:
            return f"apm.opponent_rank ~ '^[0-9]' AND {nan_guard} AND apm.opponent_rank::numeric <= 20", []
        if r <= 50:
            return f"apm.opponent_rank ~ '^[0-9]' AND {nan_guard} AND apm.opponent_rank::numeric <= 50", []
        if r <= 100:
            return f"apm.opponent_rank ~ '^[0-9]' AND {nan_guard} AND apm.opponent_rank::numeric <= 100", []
        return f"apm.opponent_rank ~ '^[0-9]' AND {nan_guard} AND apm.opponent_rank::numeric > 100", []

    rf_b, rp_b = rank_filter(rank_b)
    rf_a, rp_a = rank_filter(rank_a)
    vs_rank_a = career_matchup_row(
        cur, player_a_id, player_b_id, f"vs {rank_label_b}",
        rf_b, rp_b,
    )
    vs_rank_b = career_matchup_row(
        cur, player_b_id, player_a_id, f"vs {rank_label_a}",
        rf_a, rp_a,
    )

    ioc_b = profile_b.get("ioc")
    ioc_a = profile_a.get("ioc")
    vs_country_a = {"wins": 0, "losses": 0, "pct": 0.0, "label": f"vs {ioc_b or '?'} players"}
    vs_country_b = {"wins": 0, "losses": 0, "pct": 0.0, "label": f"vs {ioc_a or '?'} players"}
    if ioc_b:
        vs_country_a = career_matchup_row(
            cur, player_a_id, player_b_id, vs_country_a["label"],
            "apm.opponent_ioc = %s", [ioc_b],
        )
    if ioc_a:
        vs_country_b = career_matchup_row(
            cur, player_b_id, player_a_id, vs_country_b["label"],
            "apm.opponent_ioc = %s", [ioc_a],
        )

    age_label_b = age_bracket(age_b)
    age_label_a = age_bracket(age_a)

    def age_filter(age: float | None) -> tuple[str, list]:
        a = _float(age)
        if a is None:
            return "FALSE", []
        if a < 21:
            return "apm.opponent_age ~ '^[0-9]' AND apm.opponent_age::numeric < 21", []
        if a <= 25:
            return "apm.opponent_age ~ '^[0-9]' AND apm.opponent_age::numeric >= 21 AND apm.opponent_age::numeric <= 25", []
        if a <= 30:
            return "apm.opponent_age ~ '^[0-9]' AND apm.opponent_age::numeric >= 26 AND apm.opponent_age::numeric <= 30", []
        if a <= 35:
            return "apm.opponent_age ~ '^[0-9]' AND apm.opponent_age::numeric >= 31 AND apm.opponent_age::numeric <= 35", []
        return "apm.opponent_age ~ '^[0-9]' AND apm.opponent_age::numeric >= 36", []

    af_b, ap_b = age_filter(age_b)
    af_a, ap_a = age_filter(age_a)
    vs_age_a = career_matchup_row(
        cur, player_a_id, player_b_id, f"vs age {age_label_b} opponents",
        af_b, ap_b,
    )
    vs_age_b = career_matchup_row(
        cur, player_b_id, player_a_id, f"vs age {age_label_a} opponents",
        af_a, ap_a,
    )

    hand_b = profile_b.get("hand")
    hand_a = profile_a.get("hand")

    def hand_filter(hand: str | None) -> tuple[str, list]:
        if not hand:
            return "FALSE", []
        h = hand.strip().upper()
        if h in ("R", "RIGHT"):
            return "(apm.opponent_hand IN ('R', 'Right', 'right'))", []
        if h in ("L", "LEFT"):
            return "(apm.opponent_hand IN ('L', 'Left', 'left'))", []
        return "apm.opponent_hand = %s", [hand]

    hf_b, hp_b = hand_filter(hand_b)
    hf_a, hp_a = hand_filter(hand_a)
    vs_hand_a = career_matchup_row(
        cur, player_a_id, player_b_id, f"vs {format_hand_matchup(hand_b)} opponents",
        hf_b, hp_b,
    )
    vs_hand_b = career_matchup_row(
        cur, player_b_id, player_a_id, f"vs {format_hand_matchup(hand_a)} opponents",
        hf_a, hp_a,
    )

    return {
        "vsHeight": {"a": vs_height_a, "b": vs_height_b},
        "vsRank": {"a": vs_rank_a, "b": vs_rank_b},
        "vsCountry": {"a": vs_country_a, "b": vs_country_b},
        "vsAge": {"a": vs_age_a, "b": vs_age_b},
        "vsHand": {"a": vs_hand_a, "b": vs_hand_b},
    }
