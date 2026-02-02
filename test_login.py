import urllib.request
import urllib.error
import json

url = "http://localhost:8000/api/auth/login/"

def test_login(email_val, password):
    print(f"Testing login for: {email_val}")
    
    # Try with 'email' key
    payload = {"email": email_val, "password": password}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"SUCCESS with 'email' key! Status: {response.status}")
            print(response.read().decode('utf-8'))
            return
    except urllib.error.HTTPError as e:
        print(f"Failed with 'email' key. Status: {e.code}")
        print(e.read().decode('utf-8'))

    print("Retrying with 'username' key...")
    # Try with 'username' key
    payload = {"username": email_val, "password": password}
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        with urllib.request.urlopen(req) as response:
            print(f"SUCCESS with 'username' key! Status: {response.status}")
            print(response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"Failed with 'username' key. Status: {e.code}")
        print(e.read().decode('utf-8'))
    
    print("-" * 30)

print("--- Testing drabesh@gmail.com ---")
test_login("drabesh@gmail.com", "superuser")

print("\n--- Testing admin@example.com ---")
test_login("admin@example.com", "superuser")
