#!/usr/bin/env python3
"""Database migration script"""
import os
import sys
import subprocess
import psycopg2
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
env_path = Path(__file__).parent.parent / 'backend' / '.env'
load_dotenv(env_path)

def check_docker_running():
    """Check if Docker containers are running"""
    try:
        result = subprocess.run(
            ['docker', 'ps', '--filter', 'name=matcha_postgres', '--format', '{{.Names}}'],
            capture_output=True,
            text=True,
            timeout=5
        )
        return 'matcha_postgres' in result.stdout
    except:
        return False

def get_container_env(var_name):
    """Get environment variable from PostgreSQL container"""
    try:
        result = subprocess.run(
            ['docker-compose', 'exec', '-T', 'postgres', 'printenv', var_name],
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.stdout.strip()
    except:
        return None

def migrate():
    """Run schema.sql migration"""
    # Check if Docker containers are running
    if not check_docker_running():
        print("❌ Docker containers are not running!")
        print("Please run: make up")
        sys.exit(1)
    
    try:
        # Get credentials from container (more reliable than .env)
        db_user = get_container_env('POSTGRES_USER') or os.getenv('DB_USER')
        db_password = get_container_env('POSTGRES_PASSWORD') or os.getenv('DB_PASSWORD')
        db_name = get_container_env('POSTGRES_DB') or os.getenv('DB_NAME')
        
        if not db_password:
            print("❌ Could not retrieve database password!")
            print("Trying to get from container environment...")
            sys.exit(1)
        
        # Connect to database (use localhost when running from host)
        db_host = os.getenv('DB_HOST', 'localhost')
        if db_host == 'postgres':
            db_host = 'localhost'
        
        db_port = os.getenv('DB_PORT', '5432')
        
        print(f"Connecting to database at {db_host}:{db_port}...")
        print(f"Database: {db_name}, User: {db_user}, Password: {'*' * len(db_password) if db_password else 'NOT SET'}")
        
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        
        # Read schema file
        schema_path = Path(__file__).parent.parent / 'backend' / 'schema' / 'schema.sql'
        with open(schema_path, 'r') as f:
            schema_sql = f.read()
        
        # Execute schema
        cursor = conn.cursor()
        
        # Check if tables already exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('users', 'tokens')
        """)
        existing_tables = [row[0] for row in cursor.fetchall()]
        
        if existing_tables:
            print(f"⚠️  Tables already exist: {', '.join(existing_tables)}")
            print("Skipping migration. Tables are already created.")
            cursor.close()
            conn.close()
            return
        
        # Execute schema
        cursor.execute(schema_sql)
        conn.commit()
        
        print("✅ Migration successful!")
        cursor.close()
        conn.close()
        
    except psycopg2.OperationalError as e:
        print(f"❌ Database connection failed: {e}")
        print("\nTroubleshooting:")
        print("1. Check your backend/.env file matches container credentials")
        print("2. Container uses: POSTGRES_USER and POSTGRES_PASSWORD from docker-compose")
        print("3. Update backend/.env to match, or reset database: make down && make up")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Migration failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    migrate()

