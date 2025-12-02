#!/usr/bin/env python3
"""
Test script for Users API endpoints.
Tests login, view profile, like/unlike, and block functionality.
"""

import requests
import json
import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, Optional

# Try to import psycopg2 for database cleanup (optional)
try:
    import psycopg2
    PSYCOPG2_AVAILABLE = True
except ImportError:
    PSYCOPG2_AVAILABLE = False

# Load .env file from backend directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path, override=False)

BASE_URL = "http://localhost:5000"

# User credentials
USER1 = {
    "username": "adocac2ceptable",
    "password": "adocac2ceptable"
}

USER2 = {
    "username": "bennycopper",
    "password": "bennycopper"
}


def print_section(title: str):
    """Print a formatted section header."""
    print("\n" + "=" * 60)
    print(f"  {title}")
    print("=" * 60)


def print_response(response: requests.Response, description: str = ""):
    """Print formatted response."""
    if description:
        print(f"\n{description}")
    print(f"Status: {response.status_code}")
    try:
        data = response.json()
        print(json.dumps(data, indent=2))
        return data
    except:
        print(response.text)
        return None


def login(username: str, password: str) -> Optional[Dict]:
    """Login and return token."""
    url = f"{BASE_URL}/api/auth/login"
    payload = {
        "username": username,
        "password": password
    }
    
    response = requests.post(url, json=payload)
    data = print_response(response, f"Login as '{username}':")
    
    if response.status_code == 200 and data:
        token = data.get('token')
        if token:
            print(f"✓ Token received: {token[:50]}...")
            return token
    return None


def get_my_profile(token: str) -> Optional[Dict]:
    """Get current user's profile to retrieve user ID."""
    url = f"{BASE_URL}/api/profile/me"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    data = print_response(response, "Get my profile:")
    
    if response.status_code == 200 and data:
        user_id = data.get('id')
        username = data.get('username')
        print(f"✓ User ID: {user_id}, Username: {username}")
        return data
    return None


def view_user_profile(token: str, target_user_id: int) -> Optional[Dict]:
    """View another user's profile."""
    url = f"{BASE_URL}/api/users/{target_user_id}"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers)
    data = print_response(response, f"View user {target_user_id} profile:")
    
    if response.status_code == 200 and data:
        print(f"✓ Profile viewed successfully")
        print(f"  - Liked by me: {data.get('liked_by_me')}")
        print(f"  - Liked by them: {data.get('liked_by_them')}")
        print(f"  - Connected: {data.get('connected')}")
    return data


def toggle_like(token: str, target_user_id: int, like: bool) -> Optional[Dict]:
    """Like or unlike a user."""
    url = f"{BASE_URL}/api/users/{target_user_id}/like"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    payload = {"like": like}
    
    action = "Like" if like else "Unlike"
    response = requests.post(url, headers=headers, json=payload)
    data = print_response(response, f"{action} user {target_user_id}:")
    
    if response.status_code == 200 and data:
        print(f"✓ {action} successful")
        print(f"  - Liked by me: {data.get('liked_by_me')}")
        print(f"  - Liked by them: {data.get('liked_by_them')}")
        print(f"  - Connected: {data.get('connected')}")
    return data


def block_user(token: str, target_user_id: int) -> Optional[Dict]:
    """Block a user."""
    url = f"{BASE_URL}/api/users/{target_user_id}/block"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json={})
    data = print_response(response, f"Block user {target_user_id}:")
    
    if response.status_code == 200 and data:
        print(f"✓ User blocked successfully")
    return data


def report_user(token: str, target_user_id: int) -> Optional[Dict]:
    """Report a user as fake account."""
    url = f"{BASE_URL}/api/users/{target_user_id}/report"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    response = requests.post(url, headers=headers, json={})
    data = print_response(response, f"Report user {target_user_id}:")
    
    if response.status_code == 200 and data:
        print(f"✓ User reported successfully")
    return data


def browse_users(token: str, params: Dict = None) -> Optional[Dict]:
    """
    Browse suggested users with optional filters.
    
    Params can include:
        # Search mode (when gender is provided)
        gender: 'Male' | 'Female' | 'all' - Activates search mode
        
        # Common filters
        sort: 'distance' | 'age' | 'fame_rating' | 'common_tags'
        order: 'asc' | 'desc'
        min_age, max_age: Age range
        max_distance: Max distance in km
        min_fame, max_fame: Fame rating range
        tags: Comma-separated tag IDs
        page, limit: Pagination
    """
    url = f"{BASE_URL}/api/browsing"
    headers = {"Authorization": f"Bearer {token}"}
    
    response = requests.get(url, headers=headers, params=params or {})
    data = print_response(response, f"Browse/Search (params: {params or 'none'}):")
    
    if response.status_code == 200 and data:
        users = data.get('users', [])
        pagination = data.get('pagination', {})
        mode = data.get('mode', 'unknown')
        print(f"✓ Mode: {mode} | Found {len(users)} users (total: {pagination.get('total', 0)})")
        if users:
            print(f"  First user: {users[0].get('username')} (distance: {users[0].get('distance_km')} km)")
    return data


