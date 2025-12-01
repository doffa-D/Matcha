#!/usr/bin/env python3
"""
Test script for Notifications.
Tests that notifications are created on: visit, like, match, unlike
"""

import requests
import subprocess

BASE_URL = "http://localhost:5000"

USER1 = {"username": "adocac2ceptable", "password": "adocac2ceptable"}
USER2 = {"username": "bennycopper", "password": "bennycopper"}


def login(username, password):
    """Login and return token + user_id."""
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": username, "password": password})
    if r.status_code == 200:
        data = r.json()
        return data['token'], data['user']['id']
    print(f"Login failed: {r.text}")
    return None, None


def get_notifications(token):
    """Get notifications for a user."""
    r = requests.get(f"{BASE_URL}/api/notifications", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        return r.json()
    return None


def get_unread_count(token):
    """Get unread notification count."""
    r = requests.get(f"{BASE_URL}/api/notifications/unread/count", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        return r.json().get('unread_count', 0)
    return 0


def view_profile(token, user_id):
    """View a user's profile."""
    r = requests.get(f"{BASE_URL}/api/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
    return r.status_code == 200


def like_user(token, user_id):
    """Like a user."""
    r = requests.post(
        f"{BASE_URL}/api/users/{user_id}/like",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"like": True}
    )
    return r.status_code == 200


def unlike_user(token, user_id):
    """Unlike a user."""
    r = requests.post(
        f"{BASE_URL}/api/users/{user_id}/like",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"like": False}
    )
    return r.status_code == 200


def db_count_notifications():
    """Get notification count directly from DB."""
    result = subprocess.run(
        'docker exec -i matcha_postgres psql -U matcha -d matcha_db -t -c "SELECT COUNT(*) FROM notifications;"',
        shell=True, capture_output=True, text=True
    )
    return int(result.stdout.strip()) if result.returncode == 0 else 0


def cleanup():
    """Clean up test data."""
    subprocess.run(
        'docker exec -i matcha_postgres psql -U matcha -d matcha_db -c "DELETE FROM notifications; DELETE FROM likes WHERE liker_id IN (17, 18) OR liked_id IN (17, 18); DELETE FROM blocks WHERE blocker_id IN (17, 18); DELETE FROM visits WHERE visitor_id IN (17, 18);"',
        shell=True, capture_output=True
    )


def main():
    print("=" * 60)
    print("  NOTIFICATION TEST")
    print("=" * 60)
    
    # Cleanup first
    print("\n--- Cleanup ---")
    cleanup()
    print(f"Initial notifications: {db_count_notifications()}")
    
    # Login
    print("\n--- Login ---")
    token1, user1_id = login(USER1["username"], USER1["password"])
    token2, user2_id = login(USER2["username"], USER2["password"])
    
    if not token1 or not token2:
        print("Login failed")
        return
    
    print(f"User 1: {user1_id}, User 2: {user2_id}")
    
    # Test 1: Visit notification
    print("\n--- Test 1: Visit Notification ---")
    view_profile(token1, user2_id)  # User 1 views User 2
    count = db_count_notifications()
    print(f"After visit: {count} notifications (expected: 1)")
    
    # Test 2: Like notification
    print("\n--- Test 2: Like Notification ---")
    like_user(token1, user2_id)  # User 1 likes User 2
    count = db_count_notifications()
    print(f"After like: {count} notifications (expected: 2 - visit + like)")
    
    # Test 3: Match notification (mutual like)
    print("\n--- Test 3: Match Notification ---")
    like_user(token2, user1_id)  # User 2 likes User 1 -> MATCH!
    count = db_count_notifications()
    print(f"After mutual like: {count} notifications (expected: 5 - visit + like + like + 2 match)")
    
    # Test 4: Unlike notification
    print("\n--- Test 4: Unlike Notification ---")
    unlike_user(token1, user2_id)  # User 1 unlikes User 2
    count = db_count_notifications()
    print(f"After unlike: {count} notifications (expected: 6 - prev + unlike)")
    
    # Check notifications via API
    print("\n--- User 2's Notifications ---")
    notifs = get_notifications(token2)
    if notifs:
        for n in notifs.get('notifications', [])[:5]:
            print(f"  - {n['type']}: from user {n['from_user'].get('first_name', 'Unknown')}")
    
    print(f"\nUser 2 unread count: {get_unread_count(token2)}")
    
    print("\n" + "=" * 60)
    print("  TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()

