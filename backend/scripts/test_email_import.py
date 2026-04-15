import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

try:
    from ecommerce.email_utils import send_order_confirmation_email
    print("SUCCESS: email_utils imported correctly")
    # We won't actually send an email to avoid side effects if not configured
except ImportError as e:
    print(f"IMPORT ERROR: {e}")
except Exception as e:
    print(f"ERROR: {e}")
