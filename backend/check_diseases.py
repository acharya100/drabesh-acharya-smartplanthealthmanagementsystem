
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Disease
from plants.models import Plant

def check_data():
    print("--- Checking Diseases ---")
    diseases = Disease.objects.all()
    for d in diseases:
        print(f"ID: {d.id} | Name: {d.name}")
        print(f"  Symptoms: {d.symptoms[:50]}..." if d.symptoms else "  Symptoms: EMPTY")
        print(f"  Causes: {d.causes[:50]}..." if d.causes else "  Causes: EMPTY")
        plants = list(d.affected_plants.all())
        plant_names = [p.name for p in plants]
        print(f"  Affected Plants: {plant_names}")
        print("-" * 20)

    print("\n--- Checking Users ---")
    from django.contrib.auth import get_user_model
    User = get_user_model()
    print(f"User count: {User.objects.count()}")

if __name__ == "__main__":
    check_data()
