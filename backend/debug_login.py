import os
import django
from django.conf import settings

# Setting up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model, authenticate
from django.db.models import Q
User = get_user_model()

def debug_auth():
    print("--- User Debug ---")
    users = User.objects.all()
    print(f"Total users: {users.count()}")
    for u in users:
        print(f"- ID: {u.id}, Username: {u.username}, Email: {u.email}")

    email = 'drabeshacharya@gmail.com'
    password = 'drabesh1'
    
    print(f"\nAttempting debug for: {email}")
    try:
        user = User.objects.get(Q(email__iexact=email) | Q(username__iexact=email))
        print(f"User found in DB: {user.username} (Email: {user.email})")
        
        # Test authenticate function
        auth_user = authenticate(username=email, password=password)
        if auth_user:
            print("✅ authenticate(username=email) SUCCESS")
        else:
            print("❌ authenticate(username=email) FAILED")
            # Try plain password check
            if user.check_password(password):
                print("  (Password check: CORRECT)")
            else:
                print("  (Password check: INCORRECT)")

        auth_user_name = authenticate(username=user.username, password=password)
        if auth_user_name:
            print(f"✅ authenticate(username={user.username}) SUCCESS")
        else:
            print(f"❌ authenticate(username={user.username}) FAILED")

    except User.DoesNotExist:
        print(f"User with identifier '{email}' NOT FOUND")
    except Exception as e:
        print(f"Error during debug: {e}")

if __name__ == "__main__":
    debug_auth()
