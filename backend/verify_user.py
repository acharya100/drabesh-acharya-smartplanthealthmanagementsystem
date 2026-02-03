
import os
import django
import sys

# Set up Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate

User = get_user_model()
email = 'drabesh@gmail.com'
password = 'superuser'

print(f"Checking for user: {email}")
try:
    user = User.objects.get(email=email)
    print(f"User found: {user}")
    print(f"Is active: {user.is_active}")
    print(f"Check password: {user.check_password(password)}")
except User.DoesNotExist:
    print("User does NOT exist.")

# Try authenticate
user_auth = authenticate(username=email, password=password) # authenticate uses 'username' kwarg which maps to USERNAME_FIELD
print(f"Authenticate result (username=email): {user_auth}")

# If authenticate fails, maybe it expects 'email' kwarg?
# user_auth2 = authenticate(email=email, password=password)
# print(f"Authenticate result (email=email): {user_auth2}")
