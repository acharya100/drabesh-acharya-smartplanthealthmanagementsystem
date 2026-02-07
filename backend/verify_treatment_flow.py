
import requests
import json

BASE_URL = "http://localhost:8000/api"
LOGIN_URL = f"{BASE_URL}/auth/login/"
PLANTS_URL = f"{BASE_URL}/plants/"
DISEASES_URL = f"{BASE_URL}/diseases/"
TREATMENTS_URL = f"{BASE_URL}/treatments/"

CREDENTIALS = {
    "username": "drabesh@gmail.com",
    "password": "superuser"
}

def verify():
    print("--- Verifying Treatment Flow ---")
    
    # 1. Login
    session = requests.Session()
    resp = session.post(LOGIN_URL, json=CREDENTIALS)
    if resp.status_code != 200:
        print("Login failed")
        return
    token = resp.json()['access']
    headers = {'Authorization': f'Bearer {token}'}
    
    # 2. Get Plants
    print("Fetching Global Plants...")
    resp = session.get(PLANTS_URL, headers=headers, params={'global': 'true'})
    plants = resp.json().get('results', [])
    if not plants:
        print("No plants found.")
        return
    
    target_plant = next((p for p in plants if "Apple" in p['name']), plants[0])
    print(f"Selected Plant: {target_plant['name']} (ID: {target_plant['id']})")
    
    # 3. Get Diseases for Plant
    print(f"Fetching diseases for plant ID {target_plant['id']}...")
    resp = session.get(f"{DISEASES_URL}?affected_plants={target_plant['id']}", headers=headers)
    diseases = resp.json().get('results', [])
    print(f"Found {len(diseases)} diseases.")
    
    if not diseases:
        print("No diseases found for this plant.")
        return
        
    target_disease = diseases[0]
    print(f"Selected Disease: {target_disease['name']} (ID: {target_disease['id']})")
    
    # 4. Get Disease Detail to find Treatment
    print("Fetching Disease Detail...")
    resp = session.get(f"{DISEASES_URL}{target_disease['id']}/", headers=headers)
    d_detail = resp.json()
    treatments = d_detail.get('treatments', [])
    
    if not treatments:
        print("No treatments linked to this disease.")
        return
        
    target_treatment_id = treatments[0]['id']
    print(f"Found Treatment ID: {target_treatment_id}")
    
    # 5. Get Treatment Detail
    print("Fetching Full Treatment Detail...")
    resp = session.get(f"{TREATMENTS_URL}{target_treatment_id}/", headers=headers)
    t_detail = resp.json()
    
    print("\n--- Treatment Details ---")
    print(f"Name: {t_detail.get('name')}")
    print(f"Instructions: {t_detail.get('instructions', 'MISSING')[:50]}...")
    print(f"Products: {t_detail.get('products_needed', 'MISSING')}")
    
    if t_detail.get('instructions'):
        print("\n✅ Verification Successful: Full treatment details available.")
    else:
        print("\n❌ Verification Failed: Instructions missing.")

if __name__ == "__main__":
    verify()
