import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

admin_email = 'admin@smartplant.com'

print("--- UPDATING PERMISSIONS ---")
for user in User.objects.all():
    if user.email == admin_email:
        user.is_staff = True
        user.is_superuser = True
        print(f"ADMIN SET: {user.email}")
    else:
        user.is_staff = False
        user.is_superuser = False
        print(f"DEMOTED to REGULAR USER: {user.email}")
    user.save()
print("--- FINISHED ---")
