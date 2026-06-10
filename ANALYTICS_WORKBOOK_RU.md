# Воркбук: как добавлять аналитику из PostgreSQL на фронт

Практическая шпаргалка для проекта **Tennis Analytics**.  
Держи этот файл открытым, когда добавляешь новые метрики, отчёты или страницы.

---

## 1. Как устроен поток данных

```
PostgreSQL  →  backend/routers/*.py (SQL)  →  FastAPI (JSON)  →  frontend/app/**/page.tsx (fetch)  →  экран
```

| Шаг | Где | Что делаешь |
|-----|-----|-------------|
| 1 | PostgreSQL | Пишешь и тестируешь SQL-запрос |
| 2 | `backend/routers/` | Оборачиваешь SQL в API-эндпоинт |
| 3 | `backend/main.py` | Подключаешь новый роутер (если создал новый файл) |
| 4 | `frontend/app/.../page.tsx` | Вызываешь API через `fetch` и показываешь данные |
| 5 | `frontend/app/globals.css` | При необходимости — только стили (новые компоненты не обязательны) |

**Важно:** фронт **никогда** не ходит в БД напрямую. Только через backend на `http://127.0.0.1:8000`.

---

## 2. Где лежат ключевые файлы

```
tennis_analytics/
├── backend/
│   ├── main.py              ← точка входа API, подключение роутеров
│   ├── database.py          ← подключение к PostgreSQL (не трогать без нужды)
│   ├── .env                 ← логин/пароль к БД
│   └── routers/
│       ├── players.py       ← SQL + API для игроков (образец!)
│       └── ...              ← сюда добавляешь новые роутеры
│
├── frontend/
│   └── app/
│       ├── page.tsx                    ← Dashboard (KPI-карточки)
│       ├── players/page.tsx            ← поиск игроков (образец списка)
│       ├── matches/page.tsx            ← страница матчей (пока заглушка)
│       ├── rankings/page.tsx           ← рейтинги (пока заглушка)
│       ├── components/Sidebar.tsx      ← пункты меню слева
│       ├── globals.css                 ← все стили (классы stat-card, hero и т.д.)
│       └── lib/                        ← вспомогательные функции (не API)
│
├── data/tennis_atp-master/    ← CSV-данные
└── scripts/                   ← импорт данных в БД
```

---

## 3. Шаг 1 — SQL: где писать и как тестировать

### Где писать SQL в проекте

SQL пишется **только в backend**, внутри файлов `backend/routers/*.py`.

Пример из `backend/routers/players.py`:

```python
sql = "SELECT COUNT(*) as count FROM atp_players"
```

```python
sql = """
    SELECT player_id, name_first, name_last, hand, height, ioc
    FROM atp_players
    WHERE name_first ILIKE %s OR name_last ILIKE %s
    ORDER BY name_last, name_first
    LIMIT 50
"""
```

### Где тестировать SQL до кода

1. **pgAdmin / DBeaver / psql** — подключись к базе `tennis_db` (параметры из `backend/.env`).
2. Прогони запрос руками, убедись что результат правильный.
3. Только потом переноси в Python.

### Правила безопасности

- **Всегда** используй параметры `%s`, не вставляй пользовательский ввод в строку SQL:

```python
# ✅ правильно
cur.execute("SELECT * FROM atp_players WHERE ioc = %s", (country_code,))

# ❌ опасно (SQL-injection)
cur.execute(f"SELECT * FROM atp_players WHERE ioc = '{country_code}'")
```

- Для поиска по тексту — `ILIKE` + `%`:
  ```python
  like = f"%{q}%"
  cur.execute("... WHERE name_last ILIKE %s", (like,))
  ```

### Текущая таблица в БД

Сейчас импортирована таблица **`atp_players`**.  
Когда добавишь матчи/рейтинги — появятся новые таблицы, SQL будет писаться по тому же принципу.

---

## 4. Шаг 2 — Backend: создаём API-эндпоинт

### Шаблон: один SQL-запрос → JSON

Скопируй этот шаблон в `backend/routers/players.py` или создай новый файл `backend/routers/analytics.py`:

```python
from fastapi import APIRouter, HTTPException
from database import get_connection

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/by-hand")
def players_by_hand():
    """Сколько левшей и правшей в базе."""
    sql = """
        SELECT hand, COUNT(*) AS count
        FROM atp_players
        WHERE hand IS NOT NULL
        GROUP BY hand
        ORDER BY count DESC
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql)
                rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")

    return {"results": [dict(r) for r in rows]}
```

