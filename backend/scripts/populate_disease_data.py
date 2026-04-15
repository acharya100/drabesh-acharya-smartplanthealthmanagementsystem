import os
import django
import sys

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Disease, Treatment
from plants.models import Plant

# Real-world diseases rewritten in very simple, basic English
DISEASE_DATA = {
    "Apple Scab": {
        "scientific_name": "Venturia inaequalis",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "You will see dark green or black soft spots on the leaves. The bad leaves will turn yellow and fall off early. The apples will also get dark, ugly spots.",
        "causes": "A fungus that hides in dead leaves on the ground and spreads with the rain in spring.",
        "prevention": "1. Collect and burn or throw away dead leaves.\n2. Cut branches so wind can pass easily.\n3. Plant types of apples that don't easily get sick.",
        "treatment_name": "Medicine Spray for Apple spots",
        "treatment_type": "chemical",
        "description": "Spray medicine in the spring to protect the apples from getting sick.",
        "instructions": "1. Spray the medicine (like Captan) when the flowers start to open.\n2. Do this again every week until the flower petals fall off.\n3. Make sure all sides of the leaves are covered.",
        "products_needed": "Fungicide Spray (Captan), Spray bottle",
        "effectiveness": 85,
        "is_preventive": True,
        "cost": "NPR 1500 - 3000"
    },
    "Apple Black Rot": {
        "scientific_name": "Botryosphaeria obtusa",
        "disease_type": "fungal",
        "severity": "severe",
        "symptoms": "Brown and black rotting spots on apples. The apples might turn fully black, dry up into hard balls, and stay on the tree. You may also see small purple spots on leaves.",
        "causes": "A fungus that enters the tree from cuts or dead branches.",
        "prevention": "1. Cut and remove any dead or sick branches.\n2. Pick up and throw away any dark, dry apples on the tree or ground.",
        "treatment_name": "Cleaning and Spraying for Black Rot",
        "treatment_type": "chemical",
        "description": "Removing sick parts and spraying medicine to stop the rot from spreading to other apples.",
        "instructions": "1. Cut away all dead branches in winter.\n2. Spray copper medicine when tiny leaves start coming out.\n3. Throw away any sick apples immediately.",
        "products_needed": "Cutting tools, Copper spray",
        "effectiveness": 75,
        "is_preventive": True,
        "cost": "NPR 2000 - 4500"
    },
    "Cedar Apple Rust": {
        "scientific_name": "Gymnosporangium juniperi-virginianae",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "Bright yellow or orange spots on top of the leaves. Small bump-like cups grow under the leaves. Leaves may fall off the tree very early.",
        "causes": "A rust fungus that spreads through the wind from cedar trees to apple trees.",
        "prevention": "1. Do not grow apple trees near cedar trees.\n2. Plant rust-safe apple trees.",
        "treatment_name": "Rust Protection Spray",
        "treatment_type": "chemical",
        "description": "Spraying medicine before the spots appear so the plant stays safe.",
        "instructions": "1. Spray medicine when the flower buds show a little pink color.\n2. Spray every week for about a month.\n3. Make sure the spray touches both the top and bottom of the leaves.",
        "products_needed": "Rust protecting spray, Sprayer",
        "effectiveness": 90,
        "is_preventive": True,
        "cost": "NPR 1200 - 2500"
    },
    "Bacterial Spot": {
        "scientific_name": "Xanthomonas",
        "disease_type": "bacterial",
        "severity": "severe",
        "symptoms": "Small, dark wet spots on the leaves with a yellow ring around them. The center of the spot might fall out, making a hole. Fruits might get rough, black scabs.",
        "causes": "Germs (bacteria) that spread mostly by splashing rain or wet farming tools.",
        "prevention": "1. Use healthy seeds and new soils.\n2. Do NOT touch or work with the plants when they are wet.\n3. Change where you plant vegetables every year.",
        "treatment_name": "Copper Protection Spray",
        "treatment_type": "chemical",
        "description": "Using a copper spray to stop the germs from spreading.",
        "instructions": "1. Spray copper medicine as soon as you see the spots.\n2. Spray every week during hot, wet weather.\n3. Remove and burn plants that are very sick so they don't infect others.",
        "products_needed": "Copper spray, Garden sprayer",
        "effectiveness": 60,
        "is_preventive": True,
        "cost": "NPR 800 - 1500"
    },
    "Cherry Powdery Mildew": {
        "scientific_name": "Podosphaera",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "White powder on the leaves and new stems. The leaves will roll up, twist, and fall. The fruits might get a white spider-web-like pattern on them.",
        "causes": "A fungus that likes hot, dry days and wet nights.",
        "prevention": "1. Cut branches so the plant gets enough air.\n2. Water the plant only at the roots, keep the leaves dry.\n3. Do not add too much fertilizer.",
        "treatment_name": "Organic Powder Control",
        "treatment_type": "organic",
        "description": "Using natural oil or powder to clean the white fungus off the plant.",
        "instructions": "1. At the first sign of white powder, spray Neem oil or sulfur dust.\n2. Remember to spray under the leaves too.\n3. Do this again after one or two weeks if needed.\n4. Do not spray sulfur when it is very hot, it will burn the plant.",
        "products_needed": "Neem oil or Sulfur dust",
        "effectiveness": 85,
        "is_preventive": False,
        "cost": "NPR 500 - 1200"
    },
    "Corn Cercospora Leaf Spot": {
        "scientific_name": "Cercospora zeae-maydis",
        "disease_type": "fungal",
        "severity": "severe",
        "symptoms": "Greyish-brown square spots that follow the lines of the leaf. These spots grow and kill the whole leaf, which makes the plant give less food.",
        "causes": "Fungus that sleeps in old dead field plants from last year, waking up in cloudy or wet weather.",
        "prevention": "1. Dig the old plant leftovers deep into the soil after harvest.\n2. Don't plant corn in the exact same field two years in a row.",
        "treatment_name": "Field Spraying",
        "treatment_type": "chemical",
        "description": "Spraying medicine to protect the main leaves so the corn cobs can grow big.",
        "instructions": "1. Check your fields closely just before the top flowers (tassels) appear.\n2. If you see spots spreading fast, spray the chemical medicine.\n3. If it rains a lot, you might need to spray again later.",
        "products_needed": "Farm fungus spray (Fungicide)",
        "effectiveness": 70,
        "is_preventive": False,
        "cost": "NPR 3000 - 6000"
    },
    "Common Rust": {
        "scientific_name": "Puccinia sorghi",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "Small red or brown bumps on both sides of the leaf. These bumps break open and release a red, dusty powder (like iron rust).",
        "causes": "Spores blown in from the wind. It grows faster when nights are cool and wet.",
        "prevention": "1. Plant rust-safe corn seeds.\n2. Leave enough space between plants so wind can dry the leaves.",
        "treatment_name": "Cleaning and Rust Control",
        "treatment_type": "cultural",
        "description": "Most of the time, keeping the plants dry and spaced out is enough to stop this.",
        "instructions": "1. Give your plants enough space to breathe.\n2. Only water in the morning so the plants are dry by night.\n3. If the rust gets very heavy, use a simple farm spray.",
        "products_needed": "Basic Fungicide spray (only if really bad)",
        "effectiveness": 75,
        "is_preventive": True,
        "cost": "NPR 1000 - 2500"
    },
    "Northern Leaf Blight": {
        "scientific_name": "Exserohilum turcicum",
        "disease_type": "fungal",
        "severity": "severe",
        "symptoms": "Long, cigar-shaped grey or brown spots. It starts from the bottom leaves and moves up. If it's bad, the whole leaf dries and dies.",
        "causes": "Sleeping fungus in soil dirt splashes onto bottom leaves during heavy rain.",
        "prevention": "1. Plant other crops for a year or two before planting corn again.\n2. Plow the field well to bury old roots.",
        "treatment_name": "Crop Saving Spray",
        "treatment_type": "chemical",
        "description": "Spraying medicine during the most important time when seeds are growing.",
        "instructions": "1. Spray the medicine just before the top flower (tassel) comes out.\n2. Target the spray mainly on the bottom leaves.\n3. Do not spray during the hottest part of the day.",
        "products_needed": "Strong Fungicide mix",
        "effectiveness": 80,
        "is_preventive": False,
        "cost": "NPR 3500 - 5500"
    },
    "Esca Black Measles": {
        "scientific_name": "Phaeomoniella chlamydospora",
        "disease_type": "fungal",
        "severity": "severe",
        "symptoms": "Leaves turn yellow or red between the veins looking like tiger stripes. Small grapes get dark black spots (measles). The inside of the wood turns brown and rots.",
        "causes": "Fungus entering the plant from old cuts made during winter pruning.",
        "prevention": "1. Wait as late as possible into winter before cutting branches.\n2. Use special paint to cover the cuts so fungus cannot enter.",
        "treatment_name": "Branch Cutting and Painting",
        "treatment_type": "cultural",
        "description": "Removing the sick wood and protecting fresh cuts from getting sick.",
        "instructions": "1. Mark the sick plants during summer.\n2. In winter, cut the main branch down until you see clean, white wood inside.\n3. Train a new young shoot to become the new main branch.\n4. Paint all cuts with special plant paste.",
        "products_needed": "Cutting shears, Plant wound paste, Tags",
        "effectiveness": 60,
        "is_preventive": True,
        "cost": "NPR 500 - 1500"
    },
    "Grape Leaf Blight": {
        "scientific_name": "Pseudocercospora vitis",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "Dark red or brown spots on leaves. Very sick leaves will fall off entirely, leaving the grapes open to burn in the sun.",
        "causes": "Fungus loves hot and wet weather, spreading from dead leaves on the ground.",
        "prevention": "1. Clean and burn all dead leaves from the ground in winter.\n2. Make sure the wind can pass through the grape bunches easily.",
        "treatment_name": "Spring Protection Spray",
        "treatment_type": "chemical",
        "description": "Simple spray early in the year to stop the disease before it starts.",
        "instructions": "1. Start spraying when the new green branches are about a finger's length.\n2. Use a standard copper spray.\n3. Make sure the spray reaches the leaves inside the bush.",
        "products_needed": "Copper spray",
        "effectiveness": 85,
        "is_preventive": True,
        "cost": "NPR 1500 - 3000"
    },
    "Potato Early Blight": {
        "scientific_name": "Alternaria solani",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "Dark brown or black spots on the lowest, oldest leaves. The spots look like targets with circles inside them. Leaves turn yellow and fall off.",
        "causes": "Fungus that lives in the soil and old plant dirt from previous crops.",
        "prevention": "1. Plant at a different place every year.\n2. Keep the top leaves dry when watering.\n3. Make sure the plant gets enough fertilizer.",
        "treatment_name": "Lower-Leaf Protection Spray",
        "treatment_type": "chemical",
        "description": "Spraying medicine to protect the old leaves from catching the disease.",
        "instructions": "1. Start spraying the medicine (like Copper) when plants are as tall as your hand.\n2. Spray every week, especially if it rains.\n3. Add compost to make the plant stronger.",
        "products_needed": "Copper spray or simple fungicide",
        "effectiveness": 75,
        "is_preventive": True,
        "cost": "NPR 1200 - 2800"
    },
    "Potato Late Blight": {
        "scientific_name": "Phytophthora infestans",
        "disease_type": "fungal",
        "severity": "critical",
        "symptoms": "Wet, light green or brown spots on leaves. During wet weather, white fuzz grows under the leaves. Can kill the whole farm very fast and rots the potatoes underground.",
        "causes": "A fast-moving water mold that spreads through rain, wind, and cool wet weather. The same disease caused the famous Irish Potato Famine.",
        "prevention": "1. Only plant clean, healthy seeds.\n2. Destroy all old or wild potatoes growing randomly.\n3. Put lots of soil on top of the potato bed to protect the root.",
        "treatment_name": "Emergency Blight Medicine",
        "treatment_type": "chemical",
        "description": "You must act fast to save your farm if this disease arrives.",
        "instructions": "1. If neighbors have this disease, start spraying medicine immediately.\n2. If you see white fuzz on a plant, immediately put a plastic bag over it, pull it up, and burn or bury it away from the farm.\n3. Spray all other plants twice a week.",
        "products_needed": "Strong fungicide warning sprays, Trash bags",
        "effectiveness": 50,
        "is_preventive": True,
        "cost": "NPR 3000 - 7000"
    },
    "Tomato Target Spot": {
        "scientific_name": "Corynespora cassiicola",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "Dark brown dots with a yellow circle. As they get bigger, they look like rings on a bullseye target. The stems and tomatoes might also get sunken brown holes.",
        "causes": "High humidity inside greenhouses or fields after heavy rains.",
        "prevention": "1. Tie tomatoes to wooden sticks to keep them lifted from the dirt.\n2. Water the soil directly, not the leaves.\n3. Cut bottom branches to let wind dry the soil.",
        "treatment_name": "Routine Farm Spraying",
        "treatment_type": "chemical",
        "description": "Simple chemical spray to keep the leaves clean and infection-free.",
        "instructions": "1. Spray standard farm medicine once a week.\n2. Remove the lowest leaves near the dirt so mud doesn't splash on them.",
        "products_needed": "Simple fungicide",
        "effectiveness": 80,
        "is_preventive": True,
        "cost": "NPR 1000 - 2500"
    },
    "Spider mites": {
        "scientific_name": "Tetranychus urticae",
        "disease_type": "pest",
        "severity": "moderate",
        "symptoms": "Tiny yellow or white dot patterns on the leaves. You might see very small spider webs under the leaves. The leaves turn fully yellow and dry out like paper and fall.",
        "causes": "Very tiny red or yellow spiders that suck juice from the plant. They multiply fast on hot, dry days.",
        "prevention": "1. Give your plants plenty of water on hot days.\n2. Spray water on the leaves to wash off the dust (spider mites hate water).",
        "treatment_name": "Oil Wash and Water Blast",
        "treatment_type": "organic",
        "description": "Using water to blast them off, and oil to stop them from coming back.",
        "instructions": "1. Shower your plant outside with a strong water hose to knock the mites away.\n2. Spray Neem oil heavily on the bottom of the leaves.\n3. You must repeat this every 3 days to break their egg cycle.",
        "products_needed": "Water hose, Neem oil",
        "effectiveness": 75,
        "is_preventive": False,
        "cost": "NPR 600 - 1500"
    },
    "Yellow Leaf Curl Virus": {
        "scientific_name": "Tomato yellow leaf curl virus",
        "disease_type": "viral",
        "severity": "critical",
        "symptoms": "The plant stops growing. Leaves curl upwards like a cup, turn pale yellow, and shrink. The plant will likely not make any tomatoes at all.",
        "causes": "A virus brought to the plant by a tiny white flying bug called a Whitefly.",
        "prevention": "1. Put silver plastic on the ground to blind and scare the whiteflies away.\n2. Use a mosquito net over young plants.",
        "treatment_name": "Infected Plant Removal",
        "treatment_type": "cultural",
        "description": "You cannot cure a virus. You must remove the sick plant so the bugs don't spread it to your healthy plants.",
        "instructions": "1. There is no medicine for this. Immediately uproot the sick plant.\n2. Put it in a trash bag and throw it far away. Do not put it in compost.\n3. Spray Neem oil or soap water to kill any whiteflies nearby.",
        "products_needed": "Trash bags, Neem oil for bugs",
        "effectiveness": 20,
        "is_preventive": False,
        "cost": "NPR 500 - 1000"
    },
    "Tomato mosaic virus": {
        "scientific_name": "Tomato mosaic virus",
        "disease_type": "viral",
        "severity": "severe",
        "symptoms": "Leaves have weird light green and dark green puzzle patterns. They might look twisted like ferns. Tomatoes ripen unevenly with brown parts inside.",
        "causes": "Touching a sick plant and then touching a healthy plant. The virus spreads easily on dirty hands or cutting tools.",
        "prevention": "1. Always wash your hands with soap before touching your plants.\n2. Clean your tools with bleach water.\n3. Do not smoke tobacco anywhere near tomatoes.",
        "treatment_name": "Clean Tools and Removal",
        "treatment_type": "cultural",
        "description": "Stopping the spread of the virus by throwing away the sick plant and cleaning everything.",
        "instructions": "1. Quickly pull out the plant by the roots and put it in a bag.\n2. Wash your hands thoroughly with strong soap.\n3. Do not plant a tomato in that exact same dirt next year.",
        "products_needed": "Soap, Bleach for tools, Trash bag",
        "effectiveness": 10,
        "is_preventive": True,
        "cost": "NPR 100 - 300"
    },
    "Leaf Mold": {
        "scientific_name": "Passalora fulva",
        "disease_type": "fungal",
        "severity": "moderate",
        "symptoms": "Older leaves get light green spots on top. If you turn the leaf over, there is an olive-green fuzzy mold patch. The leaves turn yellow, roll up, and die.",
        "causes": "Very high humidity (lots of water in the air) and zero wind getting to the plant.",
        "prevention": "1. Keep greenhouse doors open for wind.\n2. Leave plenty of space between your plants.",
        "treatment_name": "More Wind and Copper Spray",
        "treatment_type": "cultural",
        "description": "Giving the plant air to breathe so the mold dries up and dies.",
        "instructions": "1. Cut the bottom leaves off to let air flow across the bare dirt.\n2. Stop watering from the top; only pour water near the dirt.\n3. Add a copper spray to protect the healthy leaves on top.",
        "products_needed": "Cutting shears, Copper spray",
        "effectiveness": 85,
        "is_preventive": True,
        "cost": "NPR 1200 - 2500"
    },
    "Septoria leaf spot": {
        "scientific_name": "Septoria lycopersici",
        "disease_type": "fungal",
        "severity": "severe",
        "symptoms": "Many tiny circles with dark edges and pale centers. Inside the center, there are tiny black dots. The leaves turn yellow and drop from the bottom going up.",
        "causes": "Fungus in the dirt that splashes up onto the bottom leaves during rain.",
        "prevention": "1. Put dry leaves, straw, or plastic around the bottom of the plant to cover the dirt.\n2. Remove old tomato vines after the crop is finished.",
        "treatment_name": "Cutting and Spraying Control",
        "treatment_type": "chemical",
        "description": "Cutting off the bad parts and putting a protective cover on the good parts.",
        "instructions": "1. Search for the very bottom sick leaves and cut them off cleanly.\n2. Clean your scissors before the next cut.\n3. Spray copper or general medicine on the remaining nice leaves.",
        "products_needed": "Straw, Copper spray",
        "effectiveness": 75,
        "is_preventive": True,
        "cost": "NPR 1500 - 3500"
    },
    "Black Rot": {
        "scientific_name": "Botryosphaeria / Xanthomonas",
        "disease_type": "fungal",
        "severity": "severe",
        "symptoms": "Big V-shaped yellow fading spots on the edges of leaves. Heavy black or brown rotting on the vegetable or fruit making it bad to eat.",
        "causes": "Stays alive in leftover dead plants in the dirt from previous years.",
        "prevention": "1. Buy good, clean seeds from the store.\n2. Dig trenches to stop water from creating puddles.\n3. Pull out the wild weeds around the farm.",
        "treatment_name": "General Clean Up and Medicine",
        "treatment_type": "chemical",
        "description": "Using strong sprays and removing sick stuff to keep the farm healthy.",
        "instructions": "1. Tear off sick leaves as soon as you see them.\n2. Spray farm medicine (copper works best) lightly on the plants.\n3. Do not walk into the farm or touch plants while it is raining.",
        "products_needed": "Copper spray",
        "effectiveness": 65,
        "is_preventive": True,
        "cost": "NPR 1200 - 2800"
    }
}

