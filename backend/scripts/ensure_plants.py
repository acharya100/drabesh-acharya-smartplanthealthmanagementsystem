
import os
import sys
import django

# Add the current directory to sys.path to resolve internal apps
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from plants.models import Plant

from django.contrib.auth import get_user_model

REQUIRED_PLANTS = [
    "Apple", "Cherry", "Blueberry", "Corn", "Grape", "Orange", 
    "Pepper Bell", "Peach", "Tomato", "Potato", "Raspberry", 
    "Strawberry", "Soybean", "Squash"
]

def ensure_plants():
    print("--- Ensuring Host Plants ---")
    User = get_user_model()
    # Try to find a superuser or  user we know
    user = User.objects.filter(is_superuser=True).first()
    if not user:
        user = User.objects.first()
    
    if not user:
        print("❌ No users found. Please create a user first.")
        return

    print(f"Assigning plants to user: {user.username} ({user.email})")

    created_count = 0
    for name in REQUIRED_PLANTS:
        plants = Plant.objects.filter(name=name)
        if plants.exists():
            plant = plants.first()
            if plant:
                print(f"Exists: {name} (ID: {plant.id})")
                if plants.count() > 1:
                    print(f"  Warning: Found {plants.count()} instances of {name}. Keeping ID {plant.id}")
        else:
            plant = Plant.objects.create(
                user=user,
                name=name,
                scientific_name=f"{name} sp.",
                description=f"Common {name} plant.",
                difficulty_level="intermediate",
                water_frequency="weekly",
                sunlight_requirement="full_sun"
            )
            print(f"Created: {name}")
            created_count += 1

    print(f"\nTotal new plants created: {created_count}")

if __name__ == "__main__":
    ensure_plants()
