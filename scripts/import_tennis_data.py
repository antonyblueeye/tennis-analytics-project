# scripts/import_tennis_data.py

import pandas as pd
import os
import sys

from db_config import connect

TABLE_NAME = "atp_players"

# 1. Определяем путь к CSV автоматически
# Считаем, что CSV лежит в ../data/tennis_atp-master/atp_players.csv относительно скрипта
script_dir = os.path.dirname(os.path.abspath(__file__))
csv_path = os.path.join(script_dir, "..", "data", "tennis_atp-master", "atp_players.csv")
csv_path = os.path.normpath(csv_path)  # приводит к нормальному виду для Windows

print(f"Ищу файл по пути: {csv_path}")

if not os.path.exists(csv_path):
    print(f"Ошибка: Файл не найден! Проверь путь: {csv_path}")
    sys.exit(1)

# 2. Инициализируем connection как None, чтобы в finally была определена
connection = None

try:
    # 3. Загружаем CSV
    dataframe = pd.read_csv(csv_path)
    dataframe = dataframe.where(pd.notnull(dataframe), None)
    print(f"CSV загружен. Строк: {len(dataframe)}, столбцов: {len(dataframe.columns)}")
    print(f"Первые 2 строки:\n{dataframe.head(2)}")

    # 4. Подключаемся к БД
    connection = connect()
    connection.autocommit = True
    cursor = connection.cursor()
    print("Подключение к БД успешно")

    # Пересоздаём таблицу — повторный запуск не создаёт дубликаты
    cursor.execute(f"DROP TABLE IF EXISTS {TABLE_NAME} CASCADE")
    print(f"Таблица {TABLE_NAME} удалена (если существовала)")

    # 5. Создаём таблицу
    columns = dataframe.columns
    columns_with_types = ", ".join([f'"{col}" VARCHAR' for col in columns])
    create_query = f'''
    CREATE TABLE {TABLE_NAME} (
        id SERIAL PRIMARY KEY,
        {columns_with_types}
    );
    '''
    cursor.execute(create_query)
    print(f"Таблица {TABLE_NAME} готова")

    # 6. Вставляем строки
    for index, row in dataframe.iterrows():
        insert_query = f'''
            INSERT INTO {TABLE_NAME} ({', '.join([f'"{col}"' for col in columns])})
            VALUES ({', '.join(['%s'] * len(columns))})
        '''
        cursor.execute(insert_query, tuple(row))

    print(f"Готово! Вставлено строк: {len(dataframe)}")

except Exception as e:
    print(f"Ошибка при выполнении: {e}")

finally:
    if connection:
        cursor.close()
        connection.close()
        print("Соединение закрыто")