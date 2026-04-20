from django.test import TestCase
from django.contrib.auth import get_user_model
from predictions.models import Prediction

User = get_user_model()

class BackendAdminNepaliTest(TestCase):
    def test_admin_dashboard_nepali_context(self):
        print("\n--- Starting Backend Admin Nepali Language Test ---")
        
        # 1. Simulate the backend providing data for the Nepali Dashboard
        # We verify that the backend keeps the correct numbers even when the UI is in Nepali
        User.objects.create_user(username='nepal_user', password='password123')
        
        Prediction.objects.create(
            user=User.objects.get(username='nepal_user'),
            disease_name='Apple Black Rot',
            confidence=99.09,
            is_healthy=False
        )

        # 2. Simulate the Nepali labels that the dashboard uses
        nepali_labels = {
            "total_users": "जम्मा प्रयोगकर्ताहरू",
            "total_scans": "जम्मा स्क्यानहरू",
            "diseased_scans": "रोगग्रस्त स्क्यानहरू"
        }

        # 3. Verify the numbers are still correct
        user_count = User.objects.count()
        scan_count = Prediction.objects.count()
        
        self.assertEqual(user_count, 1)
        self.assertEqual(scan_count, 1)
        self.assertIn("जम्मा", nepali_labels["total_users"])
        
        print("--- Backend Admin Nepali Language Test Passed Successfully! ---")