def unblock_users(user1_id: int, user2_id: int) -> bool:
    """Remove any blocks between two users (cleanup for testing)."""
    if not PSYCOPG2_AVAILABLE:
        print("⚠ psycopg2 not available - skipping database cleanup")
        print(f"  To unblock manually, run:")
        print(f"  docker exec -i matcha_postgres psql -U matcha -d matcha_db -c \"DELETE FROM blocks WHERE (blocker_id = {user1_id} AND blocked_id = {user2_id}) OR (blocker_id = {user2_id} AND blocked_id = {user1_id});\"")
        return False
    
    try:
        # Get database connection from environment (loaded from .env)
        db_host = os.getenv('DB_HOST', 'localhost')
        # If host is 'postgres' (Docker service name), use 'localhost' for local testing
        if db_host == 'postgres':
            db_host = 'localhost'
        db_port = os.getenv('DB_PORT', '5432')
        db_name = os.getenv('DB_NAME', 'matcha_db')
        db_user = os.getenv('DB_USER', 'matcha')
        db_password = os.getenv('DB_PASSWORD', 'matcha_password')
        
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            database=db_name,
            user=db_user,
            password=db_password
        )
        cur = conn.cursor()
        
        # Remove blocks in both directions
        cur.execute(
            "DELETE FROM blocks WHERE (blocker_id = %s AND blocked_id = %s) OR (blocker_id = %s AND blocked_id = %s)",
            (user1_id, user2_id, user2_id, user1_id)
        )
        deleted_count = cur.rowcount
        
        conn.commit()
        cur.close()
        conn.close()
        
        if deleted_count > 0:
            print(f"✓ Removed {deleted_count} block(s) between users {user1_id} and {user2_id}")
        else:
            print(f"✓ No blocks found between users {user1_id} and {user2_id}")
        return True
    except Exception as e:
        print(f"⚠ Warning: Could not unblock users via database: {e}")
        print(f"  To unblock manually, run:")
        print(f"  docker exec -i matcha_postgres psql -U matcha -d matcha_db -c \"DELETE FROM blocks WHERE (blocker_id = {user1_id} AND blocked_id = {user2_id}) OR (blocker_id = {user2_id} AND blocked_id = {user1_id});\"")
        return False


