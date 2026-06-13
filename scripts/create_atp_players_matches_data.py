import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

DB_NAME = "tennis_db"
DB_USER = "postgres"
DB_PASSWORD = "8876700"
DB_HOST = "127.0.0.1"
DB_PORT = "5432"

SOURCE_TABLE = "atp_matches"
TARGET_TABLE = "atp_player_matches"
INSERT_BATCH = 5000


def save_dataframe(cursor, connection, df: pd.DataFrame, table_name: str) -> None:
    """DROP + CREATE + batch INSERT — как в import_atp_matches_data.py."""
    df = df.where(pd.notnull(df), None)

    cursor.execute(f"DROP TABLE IF EXISTS {table_name} CASCADE")
    connection.commit()
    print(f"Dropped old table {table_name} (if existed)")

    columns = list(df.columns)
    columns_ddl = ",\n".join(f'    "{col}" TEXT' for col in columns)

    cursor.execute(f"""
        CREATE TABLE {table_name} (
            row_id SERIAL PRIMARY KEY,
            {columns_ddl}
        )
    """)
    connection.commit()
    print(f"Created table {table_name}")

    insert_sql = f"""
        INSERT INTO {table_name} ({", ".join(f'"{c}"' for c in columns)})
        VALUES %s
    """

    rows = df.to_numpy().tolist()
    total = len(rows)

    for start in range(0, total, INSERT_BATCH):
        batch = rows[start : start + INSERT_BATCH]
        execute_values(cursor, insert_sql, batch, page_size=1000)
        connection.commit()
        print(f"  inserted {min(start + INSERT_BATCH, total):,} / {total:,}")

    print(f"Saved {total:,} rows to {table_name}")


connection = None

try:
    connection = psycopg2.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT,
    )
    cursor = connection.cursor()

    print("Loading matches...")
    df = pd.read_sql(f"SELECT * FROM {SOURCE_TABLE}", connection)
    print(f"Loaded {len(df):,} matches")

    base_columns = [
        c for c in df.columns
        if not (
            c.startswith("winner_")
            or c.startswith("loser_")
            or c.startswith("w_")
            or c.startswith("l_")
        )
    ]

    winner_cols = [c for c in df.columns if c.startswith("winner_")]
    loser_cols = [c for c in df.columns if c.startswith("loser_")]
    w_cols = [c for c in df.columns if c.startswith("w_")]
    l_cols = [c for c in df.columns if c.startswith("l_")]

    winner_df = df[base_columns].copy()
    for col in winner_cols:
        winner_df[col.replace("winner_", "player_")] = df[col]
    for col in loser_cols:
        winner_df[col.replace("loser_", "opponent_")] = df[col]
    for col in w_cols:
        winner_df[col.replace("w_", "player_")] = df[col]
    for col in l_cols:
        winner_df[col.replace("l_", "opponent_")] = df[col]
    winner_df["result"] = "won"

    loser_df = df[base_columns].copy()
    for col in loser_cols:
        loser_df[col.replace("loser_", "player_")] = df[col]
    for col in winner_cols:
        loser_df[col.replace("winner_", "opponent_")] = df[col]
    for col in l_cols:
        loser_df[col.replace("l_", "player_")] = df[col]
    for col in w_cols:
        loser_df[col.replace("w_", "opponent_")] = df[col]
    loser_df["result"] = "lost"

    player_matches = pd.concat([winner_df, loser_df], ignore_index=True)
    print(f"Created {len(player_matches):,} player-match records")

    player_matches["won_match"] = (player_matches["result"] == "won").astype(int)
    player_matches["match_date"] = pd.to_datetime(
        player_matches["tourney_date"],
        format="%Y%m%d",
        errors="coerce",
    ).dt.strftime("%Y-%m-%d")

    print(f"Saving to {TARGET_TABLE}...")
    save_dataframe(cursor, connection, player_matches, TARGET_TABLE)

except Exception as e:
    print(f"Error: {e}")
    if connection:
        connection.rollback()
    raise

finally:
    if connection:
        cursor.close()
        connection.close()
        print("Connection closed")
