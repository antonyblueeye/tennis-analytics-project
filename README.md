# Tennis Analytics

Web application for exploring ATP tennis data: player profiles, rankings, head-to-head matchups, and research hypotheses backed by PostgreSQL queries.

**Repository:** [github.com/antonyblueeye/tennis-analytics-project](https://github.com/antonyblueeye/tennis-analytics-project)

## Features

- **Dashboard** — highlights and overview metrics
- **Players** — search, profile cards, ranking history, tournament results, career stats
- **Rankings** — ATP ranking snapshots
- **Matches** — match browsing and filters
- **Head-to-head** — career H2H with surface splits, serve stats, and context
- **Hypotheses Lab** — exploratory analytics:
  - Early Top-100 entry vs career trajectory
  - Peak career age & milestone timing
  - First-serve % vs match win rate (saturation threshold)

## Tech stack

| Layer | Stack |
|-------|--------|
| Backend | Python, FastAPI, PostgreSQL, psycopg2 |
| Frontend | Next.js (App Router), React, TypeScript, Recharts |
| Data | [Jeff Sackmann ATP CSV dataset](https://github.com/JeffSackmann/tennis_atp) |

## Project structure

```text
tennis_analytics/
├── backend/          # FastAPI REST API
├── frontend/         # Next.js UI
├── scripts/          # Data import & ETL scripts
├── data/             # Raw ATP CSV files
├── PROJECT_GUIDE.md  # Detailed setup guide
└── ANALYTICS_WORKBOOK_RU.md
```

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL

## Quick start

### 1. Database

```sql
CREATE DATABASE tennis_db;
```

Create `backend/.env`:

```ini
DB_NAME=tennis_db
DB_USER=postgres
DB_PASSWORD=your_password
DB_HOST=127.0.0.1
DB_PORT=5432
```

### 2. Backend

```bash
cd backend
python -m venv venv
# Windows: .\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python main.py
```

API: [http://127.0.0.1:8000](http://127.0.0.1:8000) · Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### 3. Import data

From the project root (after PostgreSQL is running):

```bash
python scripts/import_tennis_data.py
python scripts/import_atp_matches_data.py
python scripts/import_atp_rankings_data.py
python scripts/create_atp_players_matches_data.py
```

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

## API endpoints (examples)

| Endpoint | Description |
|----------|-------------|
| `GET /api/players` | Player search |
| `GET /api/players/{id}/overview` | Player profile overview |
| `GET /api/h2h?player_a=&player_b=` | Head-to-head stats |
| `GET /api/hypotheses/early-success` | Hypothesis 1 data |
| `GET /api/hypotheses/peak-age` | Hypothesis 2 data |
| `GET /api/hypotheses/serve-saturation` | Hypothesis 3 data |

## Documentation

- [PROJECT_GUIDE.md](./PROJECT_GUIDE.md) — full setup and architecture notes
- [ANALYTICS_WORKBOOK_RU.md](./ANALYTICS_WORKBOOK_RU.md) — analytics workbook (RU)

## License

Data courtesy of the [Jeff Sackmann tennis_atp repository](https://github.com/JeffSackmann/tennis_atp). Application code © 2026 Tennis Analytics.
