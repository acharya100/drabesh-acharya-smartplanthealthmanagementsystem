import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Category, Product
from django.utils.text import slugify

def seed_ecommerce():
    print("Seeding ecommerce data...")

    # Categories
    categories_data = [
        {"name": "Fertilizers & Nutrients", "description": "High-quality fertilizers to boost plant growth."},
        {"name": "Pesticides & Fungicides", "description": "Protect your plants from diseases and pests."},
        {"name": "Tools & Equipment", "description": "Professional gardening tools."},
        {"name": "Seeds & Bulbs", "description": "Premium seeds for your garden."},
    ]

    categories = {}
    for cat_data in categories_data:
        cat, created = Category.objects.get_or_create(
            name=cat_data["name"],
            defaults={"description": cat_data["description"]}
        )
        if created:
            cat.slug = slugify(cat.name)
            cat.save()
        categories[cat.name] = cat
        print(f"Created category: {cat.name}")

    # Products
    products_data = [
        {
            "category": categories["Fertilizers & Nutrients"],
            "name": "Premium NPK 19-19-19 Fertilizer",
            "description": "A balanced, water-soluble fertilizer ideal for all stages of plant growth. Enhances root development, flowering, and fruiting.",
            "price": 850.00,
            "stock": 150,
        },
        {
            "category": categories["Fertilizers & Nutrients"],
            "name": "Organic Neem Cake",
            "description": "100% organic manure that acts as an excellent soil conditioner and natural pesticide. Safe for organic farming.",
            "price": 450.00,
            "stock": 200,
        },
        {
            "category": categories["Pesticides & Fungicides"],
            "name": "Copper Oxychloride 50% WP Fungicide",
            "description": "Broad-spectrum fungicide effective against Early Blight, Late Blight, and Leaf Spot diseases.",
            "price": 750.00,
            "stock": 100,
        },
        {
            "category": categories["Tools & Equipment"],
            "name": "Professional Pruning Shears",
            "description": "Ergonomic, rust-resistant pruning shears for precise cutting. Features a safety lock and comfortable grip.",
            "price": 1200.00,
            "stock": 50,
        },
        {
            "category": categories["Tools & Equipment"],
            "name": "Smart Soil Moisture Meter",
            "description": "Accurately measures soil moisture, pH, and sunlight levels. Essential tool for preventing overwatering.",
            "price": 1500.00,
            "stock": 75,
        },
        {
            "category": categories["Seeds & Bulbs"],
            "name": "Hybrid Tomato Seeds (F1)",
            "description": "High-yielding, disease-resistant tomato seeds suitable for both greenhouse and open-field cultivation.",
            "price": 300.00,
            "stock": 500,
        }
    ]

    for prod_data in products_data:
        prod, created = Product.objects.get_or_create(
            name=prod_data["name"],
            defaults={
                "category": prod_data["category"],
                "description": prod_data["description"],
                "price": prod_data["price"],
                "stock": prod_data["stock"]
            }
        )
        print(f"{'Created' if created else 'Skipped'} product: {prod.name}")

    print("Seed complete!")

if __name__ == '__main__':
    seed_ecommerce()
