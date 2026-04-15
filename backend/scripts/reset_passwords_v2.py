import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

credentials = {
    'drabesh@gmail.com': 'drabesh0',
    'acharyadrabesh@gmail.com': 'drabesh1',
    'testuser@example.com': 'test1',
    'admin@example.com': 'admin.123',
    'admin@smartplant.com': 'admin.321',
    'drabeshacharya@gmail.com': 'drabesh18'
}

print("--- UPDATING PASSWORDS ---")
for email, password in credentials.items():
    try:
        user = User.objects.get(email=email)
        user.set_password(password)
        user.is_staff = True
        user.is_superuser = True
        user.save()
        print(f"Updated: {email}")
    except User.DoesNotExist:
        print(f"FAILED: {email} (User not found)")
print("--- FINISHED ---")
