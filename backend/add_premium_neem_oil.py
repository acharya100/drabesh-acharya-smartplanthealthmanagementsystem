import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Category, Product

def add_premium_neem_oil():
    # Ensure Category exists
    cat, _ = Category.objects.get_or_create(
        slug="pest-control",
        defaults={
            "name": "Pest Control",
            "description": "Biological and chemical solutions for plant pests.",
            "icon": "🛡️",
            "name_ne": "कीट नियन्त्रण",
            "description_ne": "बिरुवाका कीराहरूका लागि जैविक र रासायनिक समाधानहरू।"
        }
    )

    # Add the product
    product, created = Product.objects.update_or_create(
        sku="PRM-NEEM-600",
        defaults={
            "category": cat,
            "name": "Premium Neem Oil Extract",
            "name_ne": "प्रिमियम निम तेल",
            "description": "Professional-grade organic cold-pressed neem oil for broad-spectrum pest control. Highly effective against aphids, mites, and whiteflies.",
            "description_ne": "व्यापक-स्पेक्ट्रम कीट नियन्त्रणको लागि व्यावसायिक-ग्रेड जैविक चिसो-थिचेको निम तेल। एफिड्स, माइट्स र सेता झिँगाहरू विरुद्ध अत्यधिक प्रभावकारी।",
            "price": 600.00,
            "stock": 50,
            "is_active": True,
            "is_featured": True,
            "is_organic": True,
            "image": "products/neem_oil_extract_premium.png",
            "tags": "bestseller,premium,organic",
            "usage_instructions": "Mix 5ml per liter of water. Spray on leaves every 7-14 days.",
            "usage_instructions_ne": "प्रति लिटर पानीमा ५ मि.लि मिसाउनुहोस्। हरेक ७-१४ दिनमा पातहरूमा छर्कनुहोस्।"
        }
    )

    if created:
        print(f"Product '{product.name}' created successfully at Rs. 600.")
    else:
        print(f"Product '{product.name}' updated successfully.")

if __name__ == "__main__":
    add_premium_neem_oil()
