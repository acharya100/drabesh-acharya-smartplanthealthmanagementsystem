from django.test import TestCase
from predictions.models import Prediction
from django.contrib.auth import get_user_model

User = get_user_model()

class BackendPredictionTest(TestCase):
    def test_prediction_creation_and_validation(self):
        print("\n--- Starting Backend Test (From utils folder) ---")
        
        # 1. Simulate creating a user
        user = User.objects.create_user(username='test_utils', password='password123')
        
        # 2. Simulate saving a prediction from the AI side
        prediction = Prediction.objects.create(
            user=user,
            plant_name='Apple',
            disease_name='Apple Scab',
            confidence=95.50,
            treatment_status='in_progress'
        )
        
        # 3. Verify exactly what the system recorded
        self.assertEqual(prediction.plant_name, 'Apple')
        self.assertEqual(prediction.disease_name, 'Apple Scab')
        self.assertEqual(prediction.treatment_status, 'in_progress')
        
        print("--- Backend Test Passed Successfully! ---")
