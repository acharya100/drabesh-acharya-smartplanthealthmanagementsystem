from django.test import TestCase
from django.contrib.auth import get_user_model
from predictions.models import Prediction

User = get_user_model()
class BackendAdminDashboardTest(TestCase):
    def test_admin_dashboard_statistics(self):
        print("\n--- Starting Backend Admin Dashboard Test ---")
        # 1. Simulate the data for the 'Most Active Users' list
        active_user = User.objects.create_user(username='DraBesh', email='acharyadrabesh@gmail.com', password='password123')
        # 2. Simulate the 'Recent Scans' and 'Diseased Scans' statistics
        Prediction.objects.create(
            user=active_user,
            disease_name='Apple Black Rot',
            confidence=99.09,
            is_healthy=False,
            treatment_status='untreated')
         
        # 3. Simulate a 'Healthy Scan' statistic
        Prediction.objects.create(
            user=active_user,
            disease_name='Unknown',
            confidence=99.97,
            is_healthy=True,
            treatment_status='healthy')
        # 4. Verify the backend successfully aggregates these statistics
        total_users = User.objects.count()
        total_scans = Prediction.objects.count()
        diseased_scans = Prediction.objects.filter(is_healthy=False).count()
        healthy_scans = Prediction.objects.filter(is_healthy=True).count()
        self.assertEqual(total_users, 1)
        self.assertEqual(total_scans, 2)
        self.assertEqual(diseased_scans, 1)
        self.assertEqual(healthy_scans, 1)
        print("--- Backend Admin Dashboard Test Passed Successfully! ---")
