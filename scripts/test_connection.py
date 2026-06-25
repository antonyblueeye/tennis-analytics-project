"""Quick check: scripts can reach the DB from backend/.env."""
from db_config import connect

if __name__ == "__main__":
    conn = connect()
    with conn.cursor() as cur:
        cur.execute("SELECT version()")
        row = cur.fetchone()
    conn.close()
    print("OK — connected to PostgreSQL")
    print(row[0] if row else "")
