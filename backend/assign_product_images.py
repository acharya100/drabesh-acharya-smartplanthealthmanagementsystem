"""Assign unique images from 'C:\\Product images fyp' to each product."""
import os, sys, django, shutil

# Add current directory to sys.path to resolve internal apps
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product
from django.conf import settings

SRC_DIR = r"C:\Product images fyp"
DEST_DIR = os.path.join(settings.MEDIA_ROOT, 'products')
os.makedirs(DEST_DIR, exist_ok=True)

# Map product names to image filenames
IMAGE_MAP = {
    'Copper Fungicide Spray': 'copper_fungicide.png',
    'Liquid Seaweed Extract': 'seaweed_extract.png',
    'Copper Oxychloride 50% WP Fungicide': 'copper_oxychloride.png',
    'Smart Soil Moisture Meter': 'soil_moisture_meter.png',
    'Hybrid Tomato Seeds (F1)': 'tomato_seeds.png',
    'Cold Pressed Neem Oil': 'neem_oil.png',
    'Professional Pruning Shears': 'pruning_shears.png',
    'Premium NPK 19-19-19 Fertilizer': 'npk_fertilizer.png',
    'Compressed Neem Cake': 'neem_cake.png',
    'Organic Neem Cake': 'organic_neem_cake.png',
}

for product in Product.objects.all():
    img_file = IMAGE_MAP.get(product.name)
    if not img_file:
        # fallback: try to find any unused image
        print(f"  SKIP: No image mapping for '{product.name}'")
        continue
    
    src_path = os.path.join(SRC_DIR, img_file)
    if not os.path.exists(src_path):
        print(f"  MISSING: {src_path}")
        continue
    
    dest_path = os.path.join(DEST_DIR, img_file)
    shutil.copy2(src_path, dest_path)
    product.image = f"products/{img_file}"
    product.save()
    print(f"  OK: {product.name} -> products/{img_file}")

print(f"\nDone! Assigned images to products.")
