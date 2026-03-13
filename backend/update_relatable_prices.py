import os
import django
import re
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Treatment

def get_relatable_npr_price(treatment_type):
    """Generate a realistic price range in NPR based on treatment type"""
    
    # Base realistic price ranges for Nepal
    price_ranges = {
        'organic': (50, 400),       # Neem oil, homemade solutions
        'chemical': (150, 1500),    # Fungicides, commercial pesticides
        'biological': (200, 800),   # Beneficial insects, biological agents
        'cultural': (0, 100),       # Pruning shears, string, minor tools (mostly free/labor)
        'mechanical': (100, 600)    # Traps, nets, barriers
    }
    
    min_val, max_val = price_ranges.get(treatment_type, (50, 500))
    
    # Generate a sensible random price in increments of 50
    price1 = random.randint(min_val // 50, (max_val // 2) // 50) * 50
    price2 = random.randint((max_val // 2) // 50, max_val // 50) * 50
    
    # Ensure reasonable ordering and formatting
    if price1 == price2:
        return f"NPR {price1}"
    elif price1 == 0 and price2 < 100:
        return "NPR 0 - 100"
    else:
        return f"NPR {min(price1, price2)} - {max(price1, price2)}"

def run():
    print("Assigning relatable Nepali Rupee (NPR) values to all treatments...")
    treatments = Treatment.objects.all()
    count = 0
    
    for t in treatments:
        old_price = t.cost_estimate
        
        # We always want to standardize into relatable NPR formatting
        new_price = get_relatable_npr_price(t.treatment_type)
        
        t.cost_estimate = new_price
        t.save()
        print(f"[{t.treatment_type}] {t.name[:30]}... | {old_price} -> {new_price}")
        count += 1
            
    print(f"\n✅ Finished successfully! Updated {count} treatments to relatable NPR prices.")

if __name__ == '__main__':
    run()
