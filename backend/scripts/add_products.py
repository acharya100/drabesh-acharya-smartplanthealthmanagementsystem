import os
import django
from django.core.files import File
import shutil

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product, Category
from diseases.models import Treatment, Disease

def setup_new_products():
    print("Setting up new products...")
    
    # Get or create a category
    category, _ = Category.objects.get_or_create(
        name="Treatments & Pest Control",
        defaults={'description': 'Fungicides, pesticides, and other treatments.'}
    )
    
    # Define source images
    src_dir = r"C:\Product images fyp"
    copper_src = os.path.join(src_dir, "copper_fungicide.png")
    neem_src = os.path.join(src_dir, "neem_oil.png")
    
    # 1. Copper Fungicide (NPR 500)
    copper_product, created = Product.objects.get_or_create(
        name="Premium Copper Fungicide Spray",
        defaults={
            'description': 'Broad-spectrum fungicide effective against black rot, apple scab, and blights.',
            'price': 500.00,
            'stock': 40,
            'category': category
        }
    )
    if os.path.exists(copper_src):
        with open(copper_src, 'rb') as f:
            copper_product.image.save('copper_fungicide.png', File(f), save=True)
    copper_product.category = category
    copper_product.price = 500.00
    copper_product.save()
    
    # 2. Neem Oil (NPR 550)
    neem_product, created = Product.objects.get_or_create(
        name="Organic Neem Oil",
        defaults={
            'description': '100% cold-pressed organic neem oil for pest and fungi control.',
            'price': 550.00,
            'stock': 35,
            'category': category
        }
    )
    if os.path.exists(neem_src):
        with open(neem_src, 'rb') as f:
            neem_product.image.save('neem_oil.png', File(f), save=True)
    neem_product.category = category
    neem_product.price = 550.00
    neem_product.save()

    # Find Pruning Shears to replace
    try:
        pruning_shears = Product.objects.filter(name__icontains="Pruning").first()
        if pruning_shears:
            print("Found Pruning Shears. Removing from treatments and replacing with Neem Oil/Copper Fungicide...")
            for treatment in Treatment.objects.all():
                if pruning_shears in treatment.related_products.all():
                    treatment.related_products.remove(pruning_shears)
                    treatment.related_products.add(copper_product)
                    treatment.save()
                    print(f"Replaced products for treatment ID {treatment.id}")
        else:
            print("Pruning shears not found, skipping replacement.")
                
    except Exception as e:
        print("Error during pruning shears substitution:", e)

    print("Products successfully added/updated:")
    print(f"- {copper_product.name}: NPR {copper_product.price} (Category: {copper_product.category.name if copper_product.category else 'None'})")
    print(f"- {neem_product.name}: NPR {neem_product.price} (Category: {neem_product.category.name if neem_product.category else 'None'})")

if __name__ == '__main__':
    setup_new_products()
