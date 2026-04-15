import os
import django
import shutil
from decimal import Decimal
from django.utils.text import slugify

# Configure Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Category, Product, DiseaseProductMapping, Order, OrderItem
from diseases.models import Disease, Treatment
from plants.models import Plant
from django.core.files import File

# Configuration
IMAGE_SOURCE_DIR = r'C:\Product images fyp'
MEDIA_PRODUCTS_DIR = os.path.join('media', 'products')

# 1. Product Definitions
PRODUCTS_DATA = [
    {
        "name": "Bio-Active Copper Fungicide",
        "category": "Fungicides",
        "price": 580,
        "is_organic": False,
        "image": "copper_fungicide.png",
        "description": "Powerful copper-based liquid spray that effectively targets Apple Scab, Black Rot, and stubborn blights.",
        "powers": "Eradicates fungal spores, treats black spots and scabs.",
        "tags": "top-rated,fast-acting"
    },
    {
        "name": "Copper Oxychloride Advanced",
        "category": "Fungicides",
        "price": 595,
        "is_organic": False,
        "image": "copper_oxychloride.png",
        "description": "Professional-grade fungicide designed for heavy infections. Best used for Late Blight and Bacterial Spots.",
        "powers": "Advanced protection against potato and tomato blights.",
        "tags": "professional"
    },
    {
        "name": "Sulfur Dust (Organic Fungicide)",
        "category": "Fungicides",
        "price": 520,
        "is_organic": True,
        "image": "sulfur_dust.png",
        "description": "Natural sulfur powder for preventing powdery mildew and rust. Safe for organic gardening.",
        "powers": "Stops powdery mildew and rust cold.",
        "tags": "organic,preventive"
    },
    {
        "name": "Pure Neem Oil Spray",
        "category": "Bio-Control",
        "price": 550,
        "is_organic": True,
        "image": "neem_oil.png",
        "description": "Triple-action organic insecticide, fungicide, and miticide. Controls Spider Mites and Powdery Mildew.",
        "powers": "Kills mites and repels soft-bodied insects naturally.",
        "tags": "organic,bestseller"
    },
    {
        "name": "Premium Neem Cake",
        "category": "Bio-Control",
        "price": 510,
        "is_organic": True,
        "image": "organic_neem_cake.png",
        "description": "Organic soil additive that improves soil quality while repelling soil-borne pests.",
        "powers": "Purifies soil and strengthens root immunity.",
        "tags": "soil-health"
    },
    {
        "name": "Sticky Yellow Bug Traps",
        "category": "Bio-Control",
        "price": 505,
        "is_organic": True,
        "image": "sticky_traps.png",
        "description": "Bright yellow traps that attract and capture whiteflies, gnats, and leaf miners.",
        "powers": "Captures and monitors flying pests.",
        "tags": "passive-control"
    },
    {
        "name": "Vigor NPK fertilizer",
        "category": "Fertilizers & Nutrients",
        "price": 590,
        "is_organic": False,
        "image": "npk_fertilizer.png",
        "description": "Balanced Nitrogen, Phosphorus, and Potassium blend for explosive growth.",
        "powers": "Boosts growth and promotes flower development.",
        "tags": "growth-booster"
    },
    {
        "name": "Seaweed Immunity Booster",
        "category": "Fertilizers & Nutrients",
        "price": 575,
        "is_organic": True,
        "image": "seaweed_extract.png",
        "description": "Enriched with trace minerals to relieve plant stress and boost overall immunity.",
        "powers": "Restores vigor and relieves environmental stress.",
        "tags": "premium,organic"
    },
    {
        "name": "Organic Vermicompost Bag",
        "category": "Fertilizers & Nutrients",
        "price": 530,
        "is_organic": True,
        "image": "vermicompost.png",
        "description": "Rich organic compost produced by earthworms. High in microbial life and nutrients.",
        "powers": "Replenishes soil nutrients and carbon.",
        "tags": "organic"
    },
    {
        "name": "Magnesium Epsom Salt",
        "category": "Fertilizers & Nutrients",
        "price": 525,
        "is_organic": True,
        "image": "epsom_salt.png",
        "description": "Pharmaceutical grade Epsom salt for treating yellowing leaves caused by magnesium deficiency.",
        "powers": "Cures magnesium deficiency and green-ups leaves.",
        "tags": "specialized"
    },
    {
        "name": "Professional Pruning Shears",
        "category": "Tools & Equipment",
        "price": 599,
        "is_organic": False,
        "image": "pruning_shears.png",
        "description": "High-carbon steel shears for clean cuts. Essential for removing diseased branches.",
        "powers": "Precision cutting for surgery on infected plants.",
        "tags": "heavy-duty"
    },
    {
        "name": "Digital Soil Moisture Meter",
        "category": "Tools & Equipment",
        "price": 600,
        "is_organic": False,
        "image": "soil_moisture_meter.png",
        "description": "Accurate meter for measuring soil moisture, pH, and light intensity.",
        "powers": "Monitors moisture to prevent root Rot.",
        "tags": "smart-farming"
    },
    {
        "name": "Stainless Steel Hand Trowel",
        "category": "Tools & Equipment",
        "price": 540,
        "is_organic": False,
        "image": "hand_trowel.png",
        "description": "Ergonomic hand trowel for planting and transplanting.",
        "powers": "Reliable tool for soil preparation.",
        "tags": "essential"
    },
    {
        "name": "Pro Mist Sprayer Bottle",
        "category": "Tools & Equipment",
        "price": 560,
        "is_organic": False,
        "image": "mist_sprayer.png",
        "description": "Premium mist sprayer for applying neem oil or fertilizers to foliage.",
        "powers": "Perfect application of liquid treatments.",
        "tags": "application"
    },
    {
        "name": "Disease-Resistant Tomato Seeds",
        "category": "Seeds & Bulbs",
        "price": 515,
        "is_organic": True,
        "image": "tomato_seeds.png",
        "description": "Special hybrid seeds bred for resistance against Mosaic Virus and Yellow Leaf Curl.",
        "powers": "Genetic resistance to viral infections.",
        "tags": "resistant"
    }
]

