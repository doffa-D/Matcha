#!/usr/bin/env python3
"""
Test script for Chat API endpoints.
Tests: conversations, messages, send message functionality.
Requires: Two users who are connected (mutual like).
"""

import requests
import json

BASE_URL = "http://localhost:5000"

# Test users (should exist and be verified)
USER1 = {"username": "adocac2ceptable", "password": "adocac2ceptable"}
USER2 = {"username": "bennycopper", "password": "bennycopper"}


def login(username, password):
    """Login and return token."""
    resp = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"username": username, "password": password}
    )
    if resp.status_code == 200:
        return resp.json().get("token")
    print(f"Login failed for {username}: {resp.json()}")
    return None


def get_headers(token):
    """Return auth headers."""
    return {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }


def test_get_conversations(token):
    """Test GET /api/chat/conversations"""
    print("\n=== Test: Get Conversations ===")
    resp = requests.get(
        f"{BASE_URL}/api/chat/conversations",
        headers=get_headers(token)
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    return resp.status_code == 200


def test_get_messages(token, other_user_id):
    """Test GET /api/chat/messages/<user_id>"""
    print(f"\n=== Test: Get Messages with User {other_user_id} ===")
    resp = requests.get(
        f"{BASE_URL}/api/chat/messages/{other_user_id}",
        headers=get_headers(token)
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    return resp.status_code in [200, 403]  # 403 if not connected


def test_send_message(token, other_user_id, message):
    """Test POST /api/chat/messages/<user_id>"""
    print(f"\n=== Test: Send Message to User {other_user_id} ===")
    resp = requests.post(
        f"{BASE_URL}/api/chat/messages/{other_user_id}",
        headers=get_headers(token),
        json={"content": message}
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    return resp.status_code in [201, 403]  # 403 if not connected


def test_mark_read(token, other_user_id):
    """Test PUT /api/chat/messages/<user_id>/read"""
    print(f"\n=== Test: Mark Messages Read from User {other_user_id} ===")
    resp = requests.put(
        f"{BASE_URL}/api/chat/messages/{other_user_id}/read",
        headers=get_headers(token)
    )
    print(f"Status: {resp.status_code}")
    print(f"Response: {json.dumps(resp.json(), indent=2)}")
    return resp.status_code == 200


def ensure_connected(token1, token2, user1_id, user2_id):
    """Ensure both users have liked each other (connected)."""
    print("\n=== Ensuring Users are Connected ===")
    
    # User1 likes User2
    resp = requests.post(
        f"{BASE_URL}/api/users/{user2_id}/like",
        headers=get_headers(token1),
        json={"like": True}
    )
    print(f"User1 -> User2 like: {resp.status_code} - {resp.json().get('message', resp.json().get('error', 'Unknown'))}")
    
    # User2 likes User1
    resp = requests.post(
        f"{BASE_URL}/api/users/{user1_id}/like",
        headers=get_headers(token2),
        json={"like": True}
    )
    print(f"User2 -> User1 like: {resp.status_code} - {resp.json().get('message', resp.json().get('error', 'Unknown'))}")
    
    return True


def get_user_id(token):
    """Get user ID from profile."""
    resp = requests.get(
        f"{BASE_URL}/api/profile/me",
        headers=get_headers(token)
    )
    if resp.status_code == 200:
        return resp.json().get("id")
    return None


def main():
    print("=" * 60)
    print("Chat API Test Suite")
    print("=" * 60)
    
    # Login both users
    print("\n--- Logging in users ---")
    token1 = login(USER1["username"], USER1["password"])
    token2 = login(USER2["username"], USER2["password"])
    
    if not token1:
        print(f"Could not login as {USER1['username']}")
        return
    if not token2:
        print(f"Could not login as {USER2['username']}")
        return
    
    print(f"✓ User1 ({USER1['username']}) logged in")
    print(f"✓ User2 ({USER2['username']}) logged in")
    
    # Get user IDs
    user1_id = get_user_id(token1)
    user2_id = get_user_id(token2)
    
    if not user1_id or not user2_id:
        print("Could not get user IDs")
        return
    
    print(f"User1 ID: {user1_id}")
    print(f"User2 ID: {user2_id}")
    
    # Ensure they are connected
    ensure_connected(token1, token2, user1_id, user2_id)
    
    # Run tests
    results = []
    
    # Test conversations
    results.append(("Get Conversations (User1)", test_get_conversations(token1)))
    
    # Test get messages
    results.append(("Get Messages (User1 -> User2)", test_get_messages(token1, user2_id)))
    
    # Test send message
    results.append(("Send Message (User1 -> User2)", test_send_message(token1, user2_id, "Hello from User1!")))
    
    # Test reply
    results.append(("Send Reply (User2 -> User1)", test_send_message(token2, user1_id, "Hello back from User2!")))
    
    # Test get messages again
    results.append(("Get Messages After Send", test_get_messages(token1, user2_id)))
    
    # Test mark read
    results.append(("Mark Messages Read", test_mark_read(token1, user2_id)))
    
    # Test conversations again (should show last message)
    results.append(("Get Conversations After Messages", test_get_conversations(token1)))
    
    # Print summary
    print("\n" + "=" * 60)
    print("Test Results Summary")
    print("=" * 60)
    
    passed = 0
    failed = 0
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
        if result:
            passed += 1
        else:
            failed += 1
    
    print(f"\nTotal: {passed} passed, {failed} failed")


if __name__ == "__main__":
    main()

