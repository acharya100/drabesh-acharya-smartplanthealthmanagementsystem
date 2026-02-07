
import requests
import json
import os

BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
DISEASES_URL = f"{BASE_URL}/diseases/"

# Credentials
CREDENTIALS = {
    "username": "drabesh@gmail.com",
    "password": "superuser"
}

def verify():
    # 1. Login
    print(f"Logging in...")
    try:
        response = requests.post(LOGIN_URL, json=CREDENTIALS)
        token = response.json().get('access')
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. List Diseases to get an ID
        print("Fetching disease list...")
        response = requests.get(DISEASES_URL, headers=headers)
        results = response.json().get('results', [])
        
        if not results:
            print("No diseases found.")
            return

        target_disease = next((d for d in results if "Black Rot" in d['name']), results[0])
        print(f"Checking details for: {target_disease['name']} (ID: {target_disease['id']})")
        
        # 3. Get Details
        detail_url = f"{DISEASES_URL}{target_disease['id']}/"
        response = requests.get(detail_url, headers=headers)
        data = response.json()
        
        print("\n--- API Reference ---")
        print(f"Symptoms: {data.get('symptoms', 'MISSING')[:100]}...")
        print(f"Causes: {data.get('causes', 'MISSING')[:100]}...")
        
        plants = data.get('affected_plants', [])
        print(f"Affected Plants ({len(plants)}):")
        for p in plants:
            print(f" - {p.get('name', 'Should have name')} (Type: {type(p)})")
            
        if isinstance(plants, list) and len(plants) > 0 and isinstance(plants[0], dict):
             print("\n✅ Data structure is correct (List of Objects)")
        else:
             print("\n❌ Data structure invalid or empty")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    verify()
