from django.core.management.base import BaseCommand
from predictions.models import Plant, Disease
from predictions.ai_utils import PLANT_VILLAGE_CLASSES

class Command(BaseCommand):
    help = 'Seeds the database with PlantVillage plants and diseases'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding PlantVillage data...')

        
        data = {} # Plant -> [Diseases]
        
        for cls in PLANT_VILLAGE_CLASSES:
            parts = cls.split('___')
            plant_name = parts[0].replace('_', ' ').replace('(', '').replace(')', '').strip()
            
            # Clean up names
            if "Corn" in plant_name: plant_name = "Corn (Maize)"
            if "Cherry" in plant_name: plant_name = "Cherry"
            if "Pepper" in plant_name: plant_name = "Bell Pepper"
            if "Tomato" in plant_name: plant_name = "Tomato"
            
            condition = parts[1].replace('_', ' ')
            
            if plant_name not in data:
                data[plant_name] = []
            
            data[plant_name].append(condition)

        # 2. Insert into DB
        for plant_name, conditions in data.items():
            # Create/Get Plant
            plant, created = Plant.objects.get_or_create(
                name=plant_name,
                defaults={
                    'scientific_name': f"{plant_name} spp.",
                    'description': f"Common {plant_name} plant."
                }
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f'Created Plant: {plant_name}'))
            
            # Create Diseases
            for cond in conditions:
                if "healthy" in cond.lower():
                    continue # Skip healthy as a disease entry
                    
                disease, d_created = Disease.objects.get_or_create(
                    name=cond,
                    plant=plant,
                    defaults={
                        'description': f"{cond} affecting {plant_name}.",
                        'symptoms': "Discoloration, spots on leaves.",
                        'treatment': "Apply appropriate fungicide or remove infected leaves."
                    }
                )
                if d_created:
                    self.stdout.write(f'  - Added Disease: {cond}')
        
        self.stdout.write(self.style.SUCCESS('Successfully seeded PlantVillage dataset!'))
