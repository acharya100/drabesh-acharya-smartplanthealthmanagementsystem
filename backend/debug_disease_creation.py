import os
import django
import traceback

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from plants.models import Plant
from diseases.models import Disease

try:
    plant = Plant.objects.filter(name__icontains="Apple").first()
    print(f"Found plant: {plant}")
    
    Disease.objects.update_or_create(
        plant=plant,
        name="Test Disease",
        defaults={
            'scientific_name': "Test Scientific",
            'symptoms': "Test Symptoms",
            'severity_level': "moderate"
        }
    )
    print("Success!")
except Exception:
    traceback.print_exc()
