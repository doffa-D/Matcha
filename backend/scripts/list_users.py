#!/usr/bin/env python3
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.db import Database

with Database() as db:
    # Count total users
    count = db.query('SELECT COUNT(*) as count FROM users')
    print(f"Total users in database: {count[0]['count']}")
    
    # Count verified users
    verified = db.query('SELECT COUNT(*) as count FROM users WHERE is_verified = true')
    print(f"Verified users: {verified[0]['count']}")
    
    # Show sample users
    users = db.query('SELECT id, username, gender, age FROM users ORDER BY id DESC LIMIT 5')
    print("\nSample users (newest):")
    for u in users:
        print(f"  ID: {u['id']}, Username: {u['username']}, Gender: {u['gender']}, Age: {u['age']}")

