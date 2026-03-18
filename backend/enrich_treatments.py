import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Treatment, Disease
from ecommerce.models import Product

def run():
    print("Enriching Treatment Data with Professional Instructions and Product Links...")
    
    # Get some products to link
    neem_oil = Product.objects.filter(name__icontains='Neem Oil').first()
    neem_cake = Product.objects.filter(name__icontains='Neem Cake').first()
    fungicide = Product.objects.filter(name__icontains='Fungicide').first()
    shears = Product.objects.filter(name__icontains='Shears').first()
    seaweed = Product.objects.filter(name__icontains='Seaweed').first()

    # Define high-quality treatment data
    enrichment_data = [
        {
            'disease_name': 'Apple Scab',
            'treatment_name': 'Copper Fungicide Application',
            'instructions': "1. Prune affected branches using sterilized shears.\n2. Apply copper fungicide spray thoroughly covering all leaf surfaces.\n3. Repeat every 10-14 days during wet weather.\n4. Avoid overhead watering to keep foliage dry.",
            'products_needed': "Copper Fungicide, Professional Pruning Shears, Spray Bottle",
            'dosage_instructions': "Mix 2 tablespoons of concentrate per gallon of water.",
            'application_frequency': "Every 10-14 days until symptoms subside.",
            'related_products': [fungicide, shears]
        },
        {
            'disease_name': 'Cedar Apple Rust',
            'treatment_name': 'Organic Neem Control',
            'instructions': "1. Remove nearby cedar trees if possible, or remove rust galls in winter.\n2. Apply cold-pressed neem oil to apple trees at bud break.\n3. Ensure coverage of both upper and lower leaf surfaces.\n4. Apply during early morning or late evening to avoid leaf burn.",
            'products_needed': "Cold Pressed Neem Oil, Spray Bottle",
            'dosage_instructions': "Dilute 1 oz of neem oil in 1 gallon of water with a drop of soap.",
            'application_frequency': "Every 7-10 days throughout the spring.",
            'related_products': [neem_oil]
        },
        {
            'disease_name': 'Tomato Early Blight',
            'treatment_name': 'Neem and Soil Health',
            'instructions': "1. Remove bottom-most leaves to prevent soil-to-leaf transmission.\n2. Apply neem cake to the soil base to improve nutrient levels and suppress pathogens.\n3. Spray seaweed extract to boost plant immunity.\n4. Mulch around the base to keep soil from splashing on leaves.",
            'products_needed': "Compressed Neem Cake, Liquid Seaweed Extract, Mulch",
            'dosage_instructions': "Apply 200g of neem cake per plant. Mix 10ml seaweed extract in 1L water.",
            'application_frequency': "Neem cake once every 2 months. Seaweed spray every 15 days.",
            'related_products': [neem_cake, seaweed]
        },
        {
            'disease_name': 'Tomato Late Blight',
            'treatment_name': 'Intensive Fungicide Treatment',
            'instructions': "1. Immediately isolate and remove heavily infected plants.\n2. Apply copper fungicide to remaining healthy plants to prevent spread.\n3. Improve air circulation by spacing plants further apart.\n4. Maintain strict horizontal watering only.",
            'products_needed': "Copper Fungicide, Garden Stakes for support",
            'dosage_instructions': "Follow label specific for 'Late Blight' - usually 1:50 dilution.",
            'application_frequency': "Every 5-7 days during high humidity periods.",
            'related_products': [fungicide]
        },
        {
            'disease_name': 'Tomato Spider Mites',
            'treatment_name': 'Professional Mite Eradication',
            'instructions': "1. Mist the plant leaves heavily with water as mites thrive in dry conditions.\n2. Apply Neem Oil or Insecticidal Soap, ensuring coverage of the undersides of leaves.\n3. Introduce predatory mites (natural enemies) if the infestation is indoors.\n4. Remove and destroy heavily infested leaves to reduce population.",
            'products_needed': "Neem Oil, Spray Bottle, Insecticidal Soap",
            'dosage_instructions': "15ml Neem Oil per 1 Liter of water with 2 drops of mild soap.",
            'application_frequency': "Every 3-5 days for 2 weeks to break the life cycle.",
            'related_products': [neem_oil]
        },
        {
            'disease_name': 'Tomato Yellow Leaf Curl Virus',
            'treatment_name': 'Whitefly Management & Control',
            'instructions': "1. Use yellow sticky traps to monitor and catch whiteflies (vectors).\n2. Apply Neem Oil spray to the underside of leaves where whiteflies congregate.\n3. Protect young plants with fine mesh insect netting.\n4. Remove infected plants immediately to prevent the virus from spreading.",
            'products_needed': "Sticky Traps, Neem Oil, Fine Mesh Netting",
            'dosage_instructions': "Apply neem oil as per label. Spot treat congregating whiteflies.",
            'application_frequency': "Spray every 7 days; replace sticky traps once full.",
            'related_products': [neem_oil]
        },
        {
            'disease_name': 'Tomato Bacterial Spot',
            'treatment_name': 'Copper & Streptomycin Shield',
            'instructions': "1. Apply copper-based fungicide at the first sign of symptoms.\n2. Avoid overhead irrigation and work in the garden only when plants are dry.\n3. Remove and destroy crop debris after the season.\n4. Use healthy, disease-free certified seeds for future planting.",
            'products_needed': "Copper Fungicide, Garden Shears",
            'dosage_instructions': "Follow label specific for 'Bacterial Spot'.",
            'application_frequency': "Every 7-10 days during rainy periods.",
            'related_products': [fungicide, shears]
        },
        {
            'disease_name': 'Tomato Septoria Leaf Spot',
            'treatment_name': 'Cutting and Spraying Control',
            'instructions': "1. Remove the lowest infected leaves to prevent spores from splashing upward.\n2. Apply a chlorothalonil or copper-based fungicide thoroughly.\n3. Stake or cage plants to keep them off the ground and improve air flow.\n4. Mulch around the plants to create a barrier between soil spores and leaves.",
            'products_needed': "Chlorothalonil Fungicide, Mulch, Tomato Cages",
            'dosage_instructions': "Mix fungicide as per 'Septoria' label instructions.",
            'application_frequency': "Apply every 7-10 days throughout the growing season.",
            'related_products': [fungicide]
        },
        {
            'disease_name': 'Tomato Leaf Mold',
            'treatment_name': 'Ventilation and Humidity Control',
            'instructions': "1. Increase spacing between plants to improve air circulation.\n2. Use fans if in a greenhouse to reduce humidity below 85%.\n3. Apply calcium-rich sprays to strengthen cell walls.\n4. Prune excess foliage to allow more light and air to reach the center of the plant.",
            'products_needed': "Calcium Nitrate Spray, Pruning Shears",
            'dosage_instructions': "Apply calcium spray every 2 weeks.",
            'application_frequency': "Daily monitoring of humidity levels.",
            'related_products': [shears]
        },
        {
            'disease_name': 'Tomato Target Spot',
            'treatment_name': 'Targeted Fungicide Spray',
            'instructions': "1. Apply fungicides containing azoxystrobin or mancozeb.\n2. Ensure good coverage, especially on older leaves near the bottom.\n3. Remove and destroy all plant debris at the end of the season.\n4. Control weeds around the tomato patch which may harbor the pathogen.",
            'products_needed': "Azoxystrobin Fungicide, Weed Puller",
            'dosage_instructions': "Apply 5ml per Liter of water.",
            'application_frequency': "Every 10-14 days.",
            'related_products': [fungicide]
        },
        {
            'disease_name': 'Potato Early Blight',
            'treatment_name': 'Potato Foliar Defense',
            'instructions': "1. Apply fungicides early in the season before the canopy closes.\n2. Rotate crops with non-solanaceous plants (avoid tomatoes/peppers in the same spot).\n3. Use adequate fertilization (especially nitrogen) to keep plants vigorous.\n4. Harvest only when vines are completely dead to prevent tuber infection.",
            'products_needed': "General Purpose Fungicide, High-Nitrogen Fertilizer",
            'dosage_instructions': "Follow label for Potato Early Blight.",
            'application_frequency': "Every 10 days starting from mid-summer.",
            'related_products': [fungicide]
        }
    ]

    for data in enrichment_data:
        diseases = Disease.objects.filter(name__icontains=data['disease_name'])
        if not diseases.exists():
            print(f"Skipping enrichment for {data['disease_name']} (Disease not found)")
            continue
        
        for disease in diseases:
            treatment, created = Treatment.objects.get_or_create(
                disease=disease,
                name=data['treatment_name'],
                defaults={
                    'instructions': data['instructions'],
                    'products_needed': data['products_needed'],
                    'dosage_instructions': data['dosage_instructions'],
                    'application_frequency': data['application_frequency'],
                    'treatment_type': 'organic' if 'Neem' in data['treatment_name'] else 'chemical'
                }
            )
            
            # Update fields anyway if already existed
            treatment.instructions = data['instructions']
            treatment.products_needed = data['products_needed']
            treatment.dosage_instructions = data['dosage_instructions']
            treatment.application_frequency = data['application_frequency']
            treatment.save()
            
            # Add related products
            valid_products = [p for p in data['related_products'] if p]
            if valid_products:
                treatment.related_products.set(valid_products)
            
            status = "Created" if created else "Updated"
            print(f"{status} treatment: {treatment.name} for {disease.name}")

    print("\n✅ Treatment enrichment finished successfully!")

if __name__ == '__main__':
    run()
