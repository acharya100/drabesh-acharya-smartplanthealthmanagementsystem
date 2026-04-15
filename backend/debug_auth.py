import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model

User = get_user_model()

print(f"Total users: {User.objects.count()}")
for u in User.objects.all()[:5]:
    print(f"User: {u.username}, Email: {u.email}, Phone: {u.phone_number}, Active: {u.is_active}")

print(f"Testing authenticate with a dummy invalid user:")
user = authenticate(username='invalid_user___', password='invalid_password')
print(f"Result: {user}")
