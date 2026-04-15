import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from ecommerce.models import Product, DiseaseProductMapping

# 1. Define Product IDs based on our earlier exploration
# Map to descriptions/types for logic
PRODUCTS = {
    'copper_oxychloride': 8,   # Good for Bacterial Spot
    'copper_fungicide': 11,     # Good for Blights, Scabs, Rots
    'sulfur_powder': 12,        # Good for Mildews, Molds
    'neem_oil': 14,             # Good for Spider Mites / Pests
    'seaweed_extract': 5        # Good for Healthy plants (booster)
}

# 2. Disease classes from our dataset (39 classes)
# Format: List of tuples (pattern_match, product_key, notes)
MAPPING_RULES = [
    ('Bacterial_spot', 'copper_oxychloride', "Copper spray is the standardized treatment for bacterial infections."),
    ('Early_blight', 'copper_fungicide', "Protective fungicide application recommended."),
    ('Late_blight', 'copper_fungicide', "Systemic fungicide treatment for aggressive blight."),
    ('Apple_scab', 'copper_fungicide', "Apply copper spray during dormant and budding periods."),
    ('Black_rot', 'copper_fungicide', "Broad-spectrum fungicide to prevent fruit decay."),
    ('Cedar_apple_rust', 'copper_fungicide', "Preventive fungicide targeting rust spores."),
    ('Powdery_mildew', 'sulfur_powder', "Sulfur-based powder prevents mildew spread."),
    ('Leaf_Mold', 'sulfur_powder', "Antifungal powder is effective for high-humidity molds."),
    ('Leaf_blight', 'copper_fungicide', "Fungicidal spray helps control leaf spotting."),
    ('Esca', 'copper_fungicide', "Management of grapevine wood-decay fungi."),
    ('Cercospora_leaf_spot', 'copper_fungicide', "Regular fungicidal application for leaf spot control."),
    ('Common_rust', 'copper_fungicide', "Early detection and copper fungicide spray."),
    ('Northern_Leaf_Blight', 'copper_fungicide', "Fungicide targets the Exserohilum turcicum fungus."),
    ('Septoria_leaf_spot', 'copper_fungicide', "Essential for controlling Septoria spread in Solanaceae."),
    ('Spider_mites', 'neem_oil', "Organic neem oil acts as an effective miticide and repellent."),
    ('Target_Spot', 'copper_fungicide', "Regular copper-based sprays prevent lesion expansion."),
    ('Yellow_Leaf_Curl_Virus', 'neem_oil', "Control whitefly vectors using organic neem oil."),
    ('Tomato_mosaic_virus', 'neem_oil', "Prevention via pest control (aphids/vectors)."),
    ('Leaf_scorch', 'seaweed_extract', "Improves plant immunity and stress recovery."),
    ('healthy', 'seaweed_extract', "Maintain optimal vigor with organic growth stimulants.")
]

def populate_mappings():
    print("Starting Disease-Product Mapping population...")
    
    # Get the 39 classes from ai_utils (standardized names)
    from predictions.ai_utils import PLANT_VILLAGE_CLASSES
    
    count = 0
    for class_name in PLANT_VILLAGE_CLASSES:
        if class_name == 'Background_without_leaves':
            continue
            
        # Parse canonical disease name (e.g. "Apple Scab")
        parts = class_name.split('___')
        plant_raw = parts[0].replace('_', ' ').replace(',', '').strip()
        disease_raw = parts[1].replace('_', ' ').strip()
        
        # Canonical display name used in the system
        # (Must match what detector.predict returns)
        is_healthy = 'healthy' in disease_raw.lower()
        if is_healthy:
            display_name = f"{plant_raw.title()} Healthy"
        else:
            display_name = f"{plant_raw.title()} {disease_raw.title()}"
            
        # Match rule
        matched_rule = None
        for pattern, product_key, notes in MAPPING_RULES:
            if pattern.lower() in class_name.lower():
                matched_rule = (product_key, notes)
                break
        
        if matched_rule:
            product_id, notes = PRODUCTS[matched_rule[0]], matched_rule[1]
            try:
                product = Product.objects.get(id=product_id)
                mapping, created = DiseaseProductMapping.objects.get_or_create(
                    disease_name=display_name,
                    defaults={'product': product, 'notes': notes}
                )
                if created:
                    print(f" [+] Linked: {display_name} -> {product.name}")
                    count += 1
                else:
                    # Update existing
                    mapping.product = product
                    mapping.notes = notes
                    mapping.save()
                    count += 1
            except Product.DoesNotExist:
                print(f" [!] Error: Product ID {product_id} not found for {display_name}")
        else:
            print(f" [?] No rule for: {display_name}")

    print(f"Finished! Processed {count} mappings.")

if __name__ == '__main__':
    populate_mappings()
