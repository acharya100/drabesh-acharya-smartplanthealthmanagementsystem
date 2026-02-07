
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Disease
from plants.models import Plant

# Data Dictionary
# Keys match the 'name' field in Disease model (derived from PlantVillage classes usually)
DISEASE_DATA = [
    {
        "name_contains": "Apple Black Rot", 
        "scientific_name": "Botryosphaeria obtusa",
        "symptoms": "Leaf spots often start as small, purple specks that enlarge into circular, brown lesions with a purple margin. On fruit, firm, brown rot develops, often with concentric rings. The fruit eventually mummifies and stays on the tree.",
        "causes": "Caused by the fungus Botryosphaeria obtusa. The fungus overwinters in cankers on dead bark, dead twigs, and mummified fruit. Warm, moist weather favors infection.",
        "prevention": "Prune out dead wood and cankers during winter. Remove mummified fruit from the tree and ground. Ensure good air circulation by pruning. Apply fungicides if necessary during early growth stages.",
        "plant_name": "Apple"
    },
    {
        "name_contains": "Apple Scab",
        "scientific_name": "Venturia inaequalis",
        "symptoms": "Olive-green to black velvety spots appear on leaves and fruit. Leaves may turn yellow and drop early. Fruit becomes deformed and cracked.",
        "causes": "Fungal infection thriving in cool, wet springs. Spores spread from fallen leaves to new growth.",
        "prevention": "Rake up and destroy fallen leaves in autumn. Choose resistant apple varieties. Apply fungicides preventatively in early spring as buds break.",
        "plant_name": "Apple"
    },
    {
        "name_contains": "Apple Cedar Rust",
        "scientific_name": "Gymnosporangium juniperi-virginianae",
        "symptoms": "Bright orange-yellow spots on apple leaves, often with small black dots in the center. Similar spots may appear on fruit. Can cause early leaf drop.",
        "causes": "Fungal disease requiring two hosts: apple trees and Eastern red cedar (juniper). Spores travel from cedars to apples in spring wet weather.",
        "prevention": "Remove nearby cedar trees if possible. Apply fungicides at the 'pink' stage of blossom development. Plant resistant varieties.",
        "plant_name": "Apple"
    },
     {
        "name_contains": "Cherry Powdery Mildew",
        "scientific_name": "Podosphaera clandestina",
        "symptoms": "White, powdery fungal growth on leaves and shoots. New leaves may be distorted or stunted. Infected fruit can be scarred.",
        "causes": "Fungal spores spread by wind. Thrives in warm, dry days with cool, humid nights.",
        "prevention": "Prune to improve airflow. Avoid overhead watering. Apply sulfur or other fungicides at the first sign of infection.",
        "plant_name": "Cherry"
    },
    {
        "name_contains": "Corn Common Rust",
        "scientific_name": "Puccinia sorghi",
        "symptoms": "Oval to elongate, cinnamon-brown pustules on both leaf surfaces. Pustules rupture to release spores. Heavy infection causes yellowing and death of leaves.",
        "causes": "Fungus favored by cool temperatures and high humidity. Spores are often blown in from southern regions.",
        "prevention": "Plant resistant hybrids. Apply fungicides if infection is detected early and conditions favor spread. Rotate crops.",
        "plant_name": "Corn"
    },
    {
        "name_contains": "Corn Northern Leaf Blight",
        "scientific_name": "Exserohilum turcicum",
        "symptoms": "Long, cigar-shaped gray-green to tan lesions on leaves. Lesions can be several inches long. Heavy infection kills leaves, resembling frost damage.",
        "causes": "Fungus overwintering in corn residue. High humidity and moderate temperatures favor disease development.",
        "prevention": "Rotate crops. Till under crop residue to reduce inoculum. Plant resistant varieties. Apply fungicides if necessary.",
        "plant_name": "Corn"
    },
    {
        "name_contains": "Grape Black Rot",
        "scientific_name": "Guignardia bidwellii",
        "symptoms": "Reddish-brown spots on leaves. Fruit rots, turning into hard, black, shriveled mummies. Can destroy entire crop if untreated.",
        "causes": "Fungal infection favored by warm, humid weather. Spores splash from old berries and cankers to new growth.",
        "prevention": "Remove mummified berries and prune out infected canes. ensure good airflow. Apply fungicides from bud break through fruit set.",
        "plant_name": "Grape"
    },
    {
        "name_contains": "Grape Esca",
        "scientific_name": "Phaeomoniella chlamydospora",
        "symptoms": "'Tiger stripe' pattern on leaves (interveinal necrosis). Dark spotting on berries (measles). Sudden wilting and death of vines in severe cases.",
        "causes": "Complex of fungal pathogens infecting the wood. Often enters through pruning wounds.",
        "prevention": "Protect pruning wounds with sealants. Remove and burn infected vines. Double disinfecting pruning tools.",
        "plant_name": "Grape"
    },
    {
        "name_contains": "Grape Leaf Blight",
        "scientific_name": "Pseudocercospora vitis",
        "symptoms": "Irregular brown spots with dark borders on leaves. Can cause premature defoliation, weakening the vine.",
        "causes": "Fungal pathogen surviving on fallen leaves. Spread by rain splash and wind.",
        "prevention": "Manage canopy for air circulation. Apply fungicides. Remove leaf litter.",
        "plant_name": "Grape"
    },
    {
        "name_contains": "Peach Bacterial Spot",
        "scientific_name": "Xanthomonas campestris pv. pruni",
        "symptoms": "Small, water-soaked spots on leaves that turn brown and may drop out ('shot hole'). Fruit develops cracks and sunken lesions.",
        "causes": "Bacterial infection favored by warm, wet, and windy weather. Bacteria splash from cankers to leaves/fruit.",
        "prevention": "Plant resistant varieties. Maintain tree vigor with proper fertilization (avoid excess nitrogen). Copper sprays at leaf drop and bud break.",
        "plant_name": "Peach"
    },
    {
        "name_contains": "Pepper Bacterial Spot",
        "scientific_name": "Xanthomonas euvesicatoria",
        "symptoms": "Small, water-soaked spots on leaves that turn brown. Leaves turn yellow and drop. Raised, scab-like spots on fruit.",
        "causes": "Seed-borne or soil-borne bacteria. Spread by splashing water and handling wet plants.",
        "prevention": "Use disease-free seeds. Rotate crops. Mulch to reduce soil splash. Avoid working in wet fields. Copper sprays.",
        "plant_name": "Pepper"
    },
    {
        "name_contains": "Potato Early Blight",
        "scientific_name": "Alternaria solani",
        "symptoms": "Dark brown spots with concentric rings (target board effect) on older leaves. Leaves yellow and die. tubers can have sunken, dark lesions.",
        "causes": "Fungus persisting in soil and debris. Favored by alternating wet and dry conditions.",
        "prevention": "Rotate crops (3-4 years). Maintain plant vigor with proper nitrogen. Apply fungicides preventatively.",
        "plant_name": "Potato"
    },
     {
        "name_contains": "Potato Late Blight",
        "scientific_name": "Phytophthora infestans",
        "symptoms": "Large, dark, water-soaked spots on leaves, often with white mold on underside in humid weather. Entire plants can collapse rapidly. Tubers rot.",
        "causes": "Oomycete pathogen (the cause of the Irish Potato Famine). Thrives in cool, wet weather. Spreads rapidly by wind.",
        "prevention": "Plant certified disease-free seed potatoes. Destroy cull piles. Apply fungicides regularly in wet weather. Kill vines before harvest if infection is present.",
        "plant_name": "Potato"
    },
    {
        "name_contains": "Squash Powdery Mildew",
        "scientific_name": "Podosphaera xanthii",
        "symptoms": "White, powdery fungal growth on leaves and stems. Leaves may wither and die, exposing fruit to sunburn.",
        "causes": "Fungus favored by warm, dry conditions and high humidity in the canopy.",
        "prevention": "Plant resistant varieties. Space plants for airflow. Apply neem oil or sulfur at first sign.",
        "plant_name": "Squash"
    },
    {
        "name_contains": "Strawberry Leaf Scorch",
        "scientific_name": "Diplocarpon earliana",
        "symptoms": "Irregular purple blotches on leaves that coalesce, causing leaves to appear scorched and brown. Calyxes dry up.",
        "causes": "Fungus overwintering on infected leaves. Spread by rain splash.",
        "prevention": "Plant resistant varieties. Remove old leaves after harvest. Renovate beds periodically. Fungicides.",
        "plant_name": "Strawberry"
    },
    {
        "name_contains": "Tomato Bacterial Spot",
        "scientific_name": "Xanthomonas vesicatoria",
        "symptoms": "Small, dark, greasy spots on leaves. Leaves turn yellow and drop. Fruit spots are raised and scab-like.",
        "causes": "Seed-borne bacteria spread by rain and handling. Warm, moist weather favors outbreak.",
        "prevention": "Use disease-free seeds/transplants. Rotate crops. Copper sprays. Avoid overhead irrigation.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Early Blight",
        "scientific_name": "Alternaria solani",
        "symptoms": "Target-spot lesions on lower leaves first, with yellowing around them. Leaves drop, exposing fruit to sunscald. Stem cankers can occur.",
        "causes": "Soil-borne fungus splashing onto lower leaves. Stressed plants are more susceptible.",
        "prevention": "Mulch to prevent soil splash. Stake or cage tomatoes. Remove lower leaves. Fungicides.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Late Blight",
        "scientific_name": "Phytophthora infestans",
        "symptoms": "Large, dark, greasy spots on leaves/stems. White mold on undersides in wet weather. Fruit develops firm, dark, brown rot.",
        "causes": "Same pathogen as potato late blight. Cool, wet conditions are critical for spread.",
        "prevention": "Avoid planting near potatoes. Space plants well. Drip irrigation. Preventative fungicides.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Leaf Mold",
        "scientific_name": "Passalora fulva",
        "symptoms": "Pale yellow spots on upper leaf surface. Olive-green to brown velvety mold on the underside. Leaves wither and drop.",
        "causes": "Fungus favored by high humidity (often a greenhouse problem).",
        "prevention": "Improve air circulation. Stake plants. Reduce humidity. Resistant varieties.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Septoria Leaf Spot",
        "scientific_name": "Septoria lycopersici",
        "symptoms": "Numerous small, circular spots with dark borders and tan centers on lower leaves. Tiny black specks in centers. Leaves yellow and drop.",
        "causes": "Fungus splashing from soil debris. Wet weather promotes infection.",
        "prevention": "Remove crop debris. Mulch. Avoid overhead watering. Crop rotation. Fungicides.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Spider Mites",
        "scientific_name": "Tetranychus urticae",
        "symptoms": "Leaves look stippled (tiny yellow dots), turn bronze or yellow. Fine webbing may be visible on undersides. Plants lose vigor.",
        "causes": "Tiny arachnids sucking plant sap. Hot, dry weather favors rapid population growth.",
        "prevention": "Spray with strong stream of water to dislodge. Use insecticidal soap or neem oil. Encourage beneficial insects.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Target Spot",
        "scientific_name": "Corynespora cassiicola",
        "symptoms": "Brown to black spots with concentric rings on leaves and fruit. Fruit lesions are large and sunken.",
        "causes": "Fungus surviving in debris. Warm temperatures and high humidity.",
        "prevention": "Remove infected plant parts. Improve airflow. Fungicides.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Mosaic Virus",
        "scientific_name": "Tomato mosaic virus",
        "symptoms": "Mottled light and dark green pattern on leaves. Leaves may be fern-like or distorted. Fruit ripens unevenly with internal browning.",
        "causes": "Highly contagious virus. Spread by hands, tools, and smokers (tobacco mosaic virus is related).",
        "prevention": "Wash hands often. Disinfect tools. Remove infected plants immediately. Plant resistant varieties.",
        "plant_name": "Tomato"
    },
    {
        "name_contains": "Tomato Yellow Leaf Curl",
        "scientific_name": "Tomato yellow leaf curl virus",
        "symptoms": "Margins of leaves curl upward and turn yellow. New growth is stunted and bushy. Plants may drop flowers.",
        "causes": "Virus transmitted by whiteflies.",
        "prevention": "Control whiteflies with soaps/oils. Use reflective mulches. Remove infected plants. Resistant varieties.",
        "plant_name": "Tomato"
    }
]