def main():
    """Main test flow."""
    print_section("USERS API TEST SCRIPT")
    
    # Step 1: Login both users
    print_section("STEP 1: Login Users")
    
    token1 = login(USER1["username"], USER1["password"])
    if not token1:
        print("❌ Failed to login User 1. Exiting.")
        return
    
    token2 = login(USER2["username"], USER2["password"])
    if not token2:
        print("❌ Failed to login User 2. Exiting.")
        return
    
    # Step 2: Get user IDs
    print_section("STEP 2: Get User IDs")
    
    profile1 = get_my_profile(token1)
    profile2 = get_my_profile(token2)
    
    if not profile1 or not profile2:
        print("❌ Failed to get user profiles. Exiting.")
        return
    
    user1_id = profile1.get('id')
    user2_id = profile2.get('id')
    
    print(f"\n✓ User 1 ID: {user1_id} ({profile1.get('username')})")
    print(f"✓ User 2 ID: {user2_id} ({profile2.get('username')})")
    
    # Step 2.5: Cleanup - Remove any existing blocks and reports
    print_section("STEP 2.5: Cleanup - Remove Existing Blocks and Reports")
    unblock_users(user1_id, user2_id)
    
    # Also remove any existing reports for clean testing
    try:
        import subprocess
        docker_cmd = f'docker exec -i matcha_postgres psql -U matcha -d matcha_db -c "DELETE FROM reports WHERE (reporter_id = {user1_id} AND reported_id = {user2_id}) OR (reporter_id = {user2_id} AND reported_id = {user1_id});"'
        result = subprocess.run(docker_cmd, shell=True, capture_output=True, text=True)
        if result.returncode == 0:
            print("✓ Removed existing reports")
    except Exception as e:
        print(f"⚠ Could not remove reports: {e}")
    
    # Step 3: View profiles
    print_section("STEP 3: View Each Other's Profiles")
    
    print("\n--- User 1 viewing User 2 ---")
    view_user_profile(token1, user2_id)
    
    print("\n--- User 2 viewing User 1 ---")
    view_user_profile(token2, user1_id)
    
    # Step 4: Test Like/Unlike flow
    print_section("STEP 4: Test Like/Unlike Flow")
    
    print("\n--- User 1 likes User 2 ---")
    toggle_like(token1, user2_id, like=True)
    
    print("\n--- User 2 views User 1 (should see liked_by_them: true) ---")
    view_user_profile(token2, user1_id)
    
    print("\n--- User 2 likes User 1 (creates connection) ---")
    toggle_like(token2, user1_id, like=True)
    
    print("\n--- User 1 views User 2 (should see connected: true) ---")
    view_user_profile(token1, user2_id)
    
    print("\n--- User 2 views User 1 (should see connected: true) ---")
    view_user_profile(token2, user1_id)
    
    # Step 5: Test Unlike (breaks connection)
    print_section("STEP 5: Test Unlike (Break Connection)")
    
    print("\n--- User 1 unlikes User 2 ---")
    toggle_like(token1, user2_id, like=False)
    
    print("\n--- User 1 views User 2 (should see connected: false) ---")
    view_user_profile(token1, user2_id)
    
    # Step 6: Test Report API (before blocking)
    print_section("STEP 6: Test Report API")
    
    print("\n--- User 1 reports User 2 ---")
    report_user(token1, user2_id)
    
    print("\n--- User 1 tries to report User 2 again (should return already reported) ---")
    report_user(token1, user2_id)
    
    print("\n--- User 1 tries to report themselves (should fail with 400) ---")
    report_user(token1, user1_id)
    
    # Step 7: Re-establish connection for block test
    print_section("STEP 7: Re-establish Connection for Block Test")
    
    print("\n--- User 1 likes User 2 again ---")
    toggle_like(token1, user2_id, like=True)
    
    print("\n--- Verify connection exists ---")
    view_user_profile(token1, user2_id)
    
    # Step 8: Test Block
    print_section("STEP 8: Test Block API")
    
    print("\n--- User 1 blocks User 2 ---")
    block_user(token1, user2_id)
    
    print("\n--- User 1 tries to view User 2 (should fail with 403) ---")
    view_user_profile(token1, user2_id)
    
    print("\n--- User 2 tries to view User 1 (should fail with 403) ---")
    view_user_profile(token2, user1_id)
    
    print("\n--- User 2 tries to like User 1 (should fail with 403) ---")
    toggle_like(token2, user1_id, like=True)
    
    # Step 9: Test Browsing API
    print_section("STEP 9: Test Browsing API")
    
    # First, unblock for clean browsing test
    print("\n--- Unblock for browsing test ---")
    unblock_users(user1_id, user2_id)
    
    print("\n--- User 1 browses (default: sort by distance) ---")
    browse_users(token1)
    
    print("\n--- User 1 browses (sort by fame_rating, desc) ---")
    browse_users(token1, {"sort": "fame_rating", "order": "desc"})
    
    print("\n--- User 1 browses (sort by common_tags, desc) ---")
    browse_users(token1, {"sort": "common_tags", "order": "desc"})
    
    print("\n--- User 1 browses (filter: max_distance=50km) ---")
    browse_users(token1, {"max_distance": 50})
    
    print("\n--- User 1 browses (filter: min_age=20, max_age=30) ---")
    browse_users(token1, {"min_age": 20, "max_age": 30})
    
    print("\n--- User 1 browses (pagination: page=1, limit=5) ---")
    browse_users(token1, {"page": 1, "limit": 5})
    
    # Step 10: Test Search Mode (Advanced Search - IV.4)
    print_section("STEP 10: Test Search Mode (Advanced Search)")
    
    print("\n--- Search: gender=all (see everyone) ---")
    browse_users(token1, {"gender": "all"})
    
    print("\n--- Search: gender=Female ---")
    browse_users(token1, {"gender": "Female"})
    
    print("\n--- Search: gender=Male ---")
    browse_users(token1, {"gender": "Male"})
    
    print("\n--- Search: gender=all + filters (age 18-50, fame 0-5) ---")
    browse_users(token1, {
        "gender": "all",
        "min_age": 18,
        "max_age": 50,
        "min_fame": 0,
        "max_fame": 5,
        "sort": "fame_rating",
        "order": "desc"
    })

    print_section("TEST COMPLETE")
    print("\n✓ All tests executed!")
    print("\nNote: To unblock, you would need to manually delete from database:")
    print(f"   DELETE FROM blocks WHERE blocker_id = {user1_id} AND blocked_id = {user2_id};")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n❌ Test interrupted by user")
    except Exception as e:
        print(f"\n\n❌ Error: {e}")
        import traceback
        traceback.print_exc()

