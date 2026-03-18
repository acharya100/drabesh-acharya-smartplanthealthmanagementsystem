import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Category, Product

def run():
    print("Seeding Ecommerce Categories and Products...")
    
    # 1. Categories
    categories_data = [
        {'name': 'Organic Fertilizers', 'slug': 'organic-fertilizers', 'description': 'Natural solutions for soil health'},
        {'name': 'Bio-Pesticides', 'slug': 'bio-pesticides', 'description': 'Safe pest control for your plants'},
        {'name': 'Fungicides', 'slug': 'fungicides', 'description': 'Treatment for fungal diseases'},
        {'name': 'Gardening Tools', 'slug': 'gardening-tools', 'description': 'Essential tools for every gardener'}
    ]
    
    categories = {}
    for cat_data in categories_data:
        cat, created = Category.objects.get_or_create(
            slug=cat_data['slug'],
            defaults={'name': cat_data['name'], 'description': cat_data['description']}
        )
        categories[cat_data['slug']] = cat
        if created:
            print(f"Created category: {cat.name}")

    # 2. Products
    products_data = [
        {
            'category': 'organic-fertilizers',
            'name': 'Compressed Neem Cake',
            'description': 'Excellent organic fertilizer and natural pesticide for soil application.',
            'price': 450.00,
            'stock': 50
        },
        {
            'category': 'bio-pesticides',
            'name': 'Cold Pressed Neem Oil',
            'description': 'Pure organic neem oil for controlling aphids, whiteflies, and mites.',
            'price': 650.00,
            'stock': 100
        },
        {
            'category': 'fungicides',
            'name': 'Copper Fungicide Spray',
            'description': 'Effective against blight, leaf spot, and downy mildew.',
            'price': 850.00,
            'stock': 40
        },
        {
            'category': 'gardening-tools',
            'name': 'Professional Pruning Shears',
            'description': 'Sharp and durable shears for clean cuts to prevent disease spread.',
            'price': 1200.00,
            'stock': 25
        },
        {
            'category': 'bio-pesticides',
            'name': 'Liquid Seaweed Extract',
            'description': 'Boosts plant immunity and resistance to stress and diseases.',
            'price': 550.00,
            'stock': 75
        }
    ]

    for prod_data in products_data:
        cat = categories.get(prod_data['category'])
        if cat:
            prod, created = Product.objects.get_or_create(
                name=prod_data['name'],
                defaults={
                    'category': cat,
                    'description': prod_data['description'],
                    'price': prod_data['price'],
                    'stock': prod_data['stock']
                }
            )
            if created:
                print(f"Created product: {prod.name}")
            else:
                # Update existing
                prod.price = prod_data['price']
                prod.stock = prod_data['stock']
                prod.save()
                print(f"Updated product: {prod.name}")

    print("\n✅ Ecommerce seeding finished successfully!")

if __name__ == '__main__':
    run()
