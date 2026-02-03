import requests
import json

# Test login with the credentials
url = "http://localhost:8000/api/auth/login/"
credentials = {
    "username": "drabesh@gmail.com",
    "password": "superuser"
}

print(f"Testing login with: {credentials['username']}")
print(f"Sending POST request to: {url}")
print(f"Payload: {json.dumps(credentials, indent=2)}")
print("-" * 50)

try:
    response = requests.post(url, json=credentials)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    
    if response.status_code == 200:
        print("\n✅ LOGIN SUCCESSFUL!")
        print(f"Access Token: {response.json().get('access', 'N/A')[:50]}...")
    else:
        print("\n❌ LOGIN FAILED!")
        
except Exception as e:
    print(f"❌ Error: {e}")
