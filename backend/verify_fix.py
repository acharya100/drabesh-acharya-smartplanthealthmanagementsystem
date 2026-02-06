
import requests
import json
import os

BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
IDENTIFY_URL = f"{BASE_URL}/predictions/identify/"

# Credentials
CREDENTIALS = {
    "username": "drabesh@gmail.com",
    "password": "superuser"
}

IMAGE_PATH = os.path.join(os.path.dirname(__file__), "media", "predictions", "images", "image_1.JPG")

def verify():
    # 1. Login
    print(f"Logging in as {CREDENTIALS['username']}...")
    try:
        response = requests.post(LOGIN_URL, json=CREDENTIALS)
        if response.status_code != 200:
            print(f"Login failed: {response.text}")
            return
        
        token = response.json().get('access')
        print("Login successful. Token received.")
        
        # 2. Identify
        print(f"Sending identification request with {IMAGE_PATH}...")
        if not os.path.exists(IMAGE_PATH):
            print(f"Image not found at {IMAGE_PATH}")
            return

        headers = {
            "Authorization": f"Bearer {token}"
        }
        
        with open(IMAGE_PATH, 'rb') as img:
            files = {
                'image': img
            }
            response = requests.post(IDENTIFY_URL, headers=headers, files=files)
            
            print(f"Status Code: {response.status_code}")
            print("Response:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            
            if response.status_code == 200:
                print("\n✅ IDENTIFICATION SUCCESSFUL!")
            else:
                print("\n❌ IDENTIFICATION FAILED!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
