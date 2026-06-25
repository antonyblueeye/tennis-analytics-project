# backend/player_utils.py
"""Player profile helpers (DOB, age)."""
from __future__ import annotations

from datetime import date


def parse_dob(dob: str | None) -> date | None:
    if not dob:
        return None
    digits = str(dob).strip().split(".")[0]
    if len(digits) < 8 or not digits[:8].isdigit():
        return None
    y, m, d = int(digits[:4]), int(digits[4:6]), int(digits[6:8])
    try:
        return date(y, m, d)
    except ValueError:
        return None


def calc_age_from_dob(dob: str | None, on_date: date | None = None) -> float | None:
    birth = parse_dob(dob)
    if not birth:
        return None
    ref = on_date or date.today()
    days = (ref - birth).days
    if days < 0:
        return None
    return round(days / 365.25, 1)
