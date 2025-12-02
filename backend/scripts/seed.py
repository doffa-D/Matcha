#!/usr/bin/env python3
"""
Database Seeder Script for Matcha
Generates 500+ fake user profiles for evaluation.

Usage:
    python scripts/seed.py [--count 500] [--clear]

Options:
    --count N    Number of profiles to generate (default: 500)
    --clear      Clear existing data before seeding
"""

import sys
import os
import random
import argparse
from datetime import datetime, timedelta
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

import bcrypt
from faker import Faker

# Initialize Faker with multiple locales for variety
fake = Faker(['en_US', 'en_GB', 'fr_FR', 'de_DE', 'es_ES'])

# Configuration
GENDERS = ['Male', 'Female']
PREFERENCES = ['Straight', 'Gay', 'Bisexual']
DEFAULT_PASSWORD = 'Password123!'  # All seed users get this password

# Common interest tags
INTEREST_TAGS = [
    '#music', '#travel', '#food', '#photography', '#fitness',
    '#movies', '#gaming', '#reading', '#art', '#cooking',
    '#hiking', '#yoga', '#sports', '#fashion', '#tech',
    '#nature', '#coffee', '#wine', '#dancing', '#pets',
    '#beach', '#mountains', '#camping', '#running', '#cycling',
    '#meditation', '#writing', '#theater', '#concerts', '#festivals',
    '#vegan', '#vegetarian', '#foodie', '#brunch', '#sushi',
    '#anime', '#comics', '#scifi', '#fantasy', '#horror',
    '#jazz', '#rock', '#hiphop', '#electronic', '#classical',
    '#dogs', '#cats', '#horses', '#birds', '#aquarium',
    '#gardening', '#diy', '#crafts', '#painting', '#sculpture'
]

# Major cities with coordinates (for realistic location data)
CITIES = [
    # France
    {'name': 'Paris', 'lat': 48.8566, 'lon': 2.3522},
    {'name': 'Lyon', 'lat': 45.7640, 'lon': 4.8357},
    {'name': 'Marseille', 'lat': 43.2965, 'lon': 5.3698},
    {'name': 'Toulouse', 'lat': 43.6047, 'lon': 1.4442},
    {'name': 'Nice', 'lat': 43.7102, 'lon': 7.2620},
    {'name': 'Bordeaux', 'lat': 44.8378, 'lon': -0.5792},
    # USA
    {'name': 'New York', 'lat': 40.7128, 'lon': -74.0060},
    {'name': 'Los Angeles', 'lat': 34.0522, 'lon': -118.2437},
    {'name': 'Chicago', 'lat': 41.8781, 'lon': -87.6298},
    {'name': 'San Francisco', 'lat': 37.7749, 'lon': -122.4194},
    {'name': 'Miami', 'lat': 25.7617, 'lon': -80.1918},
    # UK
    {'name': 'London', 'lat': 51.5074, 'lon': -0.1278},
    {'name': 'Manchester', 'lat': 53.4808, 'lon': -2.2426},
    {'name': 'Birmingham', 'lat': 52.4862, 'lon': -1.8904},
    # Germany
    {'name': 'Berlin', 'lat': 52.5200, 'lon': 13.4050},
    {'name': 'Munich', 'lat': 48.1351, 'lon': 11.5820},
    # Spain
    {'name': 'Madrid', 'lat': 40.4168, 'lon': -3.7038},
    {'name': 'Barcelona', 'lat': 41.3851, 'lon': 2.1734},
    # Italy
    {'name': 'Rome', 'lat': 41.9028, 'lon': 12.4964},
    {'name': 'Milan', 'lat': 45.4642, 'lon': 9.1900},
]

# Bio templates
BIO_TEMPLATES = [
    "Love {hobby1} and {hobby2}. Looking for someone to share adventures with.",
    "Passionate about {hobby1}. When I'm not working, you'll find me {hobby2}.",
    "{hobby1} enthusiast | {hobby2} lover | Always up for trying new things",
    "Life is short, enjoy {hobby1} and {hobby2}! 🌟",
    "Coffee addict ☕ | {hobby1} | {hobby2} | Let's chat!",
    "Just a {hobby1} fan looking for good vibes and great conversations.",
    "Adventurer at heart. Love {hobby1}, {hobby2}, and spontaneous trips.",
    "{hobby1} by day, {hobby2} by night. Looking for my partner in crime.",
    "Simple person who enjoys {hobby1} and {hobby2}. Let's grab coffee!",
    "Here for genuine connections. Into {hobby1} and {hobby2}.",
]

