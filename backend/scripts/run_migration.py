#!/usr/bin/env python3
"""Run database migration for chat and profile pic features."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import Database

def run_migration():
    print("Running migration...")
    
    with Database() as db:
        # Check if is_profile_pic column exists
        db.cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'images' AND column_name = 'is_profile_pic'
        """)
        if not db.cursor.fetchone():
            print("Adding is_profile_pic column to images...")
            db.cursor.execute("ALTER TABLE images ADD COLUMN is_profile_pic BOOLEAN DEFAULT FALSE")
            print("✓ Added is_profile_pic column")
        else:
            print("✓ is_profile_pic column already exists")
        
        # Check if messages table exists
        db.cursor.execute("""
            SELECT table_name FROM information_schema.tables 
            WHERE table_name = 'messages'
        """)
        if not db.cursor.fetchone():
            print("Creating messages table...")
            db.cursor.execute("""
                CREATE TABLE messages (
                    id SERIAL PRIMARY KEY,
                    sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    receiver_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    content TEXT NOT NULL,
                    is_read BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    CONSTRAINT no_self_message CHECK (sender_id != receiver_id)
                )
            """)
            db.cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)")
            db.cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id)")
            db.cursor.execute("CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = FALSE")
            print("✓ Created messages table")
        else:
            print("✓ messages table already exists")
        
        # Check notifications column name
        db.cursor.execute("""
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'notifications' AND column_name = 'source_user_id'
        """)
        if not db.cursor.fetchone():
            # Check if source_id exists instead
            db.cursor.execute("""
                SELECT column_name FROM information_schema.columns 
                WHERE table_name = 'notifications' AND column_name = 'source_id'
            """)
            if db.cursor.fetchone():
                print("Renaming source_id to source_user_id in notifications...")
                db.cursor.execute("ALTER TABLE notifications RENAME COLUMN source_id TO source_user_id")
                print("✓ Renamed column")
            else:
                print("✓ notifications table has correct column names")
        else:
            print("✓ notifications table already has source_user_id")
    
    print("\n✓ Migration complete!")

if __name__ == '__main__':
    run_migration()

