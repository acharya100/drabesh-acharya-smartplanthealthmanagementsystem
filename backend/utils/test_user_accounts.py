from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class BackendUserAccountsTest(TestCase):
    def test_user_account_creation(self):
        print("\n--- Starting Backend User Account Test ---")
        
        # 1. Simulate a new user signing up to the system
        user = User.objects.create_user(
            username='plant_lover_99',
            email='plantlover@example.com',
            password='SecurePassword123!'
        )
        
        # 2. Verify exactly what the database stored securely
        self.assertEqual(user.username, 'plant_lover_99')
        self.assertEqual(user.email, 'plantlover@example.com')
        
        # 3. Check that the password is NOT stored as raw text
        self.assertNotEqual(user.password, 'SecurePassword123!')
        self.assertTrue(user.check_password('SecurePassword123!'))
        
        print("--- Backend User Account Test Passed Successfully! ---")
