from django.test import TestCase
from plants.models import Plant
from django.contrib.auth import get_user_model

User = get_user_model()

class BackendMyPlantsTest(TestCase):
    def test_plant_profile_creation(self):
        print("\n--- Starting Backend 'My Plants' Test ---")
        
        # 1. Create a dummy user
        user = User.objects.create_user(username='botanist_jane', password='password123')
        
        # 2. Simulate saving a detailed plant profile to the user's collection
        plant = Plant.objects.create(
            user=user,
            name='Monstera Deliciosa',
            scientific_name='Monstera deliciosa',
            sunlight_requirement='partial_shade',
            water_frequency='weekly',
            difficulty_level='beginner',
            health_status='healthy'
        )
        
        # 3. Verify exactly what the database stored
        self.assertEqual(plant.name, 'Monstera Deliciosa')
        self.assertEqual(plant.sunlight_requirement, 'partial_shade')
        self.assertEqual(plant.health_status, 'healthy')
        
        # 4. Check automatic property calculation (beginner level = low maintenance)
        self.assertTrue(plant.is_low_maintenance)
        
        print("--- Backend 'My Plants' Test Passed Successfully! ---")