# 2. Disease to Medicine Mapping
DISEASE_MAPPING = {
    "Apple Scab": ["Bio-Active Copper Fungicide", "Pro Mist Sprayer Bottle"],
    "Apple Black Rot": ["Bio-Active Copper Fungicide", "Professional Pruning Shears"],
    "Cedar Apple Rust": ["Sulfur Dust (Organic Fungicide)", "Bio-Active Copper Fungicide"],
    "Apple healthy": ["Seaweed Immunity Booster", "Organic Vermicompost Bag"],
    "Cherry Powdery Mildew": ["Pure Neem Oil Spray", "Pro Mist Sprayer Bottle"],
    "Cherry healthy": ["Vigor NPK fertilizer", "Seaweed Immunity Booster"],
    "Corn Cercospora Leaf Spot": ["Bio-Active Copper Fungicide", "Vigor NPK fertilizer"],
    "Corn Common Rust": ["Sulfur Dust (Organic Fungicide)", "Vigor NPK fertilizer"],
    "Corn Northern Leaf Blight": ["Copper Oxychloride Advanced", "Vigor NPK fertilizer"],
    "Grape Black Rot": ["Bio-Active Copper Fungicide", "Copper Oxychloride Advanced"],
    "Grape Esca (Black Measles)": ["Professional Pruning Shears"],
    "Grape Leaf Blight": ["Bio-Active Copper Fungicide", "Pure Neem Oil Spray"],
    "Orange Haunglongbing": ["Seaweed Immunity Booster", "Magnesium Epsom Salt"],
    "Peach Bacterial Spot": ["Copper Oxychloride Advanced", "Premium Neem Cake"],
    "Pepper Bacterial Spot": ["Copper Oxychloride Advanced", "Pure Neem Oil Spray"],
    "Potato Early Blight": ["Bio-Active Copper Fungicide", "Vigor NPK fertilizer"],
    "Potato Late Blight": ["Copper Oxychloride Advanced", "Digital Soil Moisture Meter"],
    "Squash Powdery Mildew": ["Pure Neem Oil Spray", "Sulfur Dust (Organic Fungicide)"],
    "Strawberry Leaf Scorch": ["Bio-Active Copper Fungicide", "Seaweed Immunity Booster"],
    "Tomato Bacterial Spot": ["Copper Oxychloride Advanced", "Pure Neem Oil Spray"],
    "Tomato Early Blight": ["Bio-Active Copper Fungicide", "Vigor NPK fertilizer"],
    "Tomato Late Blight": ["Copper Oxychloride Advanced", "Digital Soil Moisture Meter"],
    "Tomato Leaf Mold": ["Professional Pruning Shears", "Pure Neem Oil Spray"],
    "Tomato Septoria Leaf Spot": ["Bio-Active Copper Fungicide", "Premium Neem Cake"],
    "Tomato Spider Mites": ["Pure Neem Oil Spray", "Sticky Yellow Bug Traps"],
    "Tomato Target Spot": ["Bio-Active Copper Fungicide", "Vigor NPK fertilizer"],
    "Tomato Yellow Leaf Curl Virus": ["Disease-Resistant Tomato Seeds", "Sticky Yellow Bug Traps"],
    "Tomato Mosaic Virus": ["Disease-Resistant Tomato Seeds", "Professional Pruning Shears"]
}

