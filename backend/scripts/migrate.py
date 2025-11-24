#!/usr/bin/env python3
"""
Database migration script
Automatically applies schema.sql and any pending migrations in schema/migrations/
"""
import os
import sys
import time

# Force UTF-8 output for Windows
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

import psycopg2
import psycopg2.extras
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
BACKEND_DIR = Path(__file__).parent.parent / 'backend'
# Adjust path if script is run from root or backend
if not BACKEND_DIR.exists():
    BACKEND_DIR = Path(__file__).parent.parent / 'app' # Try inside container path?
    # Actually, based on project structure:
    # root/backend/scripts/migrate.py
    # root/backend/.env
    BACKEND_DIR = Path(__file__).resolve().parent.parent

env_path = BACKEND_DIR / '.env'
load_dotenv(env_path)

def get_db_config():
    """Get database configuration with host adjustment for local run"""
    db_host = os.getenv('DB_HOST', 'localhost')
    # If running locally but env says postgres (container name), switch to localhost
    if db_host == 'postgres':
         # Simple heuristic: check if we can resolve 'postgres'. 
         # If not (which is likely on host), use 'localhost'.
         # For now, just defaulting to localhost when 'postgres' is seen on host environment
         # is the safest bet for the Makefile usage.
         db_host = 'localhost'
    
    return {
        'host': db_host,
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'matcha'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'postgres')
    }

def wait_for_db(config, retries=30, delay=2):
    """Wait for database to be ready"""
    print(f"Waiting for database at {config['host']}:{config['port']}...")
    for i in range(retries):
        try:
            conn = psycopg2.connect(**config)
            conn.close()
            print("✅ Database is ready!")
            return True
        except psycopg2.OperationalError:
            if i == retries - 1:
                print("❌ Could not connect to database after multiple retries.")
                return False
            print(f"   Database not ready yet, retrying in {delay}s... ({i+1}/{retries})")
            time.sleep(delay)
    return False

def init_migration_table(cursor):
    """Create schema_migrations table if not exists"""
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id SERIAL PRIMARY KEY,
            migration VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

def is_migration_applied(cursor, migration_name):
    """Check if a migration has been applied"""
    cursor.execute("SELECT id FROM schema_migrations WHERE migration = %s", (migration_name,))
    return cursor.fetchone() is not None

def record_migration(cursor, migration_name):
    """Record a migration as applied"""
    cursor.execute("INSERT INTO schema_migrations (migration) VALUES (%s)", (migration_name,))

def run_sql_file(cursor, filepath):
    """Read and execute a SQL file"""
    print(f"   Executing {filepath.name}...")
    with open(filepath, 'r') as f:
        sql = f.read()
    if sql.strip():
        cursor.execute(sql)

def migrate():
    config = get_db_config()
    
    # Check password
    if not config['password']:
        print("❌ Database password not set in environment!")
        sys.exit(1)

    if not wait_for_db(config):
        sys.exit(1)

    conn = None
    try:
        conn = psycopg2.connect(**config)
        conn.autocommit = False 
        cursor = conn.cursor()

        # 1. Initialize migration tracking
        init_migration_table(cursor)
        conn.commit()
        
        # 2. Check if we need to run the base schema.sql
        schema_path = BACKEND_DIR / 'schema' / 'schema.sql'
        BASE_MIGRATION_NAME = '000_initial_schema.sql'
        
        # Check if users table exists (legacy check)
        cursor.execute("SELECT to_regclass('public.users')")
        users_exists = cursor.fetchone()[0] is not None

        if not is_migration_applied(cursor, BASE_MIGRATION_NAME):
            if users_exists:
                print(f"⚠️  'users' table exists but migration '{BASE_MIGRATION_NAME}' not recorded.")
                print(f"   Marking '{BASE_MIGRATION_NAME}' as applied without running.")
                record_migration(cursor, BASE_MIGRATION_NAME)
                conn.commit()
            elif schema_path.exists():
                print(f"Applying base schema: {BASE_MIGRATION_NAME}")
                try:
                    run_sql_file(cursor, schema_path)
                    record_migration(cursor, BASE_MIGRATION_NAME)
                    conn.commit()
                    print(f"✅ Applied {BASE_MIGRATION_NAME}")
                except Exception as e:
                    conn.rollback()
                    print(f"❌ Failed to apply {BASE_MIGRATION_NAME}: {e}")
                    sys.exit(1)
            else:
                print("❌ schema.sql not found!")
                sys.exit(1)
        
        # 3. Apply pending migrations
        migrations_dir = BACKEND_DIR / 'schema' / 'migrations'
        if migrations_dir.exists():
            migration_files = sorted([f for f in migrations_dir.iterdir() if f.suffix == '.sql'])
            
            for migration_file in migration_files:
                migration_name = migration_file.name
                if not is_migration_applied(cursor, migration_name):
                    print(f"Applying migration: {migration_name}")
                    try:
                        run_sql_file(cursor, migration_file)
                        record_migration(cursor, migration_name)
                        conn.commit()
                        print(f"✅ Applied {migration_name}")
                    except Exception as e:
                        conn.rollback()
                        print(f"❌ Failed to apply {migration_name}: {e}")
                        sys.exit(1)
        
        print("✅ Schema is up to date.")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"❌ Migration script failed: {e}")
        sys.exit(1)
    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    migrate()
