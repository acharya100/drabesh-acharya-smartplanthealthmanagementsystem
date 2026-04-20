from decimal import Decimal
from django.test import TestCase
from django.contrib.auth import get_user_model
from predictions.models import Prediction

User = get_user_model()
class BackendAdminScanLogsTest(TestCase):
    def test_admin_scan_logs_history(self):
        print("\n--- Starting Backend Admin 'System Scan Logs' Test ---")
        user = User.objects.create_user(username='DraBesh', password='password123')

        Prediction.objects.create(
            user=user,
            disease_name='Apple Black Rot',
            confidence=Decimal('99.09'),
            is_healthy=False,
            severity='minor',
            treatment_status='untreated')
        
        Prediction.objects.create(
            user=user,
            disease_name='Unknown',
            confidence=Decimal('99.97'),
            is_healthy=True,
            severity='low',
            treatment_status='healthy')
        
        Prediction.objects.create(
            user=user,
            disease_name='Unknown',
            confidence=Decimal('50.72'),
            is_healthy=False,
            is_out_of_scope=True)
        
        Prediction.objects.create(
            user=user,
            disease_name='Unknown',
            confidence=Decimal('7.18'),
            is_healthy=False,
            is_non_plant=True)
        
        logs = Prediction.objects.all().order_by('-created_at')
        self.assertEqual(logs.count(), 4)
        diseased_log = logs.get(disease_name='Apple Black Rot', is_healthy=False, is_out_of_scope=False, is_non_plant=False)

        self.assertEqual(diseased_log.disease_name, 'Apple Black Rot')
        self.assertEqual(diseased_log.severity, 'minor')
        healthy_log = logs.get(is_healthy=True, disease_name='Unknown')
        
        self.assertEqual(healthy_log.confidence, Decimal('99.97'))
        non_plant_log = logs.get(is_non_plant=True)
        self.assertEqual(non_plant_log.is_non_plant, True)

        print("--- Backend Admin 'System Scan Logs' Test Passed Successfully! ---")
