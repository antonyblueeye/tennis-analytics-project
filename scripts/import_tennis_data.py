# scripts/import_tennis_data.py

import os
import sys

import pandas as pd
from psycopg2.extras import execute_values

from db_config import connect

TABLE_NAME = "atp_players"

script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.normpath(
    os.path.join(script_dir, "..", "data", "tennis_atp-master", "atp_players.csv")
)

print(f"CSV path: {csv_path}")

if not os.path.exists(csv_path):
    print(f"Error: file not found: {csv_path}")
    sys.exit(1)

connection = None

try:
    dataframe = pd.read_csv(csv_path, low_memory=False)
    dataframe = dataframe.where(pd.notnull(dataframe), None)
    print(f"Loaded CSV: {len(dataframe)} rows, {len(dataframe.columns)} columns")

    connection = connect()
    cursor = connection.cursor()
    print("Connected to database")

    cursor.execute(f"DROP TABLE IF EXISTS {TABLE_NAME} CASCADE")
    connection.commit()
    print(f"Dropped {TABLE_NAME} (if existed)")

    columns = list(dataframe.columns)
    columns_with_types = ", ".join(f'"{col}" VARCHAR' for col in columns)
    cursor.execute(
        f"""
        CREATE TABLE {TABLE_NAME} (
            id SERIAL PRIMARY KEY,
            {columns_with_types}
        )
        """
    )
    connection.commit()
    print(f"Created table {TABLE_NAME}")

    insert_query = f"""
        INSERT INTO {TABLE_NAME} ({", ".join(f'"{col}"' for col in columns)})
        VALUES %s
    """
    values = [tuple(row) for row in dataframe.to_numpy()]
    execute_values(cursor, insert_query, values, page_size=2000)
    connection.commit()

    print(f"Done: inserted {len(dataframe)} rows")

except Exception as e:
    print(f"Error: {e}")
    if connection:
        connection.rollback()
    sys.exit(1)

finally:
    if connection:
        cursor.close()
        connection.close()
        print("Connection closed")
