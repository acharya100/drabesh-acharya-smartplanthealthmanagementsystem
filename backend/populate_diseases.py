import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from plants.models import Plant
from diseases.models import Disease

# Dataset mapping based on the user's screenshot
DATASET = {
    "Apple": [
        ("Apple Scab", "Venturia inaequalis", "Olive-green or black velvety spots on leaves.", "critical"),
        ("Black Rot", "Botryosphaeria obtusa", "Purple spots on leaves, rotting fruit.", "severe"),
        ("Cedar Apple Rust", "Gymnosporangium juniperi-virginianae", "Bright orange-yellow spots on leaves.", "moderate"),
    ],
    "Blueberry": [], 
    "Cherry": [
        ("Powdery Mildew", "Podosphaera clandestina", "White powdery growth on leaves.", "moderate"),
    ],
    "Corn": [
        ("Cercospora Leaf Spot", "Cercospora zeae-maydis", "Gray-to-brown rectangular lesions on leaves.", "moderate"),
        ("Common Rust", "Puccinia sorghi", "Reddish-brown pustules on both leaf surfaces.", "moderate"),
        ("Northern Leaf Blight", "Exserohilum turcicum", "Long, elliptical, grayish-green lesions.", "severe"),
    ],
    "Grape": [
        ("Black Rot", "Guignardia bidwellii", "Reddish-brown spots on leaves, black shriveled fruit.", "severe"),
        ("Esca (Black Measles)", "Phaeomoniella chlamydospora", "Tiger-stripe pattern on leaves.", "severe"),
        ("Leaf Blight", "Pseudocercospora vitis", "Irregular brown spots on leaves.", "moderate"),
    ],
    "Orange": [
        ("Haunglongbing (Citrus Greening)", "Candidatus Liberibacter", "Yellow mottling on leaves, green fruit.", "critical"),
    ],
    "Peach": [
        ("Bacterial Spot", "Xanthomonas campestris", "Small angular water-soaked spots.", "moderate"),
    ],
    "Pepper Bell": [
        ("Bacterial Spot", "Xanthomonas campestris", "Small water-soaked spots turning brown.", "moderate"),
    ],
    "Potato": [
        ("Early Blight", "Alternaria solani", "Concentric rings (bullseye) on lower leaves.", "moderate"),
        ("Late Blight", "Phytophthora infestans", "Water-soaked lesions, white mold on undersides.", "critical"),
    ],
    "Squash": [
        ("Powdery Mildew", "Podosphaera xanthii", "White powdery spots on leaves and stems.", "moderate"),
    ],
    "Strawberry": [
        ("Leaf Scorch", "Diplocarpon earliana", "Purple spots with white centers.", "moderate"),
    ],
    "Tomato": [
        ("Bacterial Spot", "Xanthomonas spp.", "Small, dark, water-soaked spots.", "severe"),
        ("Early Blight", "Alternaria solani", "Concentric rings on lower leaves.", "moderate"),
        ("Late Blight", "Phytophthora infestans", "Greasy, irregular stains on leaves.", "critical"),
        ("Leaf Mold", "Passalora fulva", "Pale yellow spots on upper leaf surface.", "moderate"),
        ("Septoria Leaf Spot", "Septoria lycopersici", "Circular spots with dark borders.", "moderate"),
        ("Spider Mites", "Tetranychus urticae", "Yellow stippling on leaves, webbing.", "moderate"),
        ("Target Spot", "Corynespora cassiicola", "Bullseye-like lesions on leaves.", "moderate"),
        ("Mosaic Virus", "Tomato Mosaic Virus", "Mottled light and dark green leaves.", "severe"),
        ("Yellow Leaf Curl Virus", "TYLCV", "Yellowing and upward curling of leaves.", "critical"),
    ]
}

created_count = 0

for plant_name, diseases in DATASET.items():
    # Find the plant (case-insensitive)
    plant = Plant.objects.filter(name__icontains=plant_name).first()
    
    if not plant:
        print(f"Skipping {plant_name}: Plant not found in DB.")
        continue

    print(f"Processing {plant.name}...")
    
    for d_name, d_sci, d_sym, d_sev in diseases:
        # Simple check first
        existing = Disease.objects.filter(name=d_name).exists()
        
        if not existing:
            disease = Disease.objects.create(
                name=d_name,
                scientific_name=d_sci,
                symptoms=d_sym,
                severity_level=d_sev,
                description=f"A common disease affecting {plant.name}.",
                # No affected_plants here because it's ManyToMany
            )
            # Add relationship
            disease.affected_plants.add(plant)
            print(f"  + Created: {d_name}")
            created_count += 1
        else:
            # Maybe link it if not linked
            d_obj = Disease.objects.get(name=d_name)
            if plant not in d_obj.affected_plants.all():
                 d_obj.affected_plants.add(plant)
                 print(f"  . Linked existing {d_name} to {plant.name}")
            else:
                 print(f"  . Already exists: {d_name}")

print(f"\nDone. Added/Linked {created_count} diseases.")
