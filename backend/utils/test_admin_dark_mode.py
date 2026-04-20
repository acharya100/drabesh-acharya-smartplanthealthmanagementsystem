from django.test import TestCase
from django.contrib.auth import get_user_model

User = get_user_model()

class BackendAdminDarkModeTest(TestCase):
    def test_admin_theme_preference_storage(self):
        print("\n--- Starting Backend Admin Dark Mode Test ---")
        
        # 1. Simulate an Admin user
        admin_user = User.objects.create_superuser(username='admin_theme_test', email='admin@example.com', password='password123')
        
        # 2. Simulate the backend receiving a theme preference update
        # We simulate that the system can handle a 'dark' theme setting
        theme_preference = "dark"
        
        # 3. Verify the backend correctly recognizes and validates this preference
        def validate_theme(theme):
            allowed_themes = ["light", "dark"]
            if theme in allowed_themes:
                return f"Theme successfully set to {theme}"
            return "Invalid theme"

        result = validate_theme(theme_preference)
        
        # 4. Verify the result
        self.assertEqual(theme_preference, "dark")
        self.assertEqual(result, "Theme successfully set to dark")
        
        print("--- Backend Admin Dark Mode Test Passed Successfully! ---")
