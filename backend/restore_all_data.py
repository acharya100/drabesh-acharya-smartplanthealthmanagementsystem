import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from plants.models import Plant
from diseases.models import Disease

User = get_user_model()

# Get superuser
try:
    superuser = User.objects.filter(is_superuser=True).first()
    if not superuser:
        print("No superuser found!")
        exit(1)
    
    print(f"Using superuser: {superuser.email}")
    
    # 1. Create System Plants
    PLANTS = [
        {"name": "Apple", "scientific_name": "Malus domestica"},
        {"name": "Blueberry", "scientific_name": "Vaccinium corymbosum"},
        {"name": "Cherry", "scientific_name": "Prunus avium"},
        {"name": "Corn", "scientific_name": "Zea mays"},
        {"name": "Grape", "scientific_name": "Vitis vinifera"},
        {"name": "Orange", "scientific_name": "Citrus sinensis"},
        {"name": "Peach", "scientific_name": "Prunus persica"},
        {"name": "Pepper", "scientific_name": "Capsicum annuum"},
        {"name": "Potato", "scientific_name": "Solanum tuberosum"},
        {"name": "Raspberry", "scientific_name": "Rubus idaeus"},
        {"name": "Soybean", "scientific_name": "Glycine max"},
        {"name": "Squash", "scientific_name": "Cucurbita pepo"},
        {"name": "Strawberry", "scientific_name": "Fragaria × ananassa"},
        {"name": "Tomato", "scientific_name": "Solanum lycopersicum"},
    ]
    
    print("\n--- Creating Plants ---")
    plant_map = {}
    for plant_data in PLANTS:
        plant, created = Plant.objects.get_or_create(
            name=plant_data["name"],
            user=superuser,
            defaults={
                "scientific_name": plant_data["scientific_name"],
                "description": f"System plant: {plant_data['name']}",
            }
        )
        plant_map[plant_data["name"]] = plant
        print(f"{'Created' if created else 'Found'}: {plant.name}")
    
    # 2. Link Diseases to Plants
    DISEASE_PLANT_MAP = {
        "Apple Scab": ["Apple"],
        "Black Rot": ["Apple", "Grape"],
        "Cedar Apple Rust": ["Apple"],
        "Powdery Mildew": ["Apple", "Grape", "Cherry", "Peach"],
        "Cercospora Leaf Spot": ["Cherry"],
        "Common Rust": ["Corn"],
        "Northern Leaf Blight": ["Corn"],
        "Gray Leaf Spot": ["Corn"],
        "Black Measles": ["Grape"],
        "Leaf Blight": ["Grape"],
        "Haunglongbing": ["Orange"],
        "Bacterial Spot": ["Peach", "Pepper", "Tomato"],
        "Early Blight": ["Potato", "Tomato"],
        "Late Blight": ["Potato", "Tomato"],
        "Leaf Mold": ["Tomato"],
        "Septoria Leaf Spot": ["Tomato"],
        "Spider Mites": ["Tomato", "Strawberry"],
        "Target Spot": ["Tomato"],
        "Mosaic Virus": ["Tomato", "Pepper"],
        "Yellow Leaf Curl Virus": ["Tomato"],
    }
    
    print("\n--- Linking Diseases to Plants ---")
    for disease_name, plant_names in DISEASE_PLANT_MAP.items():
        try:
            disease = Disease.objects.get(name=disease_name)
            for plant_name in plant_names:
                if plant_name in plant_map:
                    disease.affected_plants.add(plant_map[plant_name])
            print(f"Linked {disease_name} to {len(plant_names)} plants")
        except Disease.DoesNotExist:
            print(f"Disease not found: {disease_name}")
    
    print("\n--- Summary ---")
    print(f"Total Plants: {Plant.objects.count()}")
    print(f"Total Diseases: {Disease.objects.count()}")
    
    # Verify a sample
    sample_disease = Disease.objects.filter(name="Apple Scab").first()
    if sample_disease:
        print(f"\nSample - {sample_disease.name} affects: {[p.name for p in sample_disease.affected_plants.all()]}")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
