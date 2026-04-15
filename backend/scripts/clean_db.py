import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from predictions.models import Prediction
deleted, _ = Prediction.objects.all().delete()
print(f"Deleted {deleted} old predictions.")
