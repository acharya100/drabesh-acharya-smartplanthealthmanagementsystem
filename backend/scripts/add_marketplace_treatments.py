import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product, Category, DiseaseProductMapping
from diseases.models import Disease, Treatment

def run():
    print("Assigning 1 Marketplace Treatment Product to every Disease...")

    # Ensure a basic category exists
    category, _ = Category.objects.get_or_create(
        name="Treatments & Cures",
        defaults={
            "description": "Products to treat plant diseases",
            "slug": "treatments-and-cures"
        }
    )

    diseases = list(Disease.objects.all())
    count = 0

    for disease in diseases:
        # Check if a product mapping already exists
        if DiseaseProductMapping.objects.filter(disease_name__iexact=disease.name).exists():
            continue

        product_name = f"{disease.name} Control Solution"
        description = f"Specialized treatment for {disease.name} affecting various crops."

        # Create or get Product
        product, _ = Product.objects.get_or_create(
            name=product_name,
            defaults={
                "category": category,
                "description": description,
                "price": 450.00,
                "stock": 50,
                "is_active": True,
                "usage_instructions": "Apply evenly over affected areas once a week."
            }
        )

        # Map Product to Disease Name in Ecommerce
        DiseaseProductMapping.objects.get_or_create(
            disease_name=disease.name,
            product=product,
            defaults={"notes": "Standard recommendation"}
        )

        # Create a Treatment entry if none exists
        treatment = disease.treatments.first()
        if not treatment:
            treatment = Treatment.objects.create(
                disease=disease,
                name=f"Standard Treatment for {disease.name}",
                treatment_type='chemical',
                description=f"Using {product_name} to address {disease.name}.",
                instructions="1. Mix recommended dosage with water.\n2. Spray evenly on leaves.\n3. Repeat if symptoms persist.",
                is_preventive=False,
                cost_estimate="Medium"
            )
            print(f"Created Treatment for {disease.name}")

        # Link product to Treatment
        treatment.related_products.add(product)
        
        count += 1
        print(f"Added product '{product_name}' for disease '{disease.name}'")

    print(f"Completed! Added/Linked treatments for {count} diseases.")

if __name__ == '__main__':
    run()
