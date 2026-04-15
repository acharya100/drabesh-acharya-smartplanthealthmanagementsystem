import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import authenticate
from django.contrib.auth import get_user_model

User = get_user_model()

try:
    admin = User.objects.get(username='testadmin')
    admin.set_password('Password123')
    admin.save()
    print("set password successfully")
except Exception as e:
    print(e)
    
user = authenticate(username='testadmin', password='Password123')
print(f"Auth by username: {user}")

user = authenticate(username='testadmin@example.com', password='Password123')
print(f"Auth by email: {user}")
