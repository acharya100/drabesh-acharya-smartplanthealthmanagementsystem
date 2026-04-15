import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from predictions.models import Prediction

def fix_prices():
    rules = {
        'minor': 300,
        'moderate': 350,
        'severe': 400,
        'low': 300,
        'high': 400,
        'critical': 400
    }
    
    preds = Prediction.objects.all()
    count = 0
    for p in preds:
        if p.is_healthy or p.treatment_status == 'healthy' or p.is_non_plant or p.is_out_of_scope:
            p.estimated_cost = 0
        else:
            sev = (p.severity or 'minor').lower()
            p.estimated_cost = rules.get(sev, 300)
        
        p.save()
        count += 1
    
    print(f"Successfully updated {count} prediction records with new pricing rules.")

if __name__ == "__main__":
    fix_prices()
