"""Shared DB connection for import scripts (reads backend/.env)."""
from __future__ import annotations

import os
import sys

import psycopg2
from dotenv import load_dotenv

_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(_root, "backend", ".env"))


def _dsn_with_ssl(dsn: str) -> str:
    sslmode = os.getenv("DB_SSLMODE", "require")
    if not sslmode or "sslmode=" in dsn:
        return dsn
    sep = "&" if "?" in dsn else "?"
    return f"{dsn}{sep}sslmode={sslmode}"


def connect():
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        try:
            return psycopg2.connect(_dsn_with_ssl(database_url))
        except psycopg2.Error as exc:
            print(f"Database connection failed: {exc}")
            sys.exit(1)

    try:
        return psycopg2.connect(
            database=os.getenv("DB_NAME", "tennis_db"),
            user=os.getenv("DB_USER", "postgres"),
            password=os.getenv("DB_PASSWORD", ""),
            host=os.getenv("DB_HOST", "127.0.0.1"),
            port=os.getenv("DB_PORT", "5432"),
        )
    except psycopg2.Error as exc:
        print(f"Database connection failed: {exc}")
        sys.exit(1)
