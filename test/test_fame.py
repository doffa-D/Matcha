#!/usr/bin/env python3
"""
Test script for Fame Rating implementation.
Tests that fame_rating updates when users are liked/unliked.
"""

import requests
import json

BASE_URL = "http://localhost:5000"

USER1 = {"username": "adocac2ceptable", "password": "adocac2ceptable"}
USER2 = {"username": "bennycopper", "password": "bennycopper"}


def login(username, password):
    """Login and return token + user_id."""
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"username": username, "password": password})
    if r.status_code == 200:
        data = r.json()
        return data['token'], data['user']['id']
    return None, None


def get_fame_rating(token, user_id):
    """Get a user's fame rating from their profile."""
    r = requests.get(f"{BASE_URL}/api/users/{user_id}", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        return r.json().get('fame_rating', 0.0)
    return None


def like_user(token, target_id):
    """Like a user."""
    r = requests.post(
        f"{BASE_URL}/api/users/{target_id}/like",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"like": True}
    )
    return r.status_code == 200


def unlike_user(token, target_id):
    """Unlike a user."""
    r = requests.post(
        f"{BASE_URL}/api/users/{target_id}/like",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"like": False}
    )
    return r.status_code == 200


def main():
    print("=" * 60)
    print("  FAME RATING TEST")
    print("=" * 60)
    
    # Login both users
    token1, user1_id = login(USER1["username"], USER1["password"])
    token2, user2_id = login(USER2["username"], USER2["password"])
    
    if not token1 or not token2:
        print("Failed to login users")
        return
    
    print(f"\nUser 1: {USER1['username']} (ID: {user1_id})")
    print(f"User 2: {USER2['username']} (ID: {user2_id})")
    
    # Get initial fame ratings
    print("\n--- Initial State ---")
    fame1 = get_fame_rating(token2, user1_id)  # User2 checks User1's fame
    fame2 = get_fame_rating(token1, user2_id)  # User1 checks User2's fame
    print(f"User 1 fame_rating: {fame1}")
    print(f"User 2 fame_rating: {fame2}")
    
    # User 1 likes User 2 -> User 2's fame should increase
    print("\n--- User 1 LIKES User 2 ---")
    if like_user(token1, user2_id):
        fame2_after = get_fame_rating(token1, user2_id)
        print(f"User 2 fame_rating: {fame2} -> {fame2_after}")
        if fame2_after > fame2:
            print("SUCCESS: Fame rating increased!")
        else:
            print("NOTE: Fame unchanged (may already have likes)")
    
    # User 2 likes User 1 -> User 1's fame should increase
    print("\n--- User 2 LIKES User 1 ---")
    if like_user(token2, user1_id):
        fame1_after = get_fame_rating(token2, user1_id)
        print(f"User 1 fame_rating: {fame1} -> {fame1_after}")
        if fame1_after > fame1:
            print("SUCCESS: Fame rating increased!")
        else:
            print("NOTE: Fame unchanged (may already have likes)")
    
    # User 1 unlikes User 2 -> User 2's fame should decrease
    print("\n--- User 1 UNLIKES User 2 ---")
    fame2_before = get_fame_rating(token1, user2_id)
    if unlike_user(token1, user2_id):
        fame2_after_unlike = get_fame_rating(token1, user2_id)
        print(f"User 2 fame_rating: {fame2_before} -> {fame2_after_unlike}")
        if fame2_after_unlike < fame2_before:
            print("SUCCESS: Fame rating decreased!")
        elif fame2_after_unlike == fame2_before:
            print("NOTE: Fame unchanged (check calculation)")
    
    # User 2 unlikes User 1 -> User 1's fame should decrease
    print("\n--- User 2 UNLIKES User 1 ---")
    fame1_before = get_fame_rating(token2, user1_id)
    if unlike_user(token2, user1_id):
        fame1_after_unlike = get_fame_rating(token2, user1_id)
        print(f"User 1 fame_rating: {fame1_before} -> {fame1_after_unlike}")
        if fame1_after_unlike < fame1_before:
            print("SUCCESS: Fame rating decreased!")
        elif fame1_after_unlike == fame1_before:
            print("NOTE: Fame unchanged (check calculation)")
    
    # Final state
    print("\n--- Final State ---")
    print(f"User 1 fame_rating: {get_fame_rating(token2, user1_id)}")
    print(f"User 2 fame_rating: {get_fame_rating(token1, user2_id)}")
    
    print("\n" + "=" * 60)
    print("  TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()


