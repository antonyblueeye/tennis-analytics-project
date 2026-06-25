# backend/main.py
from fastapi import FastAPI
from contextlib import asynccontextmanager
from fastapi.middleware.cors import CORSMiddleware
from routers import players, matches, dashboard, h2h, hypotheses
from database import get_connection
from db_indexes import ensure_rankings_indexes


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        with get_connection() as conn:
            ensure_rankings_indexes(conn)
        hypotheses._load_early_success()
        hypotheses._load_peak_age()
        hypotheses._load_serve_saturation()
    except Exception:
        pass
    yield


app = FastAPI(
    title="Tennis Analytics API",
    description="REST API для поиска и анализа теннисных данных",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — разрешаем запросы от фронтенда
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
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
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
