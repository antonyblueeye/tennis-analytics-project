# backend/main.py
import os
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routers import players, matches, dashboard, h2h, hypotheses
from database import get_connection, init_db_pool, close_db_pool
from db_indexes import ensure_indexes
from tournament_data_cache import load_tournament_caches
from ranking_utils import refresh_latest_snapshot_date


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init_db_pool()
        with get_connection() as conn:
            ensure_indexes(conn)
        load_tournament_caches()
        with get_connection() as conn:
            with conn.cursor() as cur:
                refresh_latest_snapshot_date(cur)
        hypotheses._load_early_success()
        hypotheses._load_peak_age()
        hypotheses._load_serve_saturation()
    except Exception:
        pass
    yield
    close_db_pool()


app = FastAPI(
    title="Tennis Analytics API",
    description="REST API для поиска и анализа теннисных данных",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — local dev + production frontend (Vercel)
_default_origins = "http://localhost:3000,http://localhost:3001"
_cors_origins = [
    origin.strip()
    for origin in os.getenv("ALLOWED_ORIGINS", _default_origins).split(",")
    if origin.strip()
]
# Vercel preview/production subdomains (*.vercel.app)
_allow_vercel = os.getenv("ALLOW_VERCEL_PREVIEWS", "true").lower() in ("1", "true", "yes")
_cors_regex = r"https://.*\.vercel\.app" if _allow_vercel else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=_cors_origins,
    allow_origin_regex=_cors_regex,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Подключаем роутеры
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(dashboard.router)
app.include_router(h2h.router)
app.include_router(hypotheses.router)


@app.get("/health", tags=["system"])
def health_check():
    """Проверка работоспособности сервера."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=os.getenv("RAILWAY_ENVIRONMENT") is None)
