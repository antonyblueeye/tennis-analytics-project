import pandas as pd
import psycopg2
from psycopg2.extras import execute_values
import os
import glob
import sys

# --- НАСТРОЙКИ ---
DB_NAME = "tennis_db"
DB_USER = "postgres"
DB_PASSWORD = "8876700"
DB_HOST = "127.0.0.1"
DB_PORT = "5432"

TABLE_NAME = "atp_matches"
# --- КОНЕЦ НАСТРОЕК ---

# Папка с ATP данными
script_dir = os.path.dirname(os.path.abspath(__file__))

data_dir = os.path.join(
    script_dir,
    "..",
    "data",
    "tennis_atp-master"
)

data_dir = os.path.normpath(data_dir)

print(f"Ищу CSV файлы в: {data_dir}")

csv_files = sorted(
    glob.glob(
        os.path.join(data_dir, "atp_matches_*.csv")
    )
)

if not csv_files:
    print("Ошибка: файлы atp_matches_*.csv не найдены")
    sys.exit(1)

print(f"Найдено файлов: {len(csv_files)}")

connection = None

try:

    # Подключение к БД
    connection = psycopg2.connect(
        database=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD,
        host=DB_HOST,
        port=DB_PORT
    )

    cursor = connection.cursor()

    print("Подключение к БД успешно")

    table_created = False
    total_rows = 0

    for file_path in csv_files:

        print("\n" + "=" * 60)
        print(f"Загружается: {os.path.basename(file_path)}")

        df = pd.read_csv(file_path)

        df = df.where(pd.notnull(df), None)

        print(
            f"Строк: {len(df)}, "
            f"столбцов: {len(df.columns)}"
        )

        # Создаем таблицу только один раз
        if not table_created:

            columns = df.columns

            columns_with_types = ",\n".join(
                [f'"{col}" TEXT' for col in columns]
            )

            create_query = f"""
            CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
                id SERIAL PRIMARY KEY,
                {columns_with_types}
            );
            """

            cursor.execute(create_query)
            connection.commit()

            print(f"Таблица {TABLE_NAME} создана")

            table_created = True

        # Формируем INSERT
        insert_query = f"""
        INSERT INTO {TABLE_NAME}
        (
            {', '.join([f'"{col}"' for col in df.columns])}
        )
        VALUES %s
        """

        values = [tuple(row) for row in df.to_numpy()]

        execute_values(
            cursor,
            insert_query,
            values,
            page_size=1000
        )

        connection.commit()

        total_rows += len(df)

        print(
            f"Добавлено строк из файла: {len(df)}"
        )

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