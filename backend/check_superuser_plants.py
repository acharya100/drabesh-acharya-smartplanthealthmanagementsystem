import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from plants.models import Plant

User = get_user_model()
superusers = User.objects.filter(is_superuser=True)

print(f"Superusers found: {superusers.count()}")
for su in superusers:
    count = Plant.objects.filter(user=su).count()
    print(f"User: {su.email}, Plants: {count}")
    plants = Plant.objects.filter(user=su).values_list('name', flat=True)
    print(f"  Plants: {list(plants)}")

all_plants = Plant.objects.all().count()
print(f"Total plants in DB: {all_plants}")
