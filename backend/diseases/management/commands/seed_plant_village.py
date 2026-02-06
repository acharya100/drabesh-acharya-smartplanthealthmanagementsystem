from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from plants.models import Plant
from diseases.models import Disease, Treatment
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Seeds the database with all 26 diseases from the PlantVillage dataset'

    def handle(self, *args, **options):
        self.stdout.write('Starting comprehensive disease seeding...')

        # 1. Ensure a default admin user exists to associate with plants if needed
        # (Though Plant model requires a user, we'll try to find any user)
        user = User.objects.first()
        if not user:
            user = User.objects.create_superuser('admin', 'admin@example.com', 'admin123')
            self.stdout.write("Created default admin user.")

        # 2. Host Plants Setup
        plant_definitions = [
            {'name': 'Apple', 'scientific_name': 'Malus domestica'},
            {'name': 'Cherry', 'scientific_name': 'Prunus avium'},
            {'name': 'Corn', 'scientific_name': 'Zea mays'},
            {'name': 'Grape', 'scientific_name': 'Vitis vinifera'},
            {'name': 'Orange', 'scientific_name': 'Citrus x sinensis'},
            {'name': 'Peach', 'scientific_name': 'Prunus persica'},
            {'name': 'Pepper, bell', 'scientific_name': 'Capsicum annuum'},
            {'name': 'Potato', 'scientific_name': 'Solanum tuberosum'},
            {'name': 'Squash', 'scientific_name': 'Cucurbita pepo'},
            {'name': 'Strawberry', 'scientific_name': 'Fragaria x ananassa'},
            {'name': 'Tomato', 'scientific_name': 'Solanum lycopersicum'},
            {'name': 'Blueberry', 'scientific_name': 'Vaccinium corymbosum'},
            {'name': 'Soybean', 'scientific_name': 'Glycine max'},
            {'name': 'Raspberry', 'scientific_name': 'Rubus idaeus'},
        ]

        plants = {}
        for p_def in plant_definitions:
            plant, created = Plant.objects.get_or_create(
                name=p_def['name'],
                user=user,
                defaults={'scientific_name': p_def['scientific_name']}
            )
            plants[p_def['name']] = plant
            if created:
                self.stdout.write(f"Added host plant: {plant.name}")

        # 3. Disease Data (All 26 non-healthy classes)
        disease_data = [
            {
                'name': 'Apple Scab',
                'scientific_name': 'Venturia inaequalis',
                'type': 'fungal',
                'hosts': ['Apple'],
                'symptoms': 'Olive-green, velvety spots on leaves; dark, scabby lesions on fruit.',
                'causes': 'Fungal pathogen overwintering in fallen leaves.',
                'treatments': [
                    {'name': 'Neem Oil', 'type': 'organic', 'desc': 'Organic fungicide.', 'inst': 'Spray leaves early evening.'},
                    {'name': 'Mancozeb Fungicide', 'type': 'chemical', 'desc': 'Protective fungicide.', 'inst': 'Apply during silver tip stage.'}
                ]
            },
            {
                'name': 'Apple Black Rot',
                'scientific_name': 'Botryosphaeria obtusa',
                'type': 'fungal',
                'hosts': ['Apple'],
                'symptoms': 'Reddish-brown spots on leaves (frogeye); firm, brown fruit rot with concentric rings.',
                'causes': 'Paths entering through wounds or dead tissue.',
                'treatments': [
                    {'name': 'Pruning', 'type': 'cultural', 'desc': 'Remove dead wood.', 'inst': 'Prune out cankers during winter.'},
                    {'name': 'Captan Fungicide', 'type': 'chemical', 'desc': 'Standard chemical control.', 'inst': 'Apply every 10-14 days.'}
                ]
            },
            {
                'name': 'Apple Cedar Rust',
                'scientific_name': 'Gymnosporangium juniperi-virginianae',
                'type': 'fungal',
                'hosts': ['Apple'],
                'symptoms': 'Bright orange spots on the upper surface of leaves.',
                'causes': 'Fungus requiring both apple and cedar trees to complete life cycle.',
                'treatments': [
                    {'name': 'Removing Juniper Hosts', 'type': 'cultural', 'desc': 'Remove nearby cedars.', 'inst': 'Clear red cedars within 1 mile range.'},
                    {'name': 'Myclobutanil', 'type': 'chemical', 'desc': 'Systemic fungicide.', 'inst': 'Apply between pink and petal fall stages.'}
                ]
            },
            {
                'name': 'Cherry Powdery Mildew',
                'scientific_name': 'Podosphaera clandestine',
                'type': 'fungal',
                'hosts': ['Cherry'],
                'symptoms': 'White, powdery patches on leaves and young shoots.',
                'causes': 'High humidity and poor air circulation.',
                'treatments': [
                    {'name': 'Sulfur Spray', 'type': 'organic', 'desc': 'Traditional organic sulfur.', 'inst': 'Dust or spray at first sign of white spots.'},
                    {'name': 'Potassium Bicarbonate', 'type': 'organic', 'desc': 'Baking soda alternative.', 'inst': 'Mix with water and surfactant.'}
                ]
            },
            {
                'name': 'Corn Cercospora Leaf Spot',
                'scientific_name': 'Cercospora zeae-maydis',
                'type': 'fungal',
                'hosts': ['Corn'],
                'symptoms': 'Rectangular, gray to tan lesions on leaves.',
                'causes': 'Warm, humid weather and wet leaves.',
                'treatments': [
                    {'name': 'Crop Rotation', 'type': 'cultural', 'desc': 'Rotate with non-grasses.', 'inst': 'Avoid corn-on-corn planting.'},
                    {'name': 'Strobilurin Fungicides', 'type': 'chemical', 'desc': 'Tassel stage application.', 'inst': 'Apply at VT to R1 stage.'}
                ]
            },
            {
                'name': 'Corn Common Rust',
                'scientific_name': 'Puccinia sorghi',
                'type': 'fungal',
                'hosts': ['Corn'],
                'symptoms': 'Small, cinnamon-brown pustules on both leaf surfaces.',
                'causes': 'Wind-borne spores from southern regions.',
                'treatments': [
                    {'name': 'Resistant Varieties', 'type': 'cultural', 'desc': 'Plant hybrid corn.', 'inst': 'Selection of resistant genotypes.'}
                ]
            },
            {
                'name': 'Corn Northern Leaf Blight',
                'scientific_name': 'Exserohilum turcicum',
                'type': 'fungal',
                'hosts': ['Corn'],
                'symptoms': 'Large, cigar-shaped, grayish-green to tan lesions.',
                'causes': 'Extended periods of leaf wetness and moderate temperatures.',
                'treatments': [
                    {'name': 'Deep Tillage', 'type': 'cultural', 'desc': 'Bury infected residue.', 'inst': 'Plow field after harvest.'}
                ]
            },
            {
                'name': 'Grape Black Rot',
                'scientific_name': 'Guignardia bidwellii',
                'type': 'fungal',
                'hosts': ['Grape'],
                'symptoms': 'Brown leaf spots; shriveled, black "mummy" berries.',
                'causes': 'Wet weather during late spring/summer.',
                'treatments': [
                    {'name': 'Manicure Vines', 'type': 'cultural', 'desc': 'Remove mummies.', 'inst': 'Remove dried fruit from previous season.'}
                ]
            },
            {
                'name': 'Grape Esca',
                'scientific_name': 'Phaeomoniella chlamydospora',
                'type': 'fungal',
                'hosts': ['Grape'],
                'symptoms': 'Tiger-stripe patterns on leaves; "black measles" spots on berries.',
                'causes': 'Complex of various wood-rotting fungi.',
                'treatments': [
                    {'name': 'Pruning Protection', 'type': 'cultural', 'desc': 'Seal pruning wounds.', 'inst': 'Apply wound sealant after winter pruning.'}
                ]
            },
            {
                'name': 'Grape Leaf Blight',
                'scientific_name': 'Isariopsis vaccinii',
                'type': 'fungal',
                'hosts': ['Grape'],
                'symptoms': 'Angular tan to brown spots on leaves; premature leaf drop.',
                'causes': 'High humidity and overlapping seasons.',
                'treatments': [
                    {'name': 'Copper Spray', 'type': 'organic', 'desc': 'Bordeaux mixture.', 'inst': 'Apply after harvest to protect foliage.'}
                ]
            },
            {
                'name': 'Citrus Greening (HLB)',
                'scientific_name': 'Candidatus Liberibacter asiaticus',
                'type': 'bacterial',
                'hosts': ['Orange'],
                'symptoms': 'Asymmetrical yellowing of leaves; small, lopsided fruit with bitter juice.',
                'causes': 'Asian Citrus Psyllid (insect vector).',
                'treatments': [
                    {'name': 'Psyllid Control', 'type': 'pest', 'desc': 'Target the vector.', 'inst': 'Use systemic insecticides to kill psyllids.'}
                ]
            },
            {
                'name': 'Peach Bacterial Spot',
                'scientific_name': 'Xanthomonas campestris',
                'type': 'bacterial',
                'hosts': ['Peach'],
                'symptoms': 'Small, angular, water-soaked spots on leaves; pitted fruit.',
                'causes': 'Bacteria splashing via rain/wind.',
                'treatments': [
                    {'name': 'Copper Bactericides', 'type': 'chemical', 'desc': 'Late dormant application.', 'inst': 'Spray before bud break.'}
                ]
            },
            {
                'name': 'Pepper Bacterial Spot',
                'scientific_name': 'Xanthomonas campestris pv. vesicatoria',
                'type': 'bacterial',
                'hosts': ['Pepper, bell'],
                'symptoms': 'Small, wart-like raised spots on fruit; brown leaf spots.',
                'causes': 'Infected seeds or soil splashes.',
                'treatments': [
                    {'name': 'Seed Treatment', 'type': 'cultural', 'desc': 'Bleach dip.', 'inst': 'Soak seeds in 10% bleach for 1 minute.'}
                ]
            },
            {
                'name': 'Potato Early Blight',
                'scientific_name': 'Alternaria solani',
                'type': 'fungal',
                'hosts': ['Potato'],
                'symptoms': 'Dark spots with concentric rings (target-like) on older leaves.',
                'causes': 'Moderate temperatures and alternating wet/dry periods.',
                'treatments': [
                    {'name': 'Mulching', 'type': 'cultural', 'desc': 'Prevent soil splash.', 'inst': 'Apply straw or plastic mulch.'}
                ]
            },
            {
                'name': 'Potato Late Blight',
                'scientific_name': 'Phytophthora infestans',
                'type': 'fungal',
                'hosts': ['Potato'],
                'symptoms': 'Pale green, water-soaked spots; white fungal growth on leaf undersides.',
                'causes': 'Cool, moist weather (The Great Famine pathogen).',
                'treatments': [
                    {'name': 'Destroy Volunteers', 'type': 'cultural', 'desc': 'Eliminate cull piles.', 'inst': 'Remove all potato waste from the garden.'}
                ]
            },
            {
                'name': 'Squash Powdery Mildew',
                'scientific_name': 'Erysiphe cichoracearum',
                'type': 'fungal',
                'hosts': ['Squash'],
                'symptoms': 'White powdery film on leaves; premature yellowing.',
                'causes': 'Warm temperatures and lack of airflow.',
                'treatments': [
                    {'name': 'Milk Spray', 'type': 'organic', 'desc': 'Natural antifungal.', 'inst': 'Mix 1 part milk with 9 parts water.'}
                ]
            },
            {
                'name': 'Strawberry Leaf Scorch',
                'scientific_name': 'Diplocarpon earlianum',
                'type': 'fungal',
                'hosts': ['Strawberry'],
                'symptoms': 'Purplish-brown spots that merge to "scorch" the leaf.',
                'causes': 'Overhead irrigation and high density.',
                'treatments': [
                    {'name': 'Drip Irrigation', 'type': 'cultural', 'desc': 'Keep leaves dry.', 'inst': 'Switch from overhead sprinklers to drip lines.'}
                ]
            },
            {
                'name': 'Tomato Bacterial Spot',
                'scientific_name': 'Xanthomonas campestris',
                'type': 'bacterial',
                'hosts': ['Tomato'],
                'symptoms': 'Small, greasy-looking spots on fruit; yellow halos on leaves.',
                'causes': 'Bacterial entry via stomata.',
                'treatments': [
                    {'name': 'Oxytetracycline', 'type': 'chemical', 'desc': 'Antibiotic spray.', 'inst': 'Apply under local agricultural guidelines.'}
                ]
            },
            {
                'name': 'Tomato Early Blight',
                'scientific_name': 'Alternaria solani',
                'type': 'fungal',
                'hosts': ['Tomato'],
                'symptoms': 'Lower leaves turn yellow with brown target-pattern spots.',
                'causes': 'Soil-borne fungi.',
                'treatments': [
                    {'name': 'Potassium Soap', 'type': 'organic', 'desc': 'Insecticidal soap.', 'inst': 'Helps clean leaf surface.'}
                ]
            },
            {
                'name': 'Tomato Late Blight',
                'scientific_name': 'Phytophthora infestans',
                'type': 'fungal',
                'hosts': ['Tomato'],
                'symptoms': 'Large, irregular olive-green to brown spots on leaves; oily fruit rot.',
                'causes': 'Pathogen spread by rain/wind.',
                'treatments': [
                    {'name': 'Copper Fungicide', 'type': 'organic', 'desc': 'Standard preventative.', 'inst': 'Apply every 7-10 days in wet seasons.'}
                ]
            },
            {
                'name': 'Tomato Leaf Mold',
                'scientific_name': 'Passalora fulva',
                'type': 'fungal',
                'hosts': ['Tomato'],
                'symptoms': 'Pale green patches on upper leaf; olive-brown fuzzy growth underneath.',
                'causes': 'High humidity in greenhouses.',
                'treatments': [
                    {'name': 'Ventilation', 'type': 'environmental', 'desc': 'Lower humidity.', 'inst': 'Use fans and dehumidifiers in the greenhouse.'}
                ]
            },
            {
                'name': 'Tomato Septoria Leaf Spot',
                'scientific_name': 'Septoria lycopersici',
                'type': 'fungal',
                'hosts': ['Tomato'],
                'symptoms': 'Tiny white circles with dark borders on leaves; usually lower leaves first.',
                'causes': 'Wet, humid weather.',
                'treatments': [
                    {'name': 'Pruning Lower Leaves', 'type': 'cultural', 'desc': 'Remove bottom foliage.', 'inst': 'Keep first 12 inches of stem leaf-free.'}
                ]
            },
            {
                'name': 'Tomato Spider Mites',
                'scientific_name': 'Tetranychus urticae',
                'type': 'pest',
                'hosts': ['Tomato'],
                'symptoms': 'Fine white speckling (stippling) on leaves; silk webbing.',
                'causes': 'Hot, dry conditions and dusty roads.',
                'treatments': [
                    {'name': 'Water Wash', 'type': 'mechanical', 'desc': 'Blast them off.', 'inst': 'Strong stream of water on leaf undersides.'},
                    {'name': 'Predatory Mites', 'type': 'biological', 'desc': 'Phytoseiulus persimilis.', 'inst': 'Release beneficial insects.'}
                ]
            },
            {
                'name': 'Tomato Target Spot',
                'scientific_name': 'Corynespora cassiicola',
                'type': 'fungal',
                'hosts': ['Tomato'],
                'symptoms': 'Brown spots with faint concentric rings; can affect stems and fruit.',
                'causes': 'Warm, wet weather.',
                'treatments': [
                    {'name': 'Spacing', 'type': 'cultural', 'desc': 'Wider planting.', 'inst': 'Increase plant-to-plant distance for air.'}
                ]
            },
            {
                'name': 'Tomato Mosaic Virus',
                'scientific_name': 'Tomato mosaic virus (ToMV)',
                'type': 'viral',
                'hosts': ['Tomato'],
                'symptoms': 'Mottled "mosaic" pattern of dark and light green on leaves; fern-like leaves.',
                'causes': 'Mechanical transmission (handling, tools).',
                'treatments': [
                    {'name': 'Tool Sanitization', 'type': 'cultural', 'desc': 'Clean your shears.', 'inst': 'Dip tools in 10% TSP or bleach between plants.'}
                ]
            },
            {
                'name': 'Tomato Yellow Leaf Curl Virus',
                'scientific_name': 'TYLCV',
                'type': 'viral',
                'hosts': ['Tomato'],
                'symptoms': 'Severe yellowing and upward curling of leaf edges; stunted growth.',
                'causes': 'Silverleaf Whitefly (insect vector).',
                'treatments': [
                    {'name': 'Yellow Sticky Traps', 'type': 'mechanical', 'desc': 'Trap whiteflies.', 'inst': 'Hang traps at canopy level.'}
                ]
            }
        ]

        # 4. Perform Seeding
        for d_info in disease_data:
            disease, created = Disease.objects.get_or_create(
                name=d_info['name'],
                defaults={
                    'scientific_name': d_info.get('scientific_name', ''),
                    'disease_type': d_info['type'],
                    'symptoms': d_info['symptoms'],
                    'causes': d_info['causes'],
                    'description': f"Information about {d_info['name']} affecting {', '.join(d_info['hosts'])}."
                }
            )

            # Link host plants
            for host_name in d_info['hosts']:
                if host_name in plants:
                    disease.affected_plants.add(plants[host_name])

            if created:
                self.stdout.write(f"Created disease entry: {disease.name}")

            # Add Treatments
            for t_info in d_info.get('treatments', []):
                Treatment.objects.get_or_create(
                    disease=disease,
                    name=t_info['name'],
                    defaults={
                        'treatment_type': t_info['type'],
                        'description': t_info['desc'],
                        'instructions': t_info['inst']
                    }
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded all 26 diseases and treatments!'))
