# backend/db_indexes.py
"""Ensure analytical indexes exist (idempotent, safe to call on startup)."""

RANKINGS_INDEXES = [
    "CREATE INDEX IF NOT EXISTS idx_atp_rankings_player ON atp_rankings (player)",
    "CREATE INDEX IF NOT EXISTS idx_atp_rankings_player_date ON atp_rankings (player, ranking_date)",
    "CREATE INDEX IF NOT EXISTS idx_atp_rankings_date ON atp_rankings (ranking_date)",
]

_indexes_ready = False


def ensure_rankings_indexes(conn) -> None:
    global _indexes_ready
    if _indexes_ready:
        return
    with conn.cursor() as cur:
        cur.execute(
            "SELECT indexname FROM pg_indexes WHERE tablename = 'atp_rankings'"
        )
        existing = {r["indexname"] for r in cur.fetchall()}
        for ddl in RANKINGS_INDEXES:
            name = ddl.split("IF NOT EXISTS ")[1].split(" ON ")[0]
            if name in existing:
                continue
            cur.execute(ddl)
    conn.commit()
    _indexes_ready = True
