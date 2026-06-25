# backend/database.py
import os
from contextlib import contextmanager

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool

load_dotenv()

_pool: ThreadedConnectionPool | None = None


def _dsn_with_ssl(dsn: str) -> str:
    sslmode = os.getenv("DB_SSLMODE", "require")
    if not sslmode or "sslmode=" in dsn:
        return dsn
    sep = "&" if "?" in dsn else "?"
    return f"{dsn}{sep}sslmode={sslmode}"


def _build_dsn() -> str:
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return _dsn_with_ssl(database_url)

    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "5432")
    name = os.getenv("DB_NAME", "tennis_db")
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "")
    return (
        f"postgresql://{user}:{password}@{host}:{port}/{name}"
        f"?sslmode={os.getenv('DB_SSLMODE', 'prefer')}"
    )


def init_db_pool(minconn: int = 1, maxconn: int = 10) -> None:
    global _pool
    if _pool is not None:
        return
    _pool = ThreadedConnectionPool(
        minconn,
        maxconn,
        _build_dsn(),
        cursor_factory=RealDictCursor,
    )


def close_db_pool() -> None:
    global _pool
    if _pool is not None:
        _pool.closeall()
        _pool = None


@contextmanager
def get_connection():
    """Returns a pooled PostgreSQL connection."""
    global _pool
    if _pool is None:
        init_db_pool()
    assert _pool is not None
    conn = _pool.getconn()
    try:
        yield conn
    finally:
        _pool.putconn(conn)
