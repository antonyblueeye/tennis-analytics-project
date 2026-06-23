# backend/tourney_utils.py
"""Helpers for normalizing tournament identifiers in SQL queries."""

# Maps each match row to a logical tournament key.
# All Davis Cup ties in a season share one id: YYYY-M-DC-YYYY (e.g. 2026-M-DC-2026).
LOGICAL_TOURNEY_ID_SQL = """
CASE
    WHEN tourney_level = 'D' AND tourney_id ~ '^[0-9]{4}-M-DC-[0-9]{4}' THEN
        (regexp_match(tourney_id, '^([0-9]{4}-M-DC-[0-9]{4})'))[1]
    WHEN tourney_level = 'D' AND tourney_id ~ '^[0-9]{4}-D[0-9]+$' THEN
        regexp_replace(tourney_id, 'D[0-9]+$', 'D')
    ELSE tourney_id
END
"""

_DATE_FILTER_SQL = """
    tourney_date IS NOT NULL
    AND tourney_date ~ '^[0-9]{8}$'
    AND TO_DATE(tourney_date, 'YYYYMMDD') >= %s
    AND TO_DATE(tourney_date, 'YYYYMMDD') <= %s
"""

# Stable ATP venue codes that host ATP 500 events (level A in source data).
ATP_500_CODES = frozenset({
    "0308",  # Munich
    "0407",  # Rotterdam
    "0414",  # Hamburg
    "0424",  # Dallas
    "0425",  # Barcelona
    "0451",  # Doha
    "0495",  # Dubai
    "0807",  # Acapulco
    "0964",  # Beijing
    "1017",  # Vienna
    "6932",  # Rio de Janeiro
    "744",   # Hamburg (legacy)
})

# ATP Finals (Tour Finals) — code 605/0605; 2023 source row is mislabeled as level A.
ATP_FINALS_CODES = frozenset({"605", "0605"})


def tourney_code(tourney_id: str) -> str:
    parts = tourney_id.split("-", 1)
    return parts[1] if len(parts) > 1 else tourney_id


def is_atp_finals(tourney_id: str | None) -> bool:
    if not tourney_id:
        return False
    return tourney_code(tourney_id) in ATP_FINALS_CODES


def map_tourney_level(tourney_level: str, tourney_id: str) -> str:
    if tourney_level == "G":
        return "GS"
    if tourney_level == "M":
        return "M1000"
    if tourney_level == "D":
        return "DC"
    if tourney_level == "F" or is_atp_finals(tourney_id):
        return "Finals"
    code = tourney_code(tourney_id)
    if code in ATP_500_CODES:
        return "500"
    return "250"


def format_tourney_date(tourney_date: str) -> str:
    if not tourney_date or len(tourney_date) != 8:
        return tourney_date
    return f"{tourney_date[:4]}-{tourney_date[4:6]}-{tourney_date[6:8]}"

