
import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

email = "test@example.com"
password = "password123"
username = "testuser"

if not User.objects.filter(email=email).exists():
    print(f"Creating user {email}...")
    User.objects.create_user(username=username, email=email, password=password)
    print("User created successfully.")
else:
    print(f"User {email} already exists. Updating password...")
    user = User.objects.get(email=email)
    user.set_password(password)
    user.save()
    print("Password updated successfully.")
