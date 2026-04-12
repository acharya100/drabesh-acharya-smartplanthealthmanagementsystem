import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Disease, Treatment
from plants.models import Plant
from ecommerce.models import Product, Category
from django.contrib.auth import get_user_model

User = get_user_model()
admin_user = User.objects.filter(is_superuser=True).first() or User.objects.first()

# Ensure Apple Plant exists
apple_plant, _ = Plant.objects.get_or_create(
    name='Apple',
    defaults={'scientific_name': 'Malus domestica', 'sunlight_requirement': 'full_sun', 'watering_frequency': 'regular', 'user': admin_user}
)

cotton_plant, _ = Plant.objects.get_or_create(name='Cotton', defaults={'scientific_name': 'Gossypium', 'user': admin_user})
grapes_plant, _ = Plant.objects.get_or_create(name='Grapes', defaults={'scientific_name': 'Vitis', 'user': admin_user})

# Find the Apple Black Rot disease
abr = Disease.objects.filter(name__icontains='Apple Black Rot').first()
if abr:
    abr.affected_plants.add(apple_plant)
    
    # Check its treatment
    treatment = abr.treatments.first()
    if not treatment:
        treatment = Treatment.objects.create(
            disease=abr, name='Standard Black Rot Protocol', treatment_type='chemical',
            description='Control apple black rot through sanitation and chemical application.',
            instructions='1. Prune out dead branches.\n2. Apply fungicide.',
        )
    
    # Add Cutting tools, Copper spray to products_needed if missing
    if not treatment.products_needed:
        treatment.products_needed = 'Cutting tools, Copper spray'
    elif 'copper' not in treatment.products_needed.lower():
        treatment.products_needed += ', Cutting tools, Copper spray'
    treatment.save()
    
    # Give it an actual product
    cat, _ = Category.objects.get_or_create(name='Fungicides')
    prod1, _ = Product.objects.get_or_create(
        name='Premium Copper Fungicide Spray',
        defaults={'category': cat, 'description': 'Controls black rot on apple trees', 'price': 950.00, 'stock': 50}
    )
    prod2, _ = Product.objects.get_or_create(
        name='Pruning Shears',
        defaults={'category': cat, 'description': 'Professional cutting tools', 'price': 750.00, 'stock': 20}
    )
    treatment.related_products.add(prod1, prod2)

# Also ensure valid affected plants for other diseases so it's not empty
for d in Disease.objects.all():
    name = d.name.lower()
    if 'apple' in name: d.affected_plants.add(apple_plant)
    if 'cotton' in name: d.affected_plants.add(cotton_plant)
    if 'grape' in name: d.affected_plants.add(grapes_plant)

print("Database seeded with Commonly Affected Plants and Marketplace Products.")
