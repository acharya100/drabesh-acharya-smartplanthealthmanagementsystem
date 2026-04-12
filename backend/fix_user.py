"""
fix_user.py — Run from backend/ directory:
  python fix_user.py
Checks for the user and resets their password.
"""
import os, sys, django

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()

TARGET_EMAIL = "acharyadrabesh1@gmail.com"
NEW_PASSWORD = "drabesh1"

print("=" * 60)
print(f"Looking for: {TARGET_EMAIL}")

# Try to find by email
try:
    user = User.objects.get(Q(email__iexact=TARGET_EMAIL) | Q(username__iexact=TARGET_EMAIL))
    print(f"✅ Found user  : {user}")
    print(f"   username    : {user.username}")
    print(f"   email       : {user.email}")
    print(f"   is_active   : {user.is_active}")
    print(f"   is_staff    : {user.is_staff}")
    print(f"   is_superuser: {user.is_superuser}")
    print(f"   pwd correct : {user.check_password(NEW_PASSWORD)}")

    if not user.check_password(NEW_PASSWORD):
        user.set_password(NEW_PASSWORD)
        user.save()
        print(f"🔑 Password reset to: {NEW_PASSWORD}")
    else:
        print("✔  Password already correct.")

    if not user.is_active:
        user.is_active = True
        user.save()
        print("✔  Account activated.")

except User.DoesNotExist:
    print("❌ User NOT found — creating a fresh account...")
    user = User.objects.create_user(
        username=TARGET_EMAIL.split("@")[0],
        email=TARGET_EMAIL,
        password=NEW_PASSWORD,
        is_active=True,
    )
    print(f"✅ Created user: {user.username} / {user.email}")
    print(f"   Password    : {NEW_PASSWORD}")

except User.MultipleObjectsReturned:
    users = User.objects.filter(Q(email__iexact=TARGET_EMAIL) | Q(username__iexact=TARGET_EMAIL))
    print(f"⚠️  Multiple matches: {list(users)}")
    for u in users:
        u.set_password(NEW_PASSWORD)
        u.is_active = True
        u.save()
    print("🔑 Reset password on all of them.")

print("=" * 60)
print("\nAll existing accounts:")
for u in User.objects.all().order_by("id"):
    print(f"  [{u.id}] {u.username:30s} | {u.email:35s} | staff={u.is_staff} | super={u.is_superuser} | active={u.is_active}")
print("=" * 60)
print("\nDone. Try logging in now with:")
print(f"  Email   : {TARGET_EMAIL}")
print(f"  Password: {NEW_PASSWORD}")