def populate():
    diseases = Disease.objects.all()
    count = 0
    updates = 0
    trt_count = 0
    
    for disease in diseases:
        count += 1
        name = disease.name
        
        # We try to match the disease name in our dictionary
        matched_data = None
        for key in DISEASE_DATA:
            if key.lower() in name.lower() or name.lower() in key.lower():
                matched_data = DISEASE_DATA[key]
                break
                
        if matched_data:
            print(f"Updating precise data for {name} with simple language...")
            disease.scientific_name = matched_data['scientific_name']
            disease.disease_type = matched_data['disease_type']
            disease.severity_level = matched_data['severity']
            disease.symptoms = matched_data['symptoms']
            disease.causes = matched_data['causes']
            disease.prevention_measures = matched_data['prevention']
            disease.save()
            updates += 1
            
            # Check if treatment exists, if not create it
            trt, created = Treatment.objects.get_or_create(
                disease=disease,
                name=matched_data['treatment_name'],
                defaults={
                    'treatment_type': matched_data['treatment_type'],
                    'description': matched_data['description'],
                    'instructions': matched_data['instructions'],
                    'products_needed': matched_data['products_needed'],
                    'effectiveness_rate': matched_data['effectiveness'],
                    'is_preventive': matched_data['is_preventive'],
                    'cost_estimate': matched_data['cost'],
                    'expected_duration': '2-3 weeks'
                }
            )
            
            if not created:
                # Update existing
                trt.treatment_type = matched_data['treatment_type']
                trt.description = matched_data['description']
                trt.instructions = matched_data['instructions']
                trt.products_needed = matched_data['products_needed']
                trt.effectiveness_rate = matched_data['effectiveness']
                trt.is_preventive = matched_data['is_preventive']
                trt.cost_estimate = matched_data['cost']
                trt.save()
            
            trt_count += 1
        else:
            # Fallback for diseases not in dictionary
            print(f"Adding generic rich data for: {name} with simple language...")
            generic_symptoms = f"You will see strange colors on the leaves. The stem might die slowly, or there will be spots. It looks like the plant is tired, dropping its leaves, or getting sick."
            generic_prevention = "1. Make sure the plants are not too close to each other.\n2. Do not water over the top of the leaves, water the dirt.\n3. Always clean your gardening tools after cutting a sick plant.\n4. Avoid planting the same thing in the same spot next year."
            
            disease.symptoms = generic_symptoms
            disease.causes = "Bad weather and invisible germs spreading through the air, rainy water, or bugs."
            disease.prevention_measures = generic_prevention
            disease.save()
                
            trt, created = Treatment.objects.get_or_create(
                disease=disease,
                name=f"Basic Care for {name}",
                defaults={
                    'treatment_type': 'cultural',
                    'description': 'A simple way to keep the plant safe by giving it a clean area and healthy water habits.',
                    'instructions': "1. Slowly cut away the worst parts using clean scissors.\n2. Add water deep into the dirt; keeping leaves dry keeps the plant safe.\n3. Try to let the wind blow between the plants by giving them space.\n4. If it gets worse, spray natural Neem oil.\n5. Throw away all bad leaves into a bag, not the soil.",
                    'products_needed': 'Clean Scissors, Trash bags, Neem oil (maybe)',
                    'effectiveness_rate': 70,
                    'is_preventive': True,
                    'cost_estimate': 'NPR 800 - 1500',
                    'expected_duration': '3-4 weeks'
                }
            )
            if not created:
                trt.description = 'A simple way to keep the plant safe by giving it a clean area and healthy water habits.'
                trt.instructions = "1. Slowly cut away the worst parts using clean scissors.\n2. Add water deep into the dirt; keeping leaves dry keeps the plant safe.\n3. Try to let the wind blow between the plants by giving them space.\n4. If it gets worse, spray natural Neem oil.\n5. Throw away all bad leaves into a bag, not the soil."
                trt.products_needed = 'Clean Scissors, Trash bags, Neem oil (maybe)'
                trt.cost_estimate = 'NPR 800 - 1500'
                trt.effectiveness_rate = 70
                trt.save()
                
            trt_count += 1
            
    print(f"\nPopulation complete!")
    print(f"Total diseases processed: {count}")
    print(f"Diseases updated with simple language: {updates}")
    print(f"Treatments mapped or created: {trt_count}")

if __name__ == '__main__':
    populate()
