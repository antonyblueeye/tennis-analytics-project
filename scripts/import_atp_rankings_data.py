import pandas as pd
from psycopg2.extras import execute_values
import os
import glob
import sys

from db_config import connect

TABLE_NAME = "atp_rankings"


script_dir = os.path.dirname(os.path.abspath(__file__))

data_dir = os.path.normpath(
    os.path.join(script_dir, "..", "data", "tennis_atp-master")
)

print(f"Ищу CSV файлы в: {data_dir}")

csv_files = sorted(
    glob.glob(os.path.join(data_dir, "atp_rankings_*.csv"))
)

if not csv_files:
    print("Ошибка: файлы atp_rankings_*.csv не найдены")
    sys.exit(1)

print(f"Найдено файлов: {len(csv_files)}")

connection = None


def clean(v):
    """Жёсткая очистка всех pandas/numpy типов"""
    if pd.isna(v):
        return None
    if hasattr(v, "item"):
        return v.item()
    return v


try:
    connection = connect()

    cursor = connection.cursor()

    print("Подключение к БД успешно")

    cursor.execute(f"DROP TABLE IF EXISTS {TABLE_NAME} CASCADE")
    connection.commit()
    print(f"Таблица {TABLE_NAME} удалена (если существовала)")

    table_created = False
    total_rows = 0

    for file_path in csv_files:

        print("\n" + "=" * 60)
        print(f"Загружается: {os.path.basename(file_path)}")

        df = pd.read_csv(file_path)

        print(f"Строк: {len(df)}, столбцов: {len(df.columns)}")

        # --- создаём таблицу один раз ---
        if not table_created:

            columns_with_types = ",\n".join(
                [f'"{col}" TEXT' for col in df.columns]
            )

            create_query = f"""
            CREATE TABLE {TABLE_NAME} (
                id SERIAL PRIMARY KEY,
                {columns_with_types}
            );
            """

            cursor.execute(create_query)
            connection.commit()

            print(f"Таблица {TABLE_NAME} создана")

            table_created = True

        # --- INSERT ---
        insert_query = f"""
        INSERT INTO {TABLE_NAME}
        ({', '.join([f'"{col}"' for col in df.columns])})
        VALUES %s
        """

        # --- ВАЖНО: чистим ВСЕ типы ---
        values = [
            tuple(clean(x) for x in row)
            for row in df.to_numpy()
        ]

        execute_values(
            cursor,
            insert_query,
            values,
            page_size=5000
        )

        connection.commit()

        total_rows += len(df)

        print(f"Добавлено строк: {len(df)}")

    print("\n" + "=" * 60)
    print("Импорт завершен успешно")
    print(f"Всего загружено строк: {total_rows}")

except Exception as e:
    print(f"\nОшибка при выполнении: {e}")

finally:
    if connection:
        cursor.close()
        connection.close()
        print("Соединение закрыто")