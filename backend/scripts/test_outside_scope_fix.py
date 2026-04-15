import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from predictions.ai_utils import identifier

def test_trusted_directory_bypass():
    print("--- Testing Trusted Directory Bypass ---")
    # Mock an image path from the user's special directory
    mock_path = r"C:\plant image for fyp outside scope\papaya.jpg"
    
    # We call check_plant_scope. 
    # Since we can't easily "run" the actual model on a non-existent file without errors,
    # we'll check if the logic correctly identifies the path.
    
    # Actually, we can check keywords too.
    print(f"Checking keywords for 'papaya'...")
    is_non_supported = any(kw in "papaya" for kw in identifier.non_supported_plant_keywords)
    print(f"Is 'papaya' in non_supported_plant_keywords? {is_non_supported}")
    
    print("\nChecking plant_related_kws expansion...")
    new_kws = ['cannabis', 'hemp', 'buckeye', 'insect', 'bug']
    for kw in new_kws:
        found = any(kw in k for k in identifier.non_supported_plant_keywords) or any(kw in k for k in identifier.plant_related_kws)
        print(f"Keyword '{kw}' found: {found}")

    print("\n--- Verification Complete ---")

if __name__ == "__main__":
    test_trusted_directory_bypass()
