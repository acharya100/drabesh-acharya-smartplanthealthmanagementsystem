from django.test import TestCase
from soil.models import SoilAnalysis
from django.contrib.auth import get_user_model

User = get_user_model()

class BackendSoilAnalysisTest(TestCase):
    def test_soil_record_creation(self):
        print("\n--- Starting Backend Soil Analysis Test ---")
        
        # 1. Create a dummy user
        user = User.objects.create_user(username='farmer_john', password='password123')
        
        # 2. Simulate saving soil analysis data
        soil_record = SoilAnalysis.objects.create(
            user=user,
            nitrogen=40.5,
            phosphorus=25.0,
            potassium=30.0,
            ph_level=6.5,
            moisture=45.0,
            soil_type='loamy',
            health_score=85
        )
        
        # 3. Verify exactly what the database stored
        self.assertEqual(soil_record.nitrogen, 40.5)
        self.assertEqual(soil_record.ph_level, 6.5)
        self.assertEqual(soil_record.soil_type, 'loamy')
        self.assertEqual(soil_record.health_score, 85)
        
        print("--- Backend Soil Analysis Test Passed Successfully! ---")
