from django.test import TestCase
from django.contrib.auth import get_user_model
from plants.models import Plant
from predictions.models import Prediction

User = get_user_model()

class BackendAdminAllUsersTest(TestCase):
    def test_admin_user_list_and_stats(self):
        print("\n--- Starting Backend Admin 'All Users' List Test ---")
        
        # 1. Simulate creating a few users from the screenshot
        user1 = User.objects.create_user(username='durga', email='dsub444@gmail.com', password='password123')
        user2 = User.objects.create_user(username='DraBesh', email='acharyadrabesh@gmail.com', password='password123')
        admin = User.objects.create_superuser(username='drabeshacharya', email='drabeshacharya@gmail.com', password='password123')

        for _ in range(56):
            Plant.objects.create(user=user2, name="Test Plant")
        
        for _ in range(154):
            Prediction.objects.create(user=user2, disease_name="Test Disease", confidence=90.0, is_healthy=False)
            
        # 3. Verify exactly what the backend sees for the Admin table
        all_users = User.objects.all().order_by('-date_joined')
        
        self.assertEqual(all_users.count(), 3)
        
        # Check DraBesh stats
        drabesh_record = User.objects.get(username='DraBesh')
        self.assertEqual(drabesh_record.plants.count(), 56)
        self.assertEqual(drabesh_record.predictions.count(), 154)
        # Check Admin role
        admin_record = User.objects.get(username='drabeshacharya')
        self.assertTrue(admin_record.is_superuser)
        
        print("--- Backend Admin 'All Users' List Test Passed Successfully! ---")