### Подключение нового роутера

Если создал **новый файл** (например `analytics.py`), добавь в `backend/main.py`:

```python
from routers import players, analytics   # ← добавить import

app.include_router(players.router)
app.include_router(analytics.router)       # ← добавить строку
```

Если добавляешь эндпоинт в **существующий** `players.py` — `main.py` менять не нужно.

### Проверка API

1. Запусти backend:
   ```bash
   cd backend
   python main.py
   ```
2. Открой Swagger: **http://127.0.0.1:8000/docs**
3. Найди свой эндпоинт → Try it out → Execute.
4. Или в браузере/curl:
   ```
   http://127.0.0.1:8000/api/analytics/by-hand
   ```

Ответ должен быть JSON, например:
```json
{
  "results": [
    {"hand": "R", "count": 42000},
    {"hand": "L", "count": 3500}
  ]
}
```

---

## 5. Шаг 3 — Frontend: забираем данные и показываем

### Куда писать код страницы

| Что показываешь | Файл |
|-----------------|------|
| KPI на главной | `frontend/app/page.tsx` |
| Поиск / список игроков | `frontend/app/players/page.tsx` |
| Матчи | `frontend/app/matches/page.tsx` |
| Рейтинги | `frontend/app/rankings/page.tsx` |
| Новая отдельная страница | `frontend/app/имя-страницы/page.tsx` |

### Обязательно `'use client'`

Если на странице есть `useState`, `useEffect`, `fetch` — первая строка файла:

```tsx
'use client';
```

### Шаблон: одно число (KPI-карточка)

Пример уже есть на Dashboard — `frontend/app/page.tsx`:

```tsx
const [totalPlayers, setTotalPlayers] = useState<number | null>(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  async function fetchStats() {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/players/count');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      setTotalPlayers(data.count);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  fetchStats();
}, []);
```

Разметка KPI (готовые CSS-классы):

```tsx
<div className="stat-card">
  <div className="stat-card-inner">
    <div className="stat-label">Название метрики</div>
    {loading ? (
      <div className="spinner" />
    ) : (
      <div className="stat-value accent">{totalPlayers?.toLocaleString()}</div>
    )}
  </div>
</div>
```

Несколько карточек в ряд — оберни в `<div className="stats-grid">`.

### Шаблон: список / таблица

Пример — `frontend/app/players/page.tsx`:

```tsx
const [items, setItems] = useState<MyType[]>([]);

const res = await fetch('http://127.0.0.1:8000/api/analytics/by-hand');
const data = await res.json();
setItems(data.results);
```

Отображение списком:

```tsx
<ul className="player-list">
  {items.map((row) => (
    <li key={row.hand} className="player-item">
      <div className="player-info">
        <div className="player-name">{row.hand === 'L' ? 'Левши' : 'Правши'}</div>
        <div className="player-meta">{row.count.toLocaleString()} игроков</div>
      </div>
    </li>
  ))}
</ul>
```

Если нужна **таблица** — можно использовать `<table>` внутри блока `.results-section` или добавить стили в `globals.css` (см. раздел 7).

### TypeScript: тип ответа API

Опиши интерфейс рядом с компонентом:

```tsx
interface HandStat {
  hand: string;
  count: number;
}
```

И используй: `useState<HandStat[]>([])`.

### Поиск с параметром в URL

```tsx
const res = await fetch(
  `http://127.0.0.1:8000/api/players/search?q=${encodeURIComponent(query)}`
);
```

---

## 6. Полный пример: «Топ-10 стран по числу игроков»

### 6.1 SQL (тест в pgAdmin)

```sql
SELECT ioc, COUNT(*) AS player_count
FROM atp_players
WHERE ioc IS NOT NULL
GROUP BY ioc
ORDER BY player_count DESC
LIMIT 10;
```

### 6.2 Backend — `backend/routers/players.py`

```python
@router.get("/top-countries")
def top_countries(limit: int = 10):
    sql = """
        SELECT ioc, COUNT(*) AS player_count
        FROM atp_players
        WHERE ioc IS NOT NULL
        GROUP BY ioc
        ORDER BY player_count DESC
        LIMIT %s
    """
    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(sql, (limit,))
                rows = cur.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка базы данных: {e}")

    return {"results": [dict(r) for r in rows]}
```

URL: `GET /api/players/top-countries?limit=10`

### 6.3 Frontend — например, на Dashboard `frontend/app/page.tsx`

```tsx
interface CountryStat {
  ioc: string;
  player_count: number;
}