HOBBIES = [
    'music', 'traveling', 'cooking', 'hiking', 'photography',
    'reading', 'gaming', 'fitness', 'art', 'movies',
    'dancing', 'yoga', 'running', 'cycling', 'swimming'
]


def get_db_connection():
    """Get database connection using config."""
    import psycopg2
    import psycopg2.extras
    from config import Config
    
    return psycopg2.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        database=Config.DB_NAME,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD
    )


def clear_data(cursor):
    """Clear all user-related data (except admin if exists)."""
    print("Clearing existing data...")
    # Order matters due to foreign keys
    tables = [
        'messages', 'notifications', 'reports', 'blocks', 
        'likes', 'visits', 'user_tags', 'images', 'tokens', 'users'
    ]
    for table in tables:
        cursor.execute(f"DELETE FROM {table}")
    print("✓ Data cleared")


def create_tags(cursor):
    """Create interest tags if they don't exist."""
    print("Creating tags...")
    for tag in INTEREST_TAGS:
        cursor.execute(
            "INSERT INTO tags (tag_name) VALUES (%s) ON CONFLICT (tag_name) DO NOTHING",
            (tag,)
        )
    print(f"✓ Created {len(INTEREST_TAGS)} tags")


def generate_user(index):
    """Generate a single fake user."""
    gender = random.choice(GENDERS)
    first_name = fake.first_name_male() if gender == 'Male' else fake.first_name_female()
    last_name = fake.last_name()
    
    # Generate unique username
    username = f"{first_name.lower()}{last_name.lower()}{random.randint(1, 999)}"
    username = username[:50]  # Max 50 chars
    
    # Random age between 18 and 60
    age = random.randint(18, 60)
    dob = datetime.now() - timedelta(days=age * 365 + random.randint(0, 364))
    
    # Random city for location
    city = random.choice(CITIES)
    # Add some randomness to exact location (within ~10km)
    lat = city['lat'] + random.uniform(-0.1, 0.1)
    lon = city['lon'] + random.uniform(-0.1, 0.1)
    
    # Random sexual preference with realistic distribution
    preference = random.choices(
        PREFERENCES,
        weights=[70, 10, 20],  # 70% straight, 10% gay, 20% bisexual
        k=1
    )[0]
    
    # Generate bio
    bio_template = random.choice(BIO_TEMPLATES)
    hobby1, hobby2 = random.sample(HOBBIES, 2)
    bio = bio_template.format(hobby1=hobby1, hobby2=hobby2)
    
    # Random fame rating (weighted towards lower values)
    fame = round(random.betavariate(2, 5) * 5, 2)
    
    # Random last online (within last 30 days, weighted towards recent)
    days_ago = int(random.betavariate(1, 3) * 30)
    last_online = datetime.now() - timedelta(days=days_ago, hours=random.randint(0, 23))
    
    return {
        'username': username,
        'email': f"{username}@seed.matcha.local",
        'password_hash': bcrypt.hashpw(DEFAULT_PASSWORD.encode(), bcrypt.gensalt()).decode(),
        'first_name': first_name,
        'last_name': last_name,
        'bio': bio,
        'gender': gender,
        'sexual_preference': preference,
        'latitude': round(lat, 6),
        'longitude': round(lon, 6),
        'date_of_birth': dob.date(),
        'age': age,
        'fame_rating': fame,
        'is_verified': True,  # All seed users are verified
        'last_online': last_online
    }


def seed_users(cursor, count):
    """Seed users into database."""
    print(f"Generating {count} user profiles...")
    
    users = []
    usernames = set()
    
    for i in range(count):
        user = generate_user(i)
        
        # Ensure unique username
        while user['username'] in usernames:
            user = generate_user(i)
        usernames.add(user['username'])
        
        users.append(user)
        
        if (i + 1) % 100 == 0:
            print(f"  Generated {i + 1}/{count} users...")
    
    # Bulk insert users
    print("Inserting users into database...")
    user_ids = []
    
    for user in users:
        cursor.execute("""
            INSERT INTO users (
                username, email, password_hash, first_name, last_name,
                bio, gender, sexual_preference, latitude, longitude,
                date_of_birth, age, fame_rating, is_verified, last_online
            ) VALUES (
                %(username)s, %(email)s, %(password_hash)s, %(first_name)s, %(last_name)s,
                %(bio)s, %(gender)s, %(sexual_preference)s, %(latitude)s, %(longitude)s,
                %(date_of_birth)s, %(age)s, %(fame_rating)s, %(is_verified)s, %(last_online)s
            ) RETURNING id
        """, user)
        user_ids.append(cursor.fetchone()[0])
    
    print(f"✓ Inserted {len(user_ids)} users")
    return user_ids


