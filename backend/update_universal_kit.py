import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Category, Product

def update_universal_kit():
    # Ensure Category exists
    cat, _ = Category.objects.get_or_create(
        slug="care-kits",
        defaults={
            "name": "Care Kits",
            "description": "Essential bundles for comprehensive plant health.",
            "icon": "📦",
            "name_ne": "हेरचाह किटहरू",
            "description_ne": "बिरुवाको व्यापक स्वास्थ्यको लागि आवश्यक बन्डलहरू।"
        }
    )

    # Add/Update the product
    # Price set to Rs. 620
    product, created = Product.objects.update_or_create(
        sku="UNIV-KIT-620",
        defaults={
            "category": cat,
            "name": "Universal Plant Treatment Kit",
            "name_ne": "विश्वव्यापी बिरुवा उपचार किट",
            "description": "Professional all-in-one organic treatment kit for various diseases including fungal infections, pest attacks, and nutrient deficiencies. Includes specialized organic fertilizers and broad-spectrum pesticides.",
            "description_ne": "ढुसीको संक्रमण, कीराको आक्रमण, र पोषक तत्वको कमी लगायतका विभिन्न रोगहरूको लागि व्यावसायिक सबै-मा-एक जैविक उपचार किट। यसमा विशेष जैविक मल र व्यापक-स्पेक्ट्रम कीटनाशकहरू समावेश छन्।",
            "price": 620.00,
            "stock": 100,
            "is_active": True,
            "is_featured": True,
            "is_organic": True,
            "tags": "bestseller,universal,premium",
            "usage_instructions": "Follow the labels on individual bottles. Generally, mix 5-10ml per liter of water.",
            "usage_instructions_ne": "प्रत्येक बोतलको लेबलमा दिइएको निर्देशन पालना गर्नुहोस्। सामान्यतया, प्रति लिटर पानीमा ५-१० मिलि मिसाउनुहोस्।",
            "image": "products/universal_kit.png"
        }
    )
    
    print(f"Product '{product.name}' updated/created successfully at Rs. 620.")

if __name__ == "__main__":
    update_universal_kit()
