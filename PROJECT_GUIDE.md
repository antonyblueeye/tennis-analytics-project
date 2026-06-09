# Tennis Analytics Project Guide

This guide provides an overview of the Tennis Analytics application, its project structure, and instructions on how to set up and run both the backend and frontend components.

---

## 📂 Project Structure

```text
tennis_analytics/
├── backend/            # FastAPI backend application
│   ├── routers/        # API route handlers (e.g., players.py)
│   ├── database.py     # PostgreSQL database connection setup
│   ├── main.py         # Entry point for the FastAPI server
│   ├── requirements.txt# Python dependencies
│   └── .env            # Environment variables (DB credentials)
├── frontend/           # Next.js web application
│   ├── app/            # Next.js App Router (pages, layout, globals.css)
│   ├── public/         # Static assets
│   ├── package.json    # Frontend dependencies and scripts
│   └── tsconfig.json   # TypeScript configuration
├── data/               # Raw datasets
│   └── tennis_atp-master/ # ATP tennis CSV datasets (players, matches, etc.)
└── scripts/            # Helper scripts for data import and processing
    ├── import_tennis_data.py # Script to load ATP players CSV into PostgreSQL
    └── tennis_api.py   # Script for querying external tennis data/APIs
```

---

## 🛠️ Technology Stack

*   **Backend:** Python 3.10+, [FastAPI](https://fastapi.tiangolo.com/), PostgreSQL, `psycopg2` (DB client), `python-dotenv`.
*   **Frontend:** [Next.js 15+](https://nextjs.org/) (App Router), React, TypeScript, Vanilla CSS.
*   **Data Processing:** Pandas (Python).

---

## 🚀 Setup and Installation

### 1. Prerequisites
*   [Python 3.10+](https://www.python.org/downloads/) installed.
*   [Node.js v18+](https://nodejs.org/) installed.
*   [PostgreSQL](https://www.postgresql.org/) database server installed and running.

---

### 2. Database Setup
1. Open your PostgreSQL console or client (e.g., pgAdmin, DBeaver, or `psql`).
2. Create a new database named `tennis_db`:
   ```sql
   CREATE DATABASE tennis_db;
   ```
3. Verify that your PostgreSQL credentials match those in [backend/.env](file:///c:/Users/anton/Documents/data_analytics/tennis_analytics/backend/.env).

---

### 3. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create a Python virtual environment (optional but recommended):
   ```bash
   python -m venv venv
   # Activate it:
   # On Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install the dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify or configure your environment variables in [backend/.env](file:///c:/Users/anton/Documents/data_analytics/tennis_analytics/backend/.env):
   ```ini
   DB_NAME=tennis_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=127.0.0.1
   DB_PORT=5432
   ```

---

### 4. Importing Seed Data
To populate your database with player data from the ATP dataset:
1. Make sure you have `pandas` installed (often installed via script requirements).
2. Run the import script from the project root directory:
   ```bash
   python scripts/import_tennis_data.py
   ```
This will read data from `data/tennis_atp-master/atp_players.csv` and import it into the `atp_players` table in your database.

---

### 5. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd ../frontend
   ```
2. Install Node.js dependencies:
   ```bash
   npm install
   ```

---

## 🏃 How to Run the Application

To run the full application locally, you will need to start both the backend server and the frontend server.

### Start the Backend Server
1. Go to the `backend` directory (ensure virtual environment is active):
   ```bash
   cd backend
   ```
2. Run the FastAPI development server:
   ```bash
   python main.py
   ```
   *Alternative:* Run uvicorn directly:
   ```bash
   uvicorn main:app --reload --port 8000
   ```
3. The backend API will be available at [http://127.0.0.1:8000](http://127.0.0.1:8000).
4. Interactive Swagger documentation can be viewed at [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs).

### Start the Frontend Server
1. Go to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Run the development server:
   ```bash
   npm run dev
   ```
3. The frontend application will be running at [http://localhost:3000](http://localhost:3000).

---

## 📝 Next Steps and Future Extensions
*   Add match statistics tables and import processes.
*   Implement advanced analytics query pages in the frontend.
*   Introduce user authentication and personalized dashboards.
