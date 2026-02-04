import os
import django

# Setting up django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.contrib.auth import get_user_model
from plants.models import Plant
from predictions.models import Prediction

User = get_user_model()

def finalize_migration():
    print("--- Final Data Migration ---")
    email = 'drabeshacharya@gmail.com'
    
    try:
        user = User.objects.get(email=email)
        print(f"Found user: {user.email}")
        
        # Migrate all plants
        plants_count = Plant.objects.all().count()
        Plant.objects.all().update(user=user)
        print(f"Successfully assigned {plants_count} plants to {email}")
        
        # Migrate all predictions
        predictions_count = Prediction.objects.all().count()
        Prediction.objects.all().update(user=user)
        print(f"Successfully assigned {predictions_count} predictions to {email}")
        
        print("\n✅ All information has been safely moved to your primary account.")
        
    except User.DoesNotExist:
        print(f"❌ Error: User {email} does not exist. Please create it first.")
    except Exception as e:
        print(f"❌ Error during migration: {e}")

if __name__ == "__main__":
    finalize_migration()
