
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Disease, Treatment

TREATMENT_DATA = [
    {
        "disease_name": "Apple Black Rot",
        "name": "Fungicide & Sanitation Protocol",
        "type": "chemical",
        "description": "Comprehensive approach combining sanitation with fungicide application to control Black Rot.",
        "instructions": "1. Remove and destroy all mummified fruit from the tree and ground during winter.\n2. Prune out dead or infected wood/cankers.\n3. Apply Captan or Myclobutanil fungicides starting at silver tip and continuing through harvest intervals.\n4. Ensure good air circulation.",
        "products": "Captan, Myclobutanil, Pruning Shears",
        "effectiveness": 85,
        "cost": "Medium",
        "is_preventive": False
    },
    {
        "disease_name": "Apple Scab",
        "name": "Spring Fungicide Program",
        "type": "chemical",
        "description": "Preventative fungicide schedule to protect new growth during wet spring weather.",
        "instructions": "1. Rake and burn fallen leaves in autumn to reduce spores.\n2. Apply fungicides (like Immunox or Captan) when tips of green leaves first appear.\n3. Repeat continually until rapid leaf growth stops.\n4. Plant resistant varieties if possible.",
        "products": "Immunox, Captan, Rake",
        "effectiveness": 90,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Apple Cedar Rust",
        "name": "Rust Prevention Spray",
        "type": "chemical",
        "description": "Targeted fungicide application during cedar spore release.",
        "instructions": "1. Remove nearby juniper/cedar trees if feasible.\n2. Apply Ferbam or Thiram fungicides at the 'pink' stage of blossom development.\n3. Repeat applications every 10-14 days until dry weather returns.",
        "products": "Ferbam, Thiram",
        "effectiveness": 80,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Cherry Powdery Mildew",
        "name": "Sulfur & Oil Treatment",
        "type": "organic",
        "description": "Organic control using sulfur or horticultural oils.",
        "instructions": "1. Apply wettable sulfur or neem oil at the first sign of white powder.\n2. Ensure thorough coverage of leaves.\n3. Prune to improve airflow and reduce humidity.\n4. Avoid overhead watering.",
        "products": "Wettable Sulfur, Neem Oil",
        "effectiveness": 75,
        "cost": "Low",
        "is_preventive": False
    },
    {
        "disease_name": "Corn Common Rust",
        "name": "Resist & Spray",
        "type": "chemical",
        "description": "Management via resistant hybrids and occasional fungicide.",
        "instructions": "1. Plant resistant corn hybrids (most effective).\n2. Monitor fields; if pustules appear early, apply fungicide containing azoxystrobin or pyraclostrobin.\n3. Rotate crops to reduce soil inoculate.",
        "products": "Azoxystrobin Fungicide",
        "effectiveness": 85,
        "cost": "High",
        "is_preventive": True
    },
    {
        "disease_name": "Corn Northern Leaf Blight",
        "name": "Blight Control System",
        "type": "chemical",
        "description": "Rotation and fungicide program for blight.",
        "instructions": "1. Till corn residue into the soil after harvest.\n2. Rotate with non-host crops (soybeans).\n3. Apply foliar fungicides (e.g., Propiconazole) if lesions appear before silking stage.",
        "products": "Propiconazole, Tillage Equipment",
        "effectiveness": 80,
        "cost": "High",
        "is_preventive": True
    },
     {
        "disease_name": "Grape Black Rot",
        "name": "Vineyard Sanitation",
        "type": "chemical",
        "description": "Crucial sanitation and protection program.",
        "instructions": "1. Remove all mummified berries from the vine.\n2. Prune out infected canes.\n3. Apply Mancozeb or Myclobutanil from early bud break through 4 weeks post-bloom.",
        "products": "Mancozeb, Myclobutanil",
        "effectiveness": 90,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Grape Esca",
        "name": "Trunk Disease Management",
        "type": "biological",
        "description": "Preventative wood protection.",
        "instructions": "1. Double disinfect pruning tools between vines.\n2. Apply wound sealant (e.g., pruning paint with fungicide) immediately after pruning.\n3. Remove and burn dead trunks.",
        "products": "Pruning Sealer, Disinfectant",
        "effectiveness": 60,
        "cost": "Low",
        "is_preventive": True
    },
    {
        "disease_name": "Grape Leaf Blight",
        "name": "Foliar Protection",
        "type": "chemical",
        "description": "Standard fungicide application.",
        "instructions": "1. Apply Copper-based fungicides or Mancozeb.\n2. Improve canopy management to allow air movement.\n3. Mulch under vines to bury overwintering spores.",
        "products": "Copper Fungicide, Mancozeb",
        "effectiveness": 80,
        "cost": "Medium",
        "is_preventive": False
    },
    {
        "disease_name": "Peach Bacterial Spot",
        "name": "Copper Defense",
        "type": "chemical",
        "description": "Bactericide application program.",
        "instructions": "1. Apply copper sprays during dormancy (late fall) and again at bud swell.\n2. Use Oxytetracycline (antibiotic) during bloom to shuck split.\n3. Maintain tree vigor but verify nitrogen levels are not too high.",
        "products": "Fixed Copper, Oxytetracycline",
        "effectiveness": 70,
        "cost": "High",
        "is_preventive": True
    },
    {
        "disease_name": "Pepper Bacterial Spot",
        "name": "Copper & sanitation",
        "type": "chemical",
        "description": "Standard bacterial spot control.",
        "instructions": "1. Use disease-free seeds/transplants.\n2. Apply fixed copper mixed with mancozeb weekly during wet weather.\n3. Avoid working in the field when plants are wet.\n4. Remove infected plant debris.",
        "products": "Fixed Copper, Mancozeb",
        "effectiveness": 75,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Potato Early Blight",
        "name": "Fungicide Rotation",
        "type": "chemical",
        "description": "Preventative fungicide application.",
        "instructions": "1. Apply Chlorothalonil or Mancozeb every 7-10 days.\n2. Ensure adequate nitrogen and phosphorus fertilization.\n3. Rotate crops for at least 3 years.",
        "products": "Chlorothalonil, Mancozeb, Fertilizer",
        "effectiveness": 85,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Potato Late Blight",
        "name": "Critical Blight Control",
        "type": "chemical",
        "description": "Aggressive fungicide program for a destructive disease.",
        "instructions": "1. Destroy all cull potatoes.\n2. Apply preventive fungicides (Chlorothalonil) regularly.\n3. If infection is found, use systemic fungicides (Metalaxyl) immediately.\n4. Kill vines 2 weeks before harvest.",
        "products": "Chlorothalonil, Metalaxyl (Ridomil)",
        "effectiveness": 95,
        "cost": "High",
        "is_preventive": True
    },
    {
        "disease_name": "Squash Powdery Mildew",
        "name": "Neem & Bicarb",
        "type": "organic",
        "description": "Organic control for mildew.",
        "instructions": "1. Create a mixture of 1 tbsp baking soda and 1/2 tsp liquid soap in 1 gallon water.\n2. Spray liberally on leaves every week.\n3. Alternatively, use Neem Oil.\n4. Remove severely infected leaves.",
        "products": "Baking Soda, Soap, Neem Oil",
        "effectiveness": 80,
        "cost": "Low",
        "is_preventive": False
     },
     {
        "disease_name": "Strawberry Leaf Scorch",
        "name": "Scorch Management",
        "type": "chemical",
        "description": "Fungicide and cultural control.",
        "instructions": "1. Renovate strawberry beds after harvest, mowing old leaves.\n2. Apply fungicides (Captan or Thiram) in early spring.\n3. Improve drainage and spacing.",
        "products": "Captan, Thiram",
        "effectiveness": 75,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Tomato Bacterial Spot",
        "name": "Copper Bactericide",
        "type": "chemical",
        "description": "Copper-based control for bacterial spot.",
        "instructions": "1. Spray with fixed copper + mancozeb every 10 days.\n2. Use drip irrigation to keep foliage dry.\n3. Wait 2 years before planting tomatoes in the same spot.",
        "products": "Fixed Copper, Mancozeb",
        "effectiveness": 70,
        "cost": "Medium",
        "is_preventive": True
    },
    {
        "disease_name": "Tomato Early Blight",
        "name": "Mulch & Fungicide",
        "type": "chemical",
        "description": "Standard blight control for tomatoes.",
        "instructions": "1. Apply mulch to prevent soil splashing.\n2. Remove lower leaves to increase airflow.\n3. Apply Chlorothalonil or Copper fungicides weekly.",
        "products": "Mulch, Chlorothalonil, Copper",
        "effectiveness": 85,
        "cost": "Low",
        "is_preventive": True
    },
    {
        "disease_name": "Tomato Late Blight",
        "name": "Late Blight Rescue",
        "type": "chemical",
        "description": "Emergency control for late blight.",
        "instructions": "1. Remove and bag infected plants immediately to stop spread.\n2. Apply Chlorothalonil preventatively if weather is cool/wet.\n3. Ensure plants are spaced well apart.",
        "products": "Chlorothalonil, Contractor Bags",
        "effectiveness": 60,
        "cost": "Low",
        "is_preventive": True
    },
    {
        "disease_name": "Tomato Leaf Mold",
        "name": "Humidity Control",
        "type": "organic",
        "description": "Cultural control focusing on environment.",
        "instructions": "1. Increase spacing and prune to lower humidity.\n2. Water only at the base of the plant.\n3. Apply copper sprays if severe.",
        "products": "Pruners, Copper Spray",
        "effectiveness": 80,
        "cost": "Low",
        "is_preventive": True
    },
    {
        "disease_name": "Tomato Septoria Leaf Spot",
        "name": "Septoria Defense",
        "type": "chemical",
        "description": "Foliar disease management.",
        "instructions": "1. Remove infected lower leaves.\n2. Apply fungicides (Chlorothalonil) every 7-10 days.\n3. Remove crop debris at end of season.",
        "products": "Chlorothalonil",
        "effectiveness": 85,
        "cost": "Medium",
        "is_preventive": False
    },
    {
        "disease_name": "Tomato Spider Mites",
        "name": "Mite Control",
        "type": "organic",
        "description": "Mechanical and oil-based control.",
        "instructions": "1. Spray plants with a strong stream of water to dislodge mites.\n2. Apply Neem oil or insecticidal soap to undersides of leaves.\n3. Repeat every 3-5 days until controlled.",
        "products": "Hose, Neem Oil, Insecticidal Soap",
        "effectiveness": 75,
        "cost": "Low",
        "is_preventive": False
    },
    {
        "disease_name": "Tomato Target Spot",
        "name": "Target Spot Fungicide",
        "type": "chemical",
        "description": "Fungicide treatment for target spot.",
        "instructions": "1. Improve air circulation by pruning.\n2. Apple fungicides such as Chlorothalonil or Azoxystrobin.\n3. Manage nitrogen levels (avoid lush growth).",
        "products": "Chlorothalonil, Azoxystrobin",
        "effectiveness": 80,
        "cost": "High",
        "is_preventive": False
    },
    {
        "disease_name": "Tomato Mosaic Virus",
        "name": "Virus Sanitation",
        "type": "organic",
        "description": "Strict sanitation protocols (No cure exists).",
        "instructions": "1. Remove and destroy infected plants immediately (do not compost).\n2. Wash hands with milk or soap after creating/smoking tobacco products.\n3. Disinfect tools with bleach solution.",
        "products": "Bleach, Milk (hand wash)",
        "effectiveness": 100,
        "cost": "Low",
        "is_preventive": True
    },
    {
        "disease_name": "Tomato Yellow Leaf Curl",
        "name": "Whitefly Control",
        "type": "organic",
        "description": "Vector control to stop virus spread.",
        "instructions": "1. Use yellow sticky traps to catch whiteflies.\n2. Spray with insecticidal soap or neem oil.\n3. Use reflective mulches to repel insects.\n4. Remove infected plants.",
        "products": "Yellow Sticky Traps, Neem Oil, Reflective Mulch",
        "effectiveness": 70,
        "cost": "Medium",
        "is_preventive": True
    }
]

def populate_treatments():
    print("--- Populating Treatments ---")
    count = 0
    for t_data in TREATMENT_DATA:
        # Find the disease
        diseases = Disease.objects.filter(name__icontains=t_data['disease_name'])
        
        if not diseases.exists():
            print(f"Skipping {t_data['disease_name']} - Disease not found")
            continue
            
        for disease in diseases:
            # Create or Update Treatment
            treatment, created = Treatment.objects.update_or_create(
                disease=disease,
                name=t_data['name'],
                defaults={
                    "treatment_type": t_data['type'],
                    "description": t_data['description'],
                    "instructions": t_data['instructions'],
                    "products_needed": t_data['products'],
                    "effectiveness_rate": t_data['effectiveness'],
                    "cost_estimate": t_data['cost'],
                    "is_preventive": t_data['is_preventive']
                }
            )
            print(f"{'Created' if created else 'Updated'} treatment for: {disease.name}")
            count += 1

    print(f"\nProcessed {count} treatments.")

if __name__ == "__main__":
    populate_treatments()
