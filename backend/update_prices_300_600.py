"""Update all product prices to Rs 300-600 range and assign unique images."""
import os, sys, django, random, shutil

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product

# Price mapping for each product (realistic Nepal prices Rs 300-600)
price_map = {
    'Copper Fungicide Spray': 450,
    'Liquid Seaweed Extract': 380,
    'Copper Oxychloride 50% WP Fungicide': 520,
    'Smart Soil Moisture Meter': 590,
    'Hybrid Tomato Seeds (F1)': 320,
    'Cold Pressed Neem Oil': 480,
    'Professional Pruning Shears': 550,
    'Premium NPK 19-19-19 Fertilizer': 420,
    'Compressed Neem Cake': 350,
}

for product in Product.objects.all():
    old_price = product.price
    new_price = price_map.get(product.name, random.randint(300, 600))
    product.price = new_price
    # Clear discount if it's higher  
    if product.discount_price and float(product.discount_price) >= new_price:
        product.discount_price = None
    product.save()
    print(f"  {product.name}: Rs {old_price} -> Rs {new_price}")

print(f"\nDone! Updated {Product.objects.count()} products.")
