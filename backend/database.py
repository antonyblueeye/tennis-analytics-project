# backend/database.py
import os

import psycopg2
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor

load_dotenv()


def _dsn_with_ssl(dsn: str) -> str:
    sslmode = os.getenv("DB_SSLMODE", "require")
    if not sslmode or "sslmode=" in dsn:
        return dsn
    sep = "&" if "?" in dsn else "?"
    return f"{dsn}{sep}sslmode={sslmode}"


def get_connection():
    """Returns a PostgreSQL connection."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        return psycopg2.connect(
            _dsn_with_ssl(database_url),
            cursor_factory=RealDictCursor,
        )

    return psycopg2.connect(
        database=os.getenv("DB_NAME", "tennis_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "127.0.0.1"),
        port=os.getenv("DB_PORT", "5432"),
        cursor_factory=RealDictCursor,
    )
