import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product

def update_product():
    try:
        # We target ID 12 which was "Pruning Shears" - 500.00
        p = Product.objects.get(id=12)
        p.name = "Organic Antifungal Sulfur Powder"
        p.name_ne = "जैविक फङ्गिसाइड सल्फर पाउडर"
        p.description = "A professional-grade organic sulfur powder that effectively controls Powdery Mildew, Rust, and Leaf Spot diseases. Safe and non-toxic for most crops."
        p.description_ne = "एक व्यावसायिक स्तरको जैविक सल्फर पाउडर जसले डढुवा (Powdery Mildew), रस्ट (Rust), र पातको थोप्ला (Leaf Spot) रोगहरूलाई प्रभावकारी रूपमा नियन्त्रण गर्दछ। धेरै बिरुवाहरूको लागि सुरक्षित र विषाक्त रहित।"
        p.price = 500.00
        p.is_organic = True
        p.image = "products/antifungal_sulfur_powder.png"
        p.usage_instructions = "Mix 2-3 grams per liter of water and spray thoroughly on affected leaves. Repeat every 7-10 days."
        p.usage_instructions_ne = "प्रति लिटर पानीमा २-३ ग्राम मिसाएर संक्रमित पातहरूमा राम्ररी छर्कनुहोस्। हरेक ७-१० दिनमा दोहोर्याउनुहोस्।"
        p.save()
        print(f"Successfully updated Product ID 12 to {p.name}")
    except Product.DoesNotExist:
        print("Product with ID 12 not found. Searching by name...")
        try:
            p = Product.objects.get(name="Pruning Shears", price=500.00)
            p.name = "Organic Antifungal Sulfur Powder"
            # (same fields as above)
            p.name_ne = "जैविक फङ्गिसाइड सल्फर पाउडर"
            p.description = "A professional-grade organic sulfur powder that effectively controls Powdery Mildew, Rust, and Leaf Spot diseases. Safe and non-toxic for most crops."
            p.description_ne = "एक व्यावसायिक स्तरको जैविक सल्फर पाउडर जसले डढुवा (Powdery Mildew), रस्ट (Rust), र पातको थोप्ला (Leaf Spot) रोगहरूलाई प्रभावकारी रूपमा नियन्त्रण गर्दछ। धेरै बिरुवाहरूको लागि सुरक्षित र विषाक्त रहित।"
            p.image = "products/antifungal_sulfur_powder.png"
            p.price = 500.00
            p.is_organic = True
            p.save()
            print(f"Successfully updated Pruning Shears to {p.name}")
        except Product.DoesNotExist:
            print("Could not find product to replace.")

if __name__ == "__main__":
    update_product()
