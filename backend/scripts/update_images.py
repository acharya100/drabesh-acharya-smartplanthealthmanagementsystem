import os
import sys
import django
from django.core.files import File

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product

IMAGE_DIR = r"C:\Product images fyp"

# Map product name substrings to image filenames
PRODUCT_IMAGE_MAP = {
    "Neem Cake": "neem_cake.png",
    "Neem Oil": "neem_oil.png",
    "NPK": "npk_fertilizer.png",
    "Pruning Shears": "pruning_shears.png",
    # Add more mappings for remaining products pointing to best-fit images
    "Copper Fungicide": "npk_fertilizer.png",
    "Seaweed": "neem_oil.png",
    "Copper Oxychloride": "npk_fertilizer.png",
    "Soil Moisture": "pruning_shears.png",
    "Tomato Seeds": "neem_cake.png",
}

def update_all_images():
    products = Product.objects.all()
    print(f"Found {products.count()} products in database.\n")

    for product in products:
        matched_file = None
        for keyword, filename in PRODUCT_IMAGE_MAP.items():
            if keyword.lower() in product.name.lower():
                matched_file = filename
                break

        if not matched_file:
            # Default fallback - use first available image
            matched_file = "neem_cake.png"

        img_path = os.path.join(IMAGE_DIR, matched_file)

        if not os.path.exists(img_path):
            print(f"  [SKIP] Image not found: {img_path}")
            continue

        try:
            with open(img_path, 'rb') as f:
                safe_name = product.name.replace(' ', '_').lower()[:40] + ".png"
                product.image.save(safe_name, File(f), save=True)
                print(f"  [OK] {product.name}  →  {matched_file}")
        except Exception as e:
            print(f"  [ERROR] {product.name}: {e}")

    print("\nDone!")

if __name__ == '__main__':
    update_all_images()
