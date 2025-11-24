#!/usr/bin/env python3
"""
Test script for /api/profile/location endpoint
Tests IP geolocation by sending empty body
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:5000"
JWT_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoxNiwiZXhwIjoxNzY0MDgwMzI4LCJpYXQiOjE3NjM5OTM5Mjh9.kVS-wguQpeTXV-2-XBgZQZdPQsQdrjMx98L0jlVE1Ko"  # Replace with your actual token

def get_public_ip():
    """Get public IP address"""
    try:
        response = requests.get("https://api.ipify.org?format=json", timeout=5)
        ip_data = response.json()
        return ip_data.get('ip')
    except Exception as e:
        print(f"Failed to get public IP: {e}")
        return None

def test_location_with_ip():
    """Test location endpoint with IP geolocation (empty body)"""
    url = f"{BASE_URL}/api/profile/location"
    
    # Get public IP first
    public_ip = get_public_ip()
    
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JWT_TOKEN}"
    }
    
    # Add public IP to headers if available (for testing through Docker)
    if public_ip:
        headers["X-Client-Public-IP"] = public_ip
    
    # Empty body to trigger IP geolocation
    body = {}
    
    print("=" * 60)
    print("Testing Location Endpoint - IP Geolocation")
    print("=" * 60)
    
    if public_ip:
        print(f"Your Public IP: {public_ip}")
        print(f"Note: Sending public IP in X-Client-Public-IP header for Docker testing")
    else:
        print("Could not determine public IP")
    
    print(f"\nRequest URL: {url}")
    print(f"Request Method: PUT")
    print(f"Request Body: {json.dumps(body)}")
    print("\nSending request...")
    
    try:
        response = requests.put(url, headers=headers, json=body, timeout=10)
        
        print(f"\nResponse Status: {response.status_code}")
        print(f"Response Headers: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"\nResponse Body:")
            print(json.dumps(response_data, indent=2))
            
            if response.status_code == 200:
                print("\n✅ SUCCESS: Location updated via IP geolocation")
                if 'location' in response_data:
                    loc = response_data['location']
                    print(f"   Latitude: {loc.get('latitude')}")
                    print(f"   Longitude: {loc.get('longitude')}")
                    print(f"   Source: {loc.get('source')}")
            else:
                print(f"\n❌ ERROR: {response_data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            print(f"\nResponse Text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")

def test_location_with_gps():
    """Test location endpoint with GPS coordinates"""
    url = f"{BASE_URL}/api/profile/location"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {JWT_TOKEN}"
    }
    
    # GPS coordinates (New York City)
    body = {
        "latitude": 40.7128,
        "longitude": -74.0060
    }
    
    print("\n" + "=" * 60)
    print("Testing Location Endpoint - GPS Coordinates")
    print("=" * 60)
    print(f"\nRequest URL: {url}")
    print(f"Request Method: PUT")
    print(f"Request Body: {json.dumps(body)}")
    print("\nSending request...")
    
    try:
        response = requests.put(url, headers=headers, json=body, timeout=10)
        
        print(f"\nResponse Status: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"\nResponse Body:")
            print(json.dumps(response_data, indent=2))
            
            if response.status_code == 200:
                print("\n✅ SUCCESS: Location updated via GPS")
            else:
                print(f"\n❌ ERROR: {response_data.get('error', 'Unknown error')}")
                
        except json.JSONDecodeError:
            print(f"\nResponse Text: {response.text}")
            
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Request failed: {e}")

if __name__ == "__main__":
    import sys
    
    if JWT_TOKEN == "YOUR_JWT_TOKEN_HERE":
        print("⚠️  Please update JWT_TOKEN in the script with your actual token")
        print("   You can get it by logging in: POST /api/auth/login")
        sys.exit(1)
    
    # Test IP geolocation (empty body)
    test_location_with_ip()
    
    # Test GPS coordinates
    test_location_with_gps()
    
    print("\n" + "=" * 60)
    print("Testing Complete")
    print("=" * 60)

