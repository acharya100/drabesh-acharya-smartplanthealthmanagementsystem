import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from predictions.models import Prediction
from diseases.models import Disease

def run():
    print("Fixing Prediction links to Diseases...")
    
    predictions = Prediction.objects.filter(is_healthy=False, predicted_disease__isnull=True)
    fixed_count = 0
    
    for pred in predictions:
        if not pred.disease_name or pred.disease_name == 'Unrecognized':
            continue
            
        # Try to find a matching disease
        disease = Disease.objects.filter(name__icontains=pred.disease_name).first()
        
        # Fallback for specific AI names like "Tomato Spider Mites Two-Spotted Spider Mite"
        if not disease:
            for d in Disease.objects.all():
                if d.name.lower() in pred.disease_name.lower():
                    disease = d
                    break
        
        if disease:
            pred.predicted_disease = disease
            # Keep existing status if it was already set, otherwise mark as untreated for history view
            pred.save()
            fixed_count += 1
            print(f"Fixed Prediction {pred.id}: Linked to {disease.name}")
            
    print(f"\n✅ Finished! Linked {fixed_count} predictions to diseases.")

if __name__ == '__main__':
    run()