const [topCountries, setTopCountries] = useState<CountryStat[]>([]);

useEffect(() => {
  fetch('http://127.0.0.1:8000/api/players/top-countries')
    .then((r) => r.json())
    .then((d) => setTopCountries(d.results));
}, []);
```

```tsx
<section className="results-section" style={{ marginTop: 24 }}>
  <div className="results-header">
    <span className="results-title">Топ стран по игрокам</span>
  </div>
  <ul className="player-list">
    {topCountries.map((c) => (
      <li key={c.ioc} className="player-item">
        <div className="player-info">
          <div className="player-name">{c.ioc}</div>
          <div className="player-meta">{c.player_count.toLocaleString()} игроков</div>
        </div>
      </li>
    ))}
  </ul>
</section>
```

---

## 7. Готовые CSS-классы (не плоди новые компоненты)

Стили в `frontend/app/globals.css`. Используй существующие:

| Класс | Для чего |
|-------|----------|
| `.page-content` | Обёртка страницы |
| `.hero`, `.hero-title`, `.hero-subtitle`, `.hero-tag` | Заголовок страницы |
| `.stats-grid` | Сетка KPI-карточек |
| `.stat-card`, `.stat-value`, `.stat-label` | Одна метрика |
| `.stat-value.accent` | Зелёное число |
| `.stat-value.muted` | Серое число / прочерк |
| `.search-wrap`, `.search-input`, `.search-btn` | Строка поиска |
| `.results-section` | Белый блок с данными |
| `.player-list`, `.player-item` | Список строк |
| `.empty-state` | «Данных пока нет» |
| `.spinner` | Загрузка |
| `.loading-wrap` | Блок загрузки по центру |

Новую аналитику лучше **вписывать в эти блоки**, а не создавать отдельные React-компрненты — так быстрее и единообразнее.

---

## 8. Новая страница в меню (если нужна отдельная вкладка)

1. Создай папку и файл: `frontend/app/my-analytics/page.tsx`
2. Добавь пункт в `frontend/app/components/Sidebar.tsx`:

```tsx
{ icon: '📉', label: 'My Analytics', href: '/my-analytics' },
```

3. На странице — `'use client'`, `fetch` к своему API, разметка через классы из раздела 7.

---

## 9. Чеклист: добавляю новую аналитику

```
[ ] 1. SQL написал и проверил в pgAdmin/DBeaver
[ ] 2. Добавил @router.get(...) в backend/routers/
[ ] 3. Если новый файл роутера — подключил в backend/main.py
[ ] 4. Проверил в http://127.0.0.1:8000/docs
[ ] 5. Backend запущен (python main.py)
[ ] 6. Frontend запущен (npm run dev в папке frontend)
[ ] 7. На нужной page.tsx — fetch + useState + отображение
[ ] 8. Использовал готовые CSS-классы из globals.css
[ ] 9. Обработал loading / error / пустой результат
[ ] 10. Обновил страницу в браузере (Ctrl+Shift+R)
```

---

## 10. Типичные ошибки

| Симптом | Причина | Решение |
|---------|---------|---------|
| `Failed to fetch` | Backend не запущен | `cd backend && python main.py` |
| CORS error | Фронт не на localhost:3000 | Порт уже в `main.py`, или добавь свой |
| 500 от API | Ошибка SQL | Смотри текст в Swagger / терминал backend |
| Пустой экран | Нет `'use client'` | Добавь в начало page.tsx |
| Старые стили | Кэш браузера | Ctrl+Shift+R |
| `column does not exist` | Неверное имя поля | Проверь `\d atp_players` в psql |

---

## 11. Что будет дальше (матчи, рейтинги)

Когда импортируешь новые CSV:

1. Создай таблицу (скрипт в `scripts/` по образцу `import_tennis_data.py`)
2. Создай `backend/routers/matches.py` или `rankings.py`
3. Подключи в `main.py`
4. Заполни страницы `matches/page.tsx` и `rankings/page.tsx` по шаблонам выше

Структура **всегда одна и та же**: SQL → router → fetch → CSS-классы.

---

## 12. Быстрые ссылки

| Ресурс | URL |
|--------|-----|
| Frontend | http://localhost:3000 |
| API | http://127.0.0.1:8000 |
| Swagger (тест API) | http://127.0.0.1:8000/docs |
| Health check | http://127.0.0.1:8000/health |

---

*Файл создан как рабочая шпаргалка. Дополняй его своими примерами SQL и эндпоинтов по мере роста проекта.*
