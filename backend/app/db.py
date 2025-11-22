import psycopg2
import psycopg2.extras
from config import Config

class Database:
    def __init__(self):
        self.connection = None
        self.cursor = None


    def __enter__(self):
        self.connection = psycopg2.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            database=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD
        )
        self.cursor = self.connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cursor:
            self.cursor.close()
        if self.connection:
            self.connection.rollback() if exc_type else self.connection.commit()
            self.connection.close()
        return False
    
    def query(self, sql: str, params: tuple = None):
        self.cursor.execute(sql, params or ())
        
        sql_upper = sql.strip().upper()
        if sql_upper.startswith('SELECT') or 'RETURNING' in sql_upper:
            result = self.cursor.fetchall()
            # If RETURNING single column, return first row's first value
            if 'RETURNING' in sql_upper and len(result) == 1:
                return result[0]['id'] if 'id' in result[0] else result[0]
            return result
        if sql_upper.startswith(('INSERT', 'UPDATE', 'DELETE')):
            return self.cursor.rowcount
        return None