def seed_user_tags(cursor, user_ids):
    """Assign random tags to users."""
    print("Assigning tags to users...")
    
    # Get all tag IDs
    cursor.execute("SELECT id FROM tags")
    tag_ids = [row[0] for row in cursor.fetchall()]
    
    total_assignments = 0
    for user_id in user_ids:
        # Each user gets 3-8 random tags
        num_tags = random.randint(3, 8)
        user_tags = random.sample(tag_ids, min(num_tags, len(tag_ids)))
        
        for tag_id in user_tags:
            cursor.execute(
                "INSERT INTO user_tags (user_id, tag_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                (user_id, tag_id)
            )
            total_assignments += 1
    
    print(f"✓ Assigned {total_assignments} tags to users")


def seed_likes(cursor, user_ids):
    """Generate some random likes between users."""
    print("Generating likes...")
    
    num_likes = len(user_ids) * 3  # Average 3 likes per user
    likes_created = 0
    
    for _ in range(num_likes):
        liker = random.choice(user_ids)
        liked = random.choice(user_ids)
        
        if liker != liked:
            try:
                cursor.execute(
                    "INSERT INTO likes (liker_id, liked_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
                    (liker, liked)
                )
                if cursor.rowcount > 0:
                    likes_created += 1
            except:
                pass
    
    print(f"✓ Created {likes_created} likes")


def seed_visits(cursor, user_ids):
    """Generate some random profile visits."""
    print("Generating profile visits...")
    
    num_visits = len(user_ids) * 5  # Average 5 visits per user
    visits_created = 0
    
    for _ in range(num_visits):
        visitor = random.choice(user_ids)
        visited = random.choice(user_ids)
        
        if visitor != visited:
            try:
                cursor.execute("""
                    INSERT INTO visits (visitor_id, visited_id, visit_count)
                    VALUES (%s, %s, %s)
                    ON CONFLICT DO NOTHING
                """, (visitor, visited, random.randint(1, 5)))
                if cursor.rowcount > 0:
                    visits_created += 1
            except:
                pass
    
    print(f"✓ Created {visits_created} visits")


def seed_images(cursor, user_ids):
    """Generate placeholder profile images for users."""
    print("Generating profile images...")
    
    # Placeholder image URLs (using picsum.photos or similar)
    # In production, you'd use actual images or a local placeholder
    images_created = 0
    
    for user_id in user_ids:
        # Each user gets 1-5 images
        num_images = random.randint(1, 5)
        
        for i in range(num_images):
            # Use a placeholder image path
            # Format: /static/uploads/seed/placeholder_{user_id}_{i}.jpg
            file_path = f"/static/uploads/seed/placeholder_{user_id}_{i}.jpg"
            is_profile_pic = (i == 0)  # First image is profile pic
            
            cursor.execute("""
                INSERT INTO images (user_id, file_path, is_profile_pic)
                VALUES (%s, %s, %s)
            """, (user_id, file_path, is_profile_pic))
            images_created += 1
    
    print(f"✓ Created {images_created} images for {len(user_ids)} users")


def main():
    parser = argparse.ArgumentParser(description='Seed Matcha database with fake profiles')
    parser.add_argument('--count', type=int, default=500, help='Number of profiles to generate')
    parser.add_argument('--clear', action='store_true', help='Clear existing data before seeding')
    args = parser.parse_args()
    
    print("=" * 50)
    print("Matcha Database Seeder")
    print("=" * 50)
    print(f"Profiles to generate: {args.count}")
    print(f"Clear existing data: {args.clear}")
    print()
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        if args.clear:
            clear_data(cursor)
        
        create_tags(cursor)
        user_ids = seed_users(cursor, args.count)
        seed_user_tags(cursor, user_ids)
        seed_images(cursor, user_ids)
        seed_likes(cursor, user_ids)
        seed_visits(cursor, user_ids)
        
        conn.commit()
        
        print()
        print("=" * 50)
        print("✓ Seeding complete!")
        print(f"  - {len(user_ids)} users created")
        print(f"  - Default password for all users: {DEFAULT_PASSWORD}")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n✗ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()


if __name__ == '__main__':
    main()

