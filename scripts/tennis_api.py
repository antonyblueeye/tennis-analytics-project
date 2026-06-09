# tennis_api.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
import os

app = FastAPI(title="Tennis Players API")

# Разрешаем запросы с localhost:3000 (твой Next.js)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Параметры подключения к БД (подставь свои)
DB_CONFIG = {
    "database": "tennis_db",
    "user": "postgres",
    "password": "8876700",
    "host": "127.0.0.1",
    "port": "5432"
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

@app.get("/api/players/search")
def search_players(q: str = Query(..., min_length=1)):
    """Ищет игроков по имени или фамилии (частичное совпадение)"""
    conn = get_db_connection()
    cur = conn.cursor()
    # Поиск по name_first или name_last (без учёта регистра)
    query = """
        SELECT player_id, name_first, name_last, hand, height, ioc
        FROM atp_players
        WHERE name_first ILIKE %s OR name_last ILIKE %s
        ORDER BY name_last, name_first
        LIMIT 50
    """
    like_pattern = f"%{q}%"
    cur.execute(query, (like_pattern, like_pattern))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    
    results = []
    for row in rows:
        results.append({
            "player_id": row[0],
            "name_first": row[1],
            "name_last": row[2],
            "hand": row[3],
            "height": row[4],
            "ioc": row[5]
        })
    return {"results": results}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)