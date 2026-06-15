# backend/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import players, matches, dashboard

app = FastAPI(
    title="Tennis Analytics API",
    description="REST API для поиска и анализа теннисных данных",
    version="1.0.0",
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


@app.get("/health", tags=["system"])
def health_check():
    """Проверка работоспособности сервера."""
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