def populate():
    print("Starting disease population...")
    
    # 1. Update Diseases
    updated_count = 0
    for data in DISEASE_DATA:
        # Find disease by partial name match since existing names might vary slightly
        # We use icontains
        diseases = Disease.objects.filter(name__icontains=data['name_contains'])
        
        if not diseases.exists():
            # Try stricter match or just skip if not found
            # Or try searching by 'Plant Name' + 'Disease Name' parts
            print(f"⚠️ Could not find disease matching '{data['name_contains']}'")
            continue
            
        for disease in diseases:
            print(f"Updating: {disease.name}")
            disease.scientific_name = data.get('scientific_name', disease.scientific_name)
            disease.symptoms = data.get('symptoms', disease.symptoms)
            disease.causes = data.get('causes', disease.causes)
            disease.prevention_measures = data.get('prevention', disease.prevention_measures)
            disease.save()
            updated_count += 1
            
            # 2. Link Plant
            plant_name = data['plant_name']
            menu_plant = Plant.objects.filter(name__icontains=plant_name).first()
            
            if not menu_plant:
                # If specific plant not found, try to find by that name in general
                # Ideally we should simulate finding the 'Apple' plant entity
                # If it doesn't exist, we might create a generic one or skip
                print(f"  Note: Plant '{plant_name}' not found in database to link.")
            else:
                # Check if already linked
                if not disease.affected_plants.filter(id=menu_plant.id).exists():
                    disease.affected_plants.add(menu_plant)
                    print(f"  Linked to plant: {menu_plant.name}")

    print(f"\nSuccessfully updated {updated_count} disease records.")

if __name__ == "__main__":
    populate()