def setup_marketplace():
    print("--- Starting Medicine Marketplace Overhaul ---")
    
    if not os.path.exists(MEDIA_PRODUCTS_DIR):
        os.makedirs(MEDIA_PRODUCTS_DIR)

    print("Cleaning old commerce data...")
    OrderItem.objects.all().delete()
    Order.objects.all().delete()
    DiseaseProductMapping.objects.all().delete()
    Product.objects.all().delete()
    Category.objects.all().delete()

    print("Creating Medicines and Tools...")
    product_objs = {}
    for i, p_data in enumerate(PRODUCTS_DATA):
        cat_name = p_data['category']
        cat_slug = slugify(cat_name)
        cat, _ = Category.objects.get_or_create(slug=cat_slug, defaults={'name': cat_name})
        
        src_image_path = os.path.join(IMAGE_SOURCE_DIR, p_data['image'])
        
        prod = Product.objects.create(
            category=cat,
            name=p_data['name'],
            description=p_data['description'],
            price=Decimal(p_data['price']),
            stock=100,
            is_active=True,
            is_organic=p_data['is_organic'],
            usage_instructions=f"Power: {p_data['powers']}",
            tags=p_data['tags'],
            sku=f"MED-{i+1001:04d}"
        )
        
        if os.path.exists(src_image_path):
            with open(src_image_path, 'rb') as f:
                prod.image.save(p_data['image'], File(f), save=True)
            print(f"  [+] Image assigned for {p_data['name']}")
        
        product_objs[p_data['name']] = prod
        print(f"  [+] Created {p_data['name']}")

    print("Updating Disease Treatment Protocols...")
    diseases = Disease.objects.all()
    
    for disease in diseases:
        matched_medicines = None
        for key in DISEASE_MAPPING:
            if key.lower() == disease.name.lower() or \
               key.lower().replace("___", " ") in disease.name.lower() or \
               disease.name.lower() in key.lower():
                matched_medicines = DISEASE_MAPPING[key]
                break
        
        if matched_medicines:
            print(f"  Mapping protocol for {disease.name}...")
            treatment = disease.treatments.first()
            if not treatment:
                treatment = Treatment.objects.create(
                    disease=disease,
                    name=f"Expert Protocol for {disease.name}",
                    description=f"Professional strategy to eliminate {disease.name} using specialized agriculture medicines.",
                    instructions="1. Identify early symptoms.\n2. Apply the recommended medicines strictly following the dosage.\n3. Monitor for recovery over 14 days."
                )
            
            treatment.related_products.clear()
            for med_name in matched_medicines:
                if med_name in product_objs:
                    treatment.related_products.add(product_objs[med_name])
                    DiseaseProductMapping.objects.get_or_create(
                        disease_name=disease.name,
                        product=product_objs[med_name],
                        defaults={'priority': 1, 'notes': f"Expert recommended solution for symptoms of {disease.name}."}
                    )
            
            treatment.products_needed = ", ".join(matched_medicines)
            treatment.save()

    print("\n--- Overhaul Complete! ---")
    print(f"Categories: {Category.objects.count()}")
    print(f"Products: {Product.objects.count()}")
    print(f"API Mappings: {DiseaseProductMapping.objects.count()}")

if __name__ == "__main__":
    setup_marketplace()
