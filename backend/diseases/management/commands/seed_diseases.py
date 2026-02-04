from django.core.management.base import BaseCommand
from plants.models import Plant
from diseases.models import Disease, Treatment

class Command(BaseCommand):
    help = 'Seeds the database with common plant diseases and treatments'

    def handle(self, *args, **options):
        self.stdout.write('Seeding plants and diseases...')

        # 1. Ensure Host Plants exist
        plant_data = [
            {'name': 'Apple', 'scientific_name': 'Malus domestica', 'sunlight_requirement': 'full_sun'},
            {'name': 'Grape', 'scientific_name': 'Vitis vinifera', 'sunlight_requirement': 'full_sun'},
            {'name': 'Potato', 'scientific_name': 'Solanum tuberosum', 'sunlight_requirement': 'full_sun'},
            {'name': 'Tomato', 'scientific_name': 'Solanum lycopersicum', 'sunlight_requirement': 'full_sun'},
        ]

        plants = {}
        for p_info in plant_data:
            plant, created = Plant.objects.get_or_create(
                name=p_info['name'],
                defaults={'scientific_name': p_info['scientific_name'], 'sunlight_requirement': p_info['sunlight_requirement']}
            )
            plants[p_info['name']] = plant
            if created:
                self.stdout.write(f"Created plant: {plant.name}")

        # 2. Define Diseases and Treatments
        diseases_to_seed = [
            {
                'name': 'Apple Scab',
                'scientific_name': 'Venturia inaequalis',
                'type': 'fungal',
                'affected_plants': ['Apple'],
                'symptoms': 'Velvety, olive-green to black spots on leaves and fruit.',
                'treatments': [
                    {'name': 'Neem Oil Spray', 'type': 'organic', 'desc': 'Apply neem oil to affected areas.', 'instructions': '1. Mix neem oil with water\n2. Spray twice a week.'},
                    {'name': 'Fungicide Application', 'type': 'chemical', 'desc': 'Use Mancozeb or Captan.', 'instructions': '1. Follow label instructions\n2. Apply during early spring.'}
                ]
            },
            {
                'name': 'Tomato Late Blight',
                'scientific_name': 'Phytophthora infestans',
                'type': 'fungal',
                'affected_plants': ['Tomato', 'Potato'],
                'symptoms': 'Dark, water-soaked spots on leaves and stems.',
                'treatments': [
                    {'name': 'Copper Fungicide', 'type': 'organic', 'desc': 'Preventive organic spray.', 'instructions': '1. Spray every 10 days\n2. Focus on lower leaves.'},
                    {'name': 'Systemic Fungicide', 'type': 'chemical', 'desc': 'Aggressive chemical control.', 'instructions': '1. Apply at first sign of infection.'}
                ]
            },
            {
                'name': 'Potato Early Blight',
                'scientific_name': 'Alternaria solani',
                'type': 'fungal',
                'affected_plants': ['Potato', 'Tomato'],
                'symptoms': 'Bullseye-shaped brown spots on older leaves.',
                'treatments': [
                    {'name': 'Baking Soda Solution', 'type': 'organic', 'desc': 'Mild organic remedy.', 'instructions': '1. Mix 1 tbsp baking soda with 1 liter water\n2. Spray affected leaves.'}
                ]
            },
            {
                'name': 'Grape Black Rot',
                'scientific_name': 'Guignardia bidwellii',
                'type': 'fungal',
                'affected_plants': ['Grape'],
                'symptoms': 'Small brown spots on leaves; berries shrivel and turn black.',
                'treatments': [
                    {'name': 'Vine Sanitation', 'type': 'cultural', 'desc': 'Remove infected berries.', 'instructions': '1. Prune affected stems\n2. Clean up fallen debris.'}
                ]
            }
            # Adding more to reach at least 15 in a real scenario, 
            # but for now seeding core classes to fix the immediate error.
        ]

        # Add remaining classes from the plan
        additional_classes = [
            'Apple Black Rot', 'Apple Cedar Rust', 'Grape Esca', 'Grape Leaf Blight',
            'Potato Late Blight', 'Tomato Bacterial Spot', 'Tomato Early Blight',
            'Tomato Leaf Mold', 'Tomato Septoria Leaf Spot', 'Tomato Spider Mites', 'Tomato Target Spot'
        ]

        for name in additional_classes:
            host = 'Tomato'
            if 'Apple' in name: host = 'Apple'
            elif 'Grape' in name: host = 'Grape'
            elif 'Potato' in name: host = 'Potato'
            
            diseases_to_seed.append({
                'name': name,
                'affected_plants': [host],
                'type': 'fungal' if 'Mites' not in name else 'pest',
                'symptoms': f'Common symptoms for {name}.',
                'treatments': [
                    {'name': 'Generic Treatment', 'type': 'organic', 'desc': 'Generic care.', 'instructions': '1. Monitor plant\n2. Ensure proper watering.'}
                ]
            })

        for d_info in diseases_to_seed:
            disease, created = Disease.objects.get_or_create(
                name=d_info['name'],
                defaults={
                    'scientific_name': d_info.get('scientific_name', ''),
                    'disease_type': d_info['type'],
                    'symptoms': d_info['symptoms'],
                    'causes': 'Fungal spores' if d_info['type'] == 'fungal' else 'Environmental/Pests'
                }
            )
            
            # Link plants
            for p_name in d_info['affected_plants']:
                disease.affected_plants.add(plants[p_name])

            if created:
                self.stdout.write(f"Created disease: {disease.name}")

            # Add treatments
            for t_info in d_info.get('treatments', []):
                Treatment.objects.get_or_create(
                    disease=disease,
                    name=t_info['name'],
                    defaults={
                        'treatment_type': t_info['type'],
                        'description': t_info['desc'],
                        'instructions': t_info['instructions']
                    }
                )

        self.stdout.write(self.style.SUCCESS('Successfully seeded database!'))
