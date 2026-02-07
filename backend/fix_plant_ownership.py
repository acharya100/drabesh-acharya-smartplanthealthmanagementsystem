import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from plants.models import Plant

User = get_user_model()
try:
    superuser = User.objects.get(email="drabesh@gmail.com")
except User.DoesNotExist:
    # Fallback/Debug
    superuser = User.objects.filter(is_superuser=True).first()
    print(f"drabesh@gmail.com not found, using first superuser: {superuser}")

if not superuser:
    print("No superuser found! Aborting.")
    exit(1)

# List of expected system plants
SYSTEM_PLANTS = [
    "Apple", "Blueberry", "Cherry", "Corn", "Grape", 
    "Peach", "Pepper", "Potato", "Raspberry", 
    "Soybean", "Squash", "Strawberry", "Tomato", "Paddy"
]

print(f"Assigning plants to {superuser.email}...")

updated_count = 0
for name in SYSTEM_PLANTS:
    # Search by case-insensitive name
    plants = Plant.objects.filter(name__icontains=name)
    if plants.exists():
        for plant in plants:
            if plant.user != superuser:
                plant.user = superuser
                plant.save()
                print(f"  Refreshed ownership for: {plant.name} (ID: {plant.id})")
                updated_count += 1
            else:
                print(f"  Already owned: {plant.name}")
    else:
        # Create if missing (ensure_plants logic simplified)
        print(f"  MISSING in DB: {name} - Creating now...")
        Plant.objects.create(
            user=superuser,
            name=name,
            scientific_name=f"{name} species",
            description=f"Standard {name} plant.",
            sunlight_requirement="full_sun",
            water_frequency="moderate",
            difficulty_level="medium"
        )
        updated_count += 1

print(f"Done. Updated/Created {updated_count} plants.")
print("Verifying count...")
print(f"Superuser now owns: {Plant.objects.filter(user=superuser).count()} plants.")
