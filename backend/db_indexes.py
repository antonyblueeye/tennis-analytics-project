# backend/db_indexes.py
"""Ensure analytical indexes exist (idempotent, safe to call on startup)."""

INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_atp_rankings_player ON atp_rankings (player)",
    "CREATE INDEX IF NOT EXISTS idx_atp_rankings_player_date ON atp_rankings (player, ranking_date)",
    "CREATE INDEX IF NOT EXISTS idx_atp_rankings_date ON atp_rankings (ranking_date)",
    "CREATE INDEX IF NOT EXISTS idx_apm_player_id ON atp_player_matches (player_id)",
    "CREATE INDEX IF NOT EXISTS idx_apm_player_level ON atp_player_matches (player_id, tourney_level)",
    "CREATE INDEX IF NOT EXISTS idx_apm_tourney_level ON atp_player_matches (tourney_level)",
]

_indexes_ready = False


def ensure_indexes(conn) -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    with conn.cursor() as cur:
        cur.execute(
            "SELECT tablename, indexname FROM pg_indexes "
            "WHERE tablename IN ('atp_rankings', 'atp_player_matches')"
        )
        existing = {(r["tablename"], r["indexname"]) for r in cur.fetchall()}
        for ddl in INDEXES:
            name = ddl.split("IF NOT EXISTS ")[1].split(" ON ")[0]
            table = ddl.split(" ON ")[1].split(" ")[0]
            if (table, name) in existing:
                continue
            cur.execute(ddl)
    conn.commit()
    _indexes_ready = True


def ensure_rankings_indexes(conn) -> None:
    """Backward-compatible alias."""
    ensure_indexes(conn)
