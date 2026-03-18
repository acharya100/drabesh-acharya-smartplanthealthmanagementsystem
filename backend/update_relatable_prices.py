import os
import django
import re
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Treatment

def get_relatable_npr_price(treatment_type):
    """Generate a realistic price range in NPR and effectiveness based on treatment type"""
    
    # Base realistic price ranges for Nepal
    price_ranges = {
        'organic': (50, 400),       # Neem oil, homemade solutions
        'chemical': (150, 1500),    # Fungicides, commercial pesticides
        'biological': (200, 800),   # Beneficial insects, biological agents
        'cultural': (0, 100),       # Pruning shears, string, minor tools (mostly free/labor)
        'mechanical': (100, 600)    # Traps, nets, barriers
    }
    
    effectiveness_ranges = {
        'organic': (65, 85),
        'chemical': (85, 98),
        'biological': (75, 90),
        'cultural': (50, 75),
        'mechanical': (60, 80)
    }
    
    min_val, max_val = price_ranges.get(treatment_type, (50, 500))
    eff_min, eff_max = effectiveness_ranges.get(treatment_type, (70, 90))
    
    # Generate a sensible random price in increments of 50
    price1 = random.randint(min_val // 50, (max_val // 2) // 50) * 50
    price2 = random.randint((max_val // 2) // 50, max_val // 50) * 50
    
    # Generate random effectiveness
    effectiveness = random.randint(eff_min, eff_max)
    
    # Ensure reasonable ordering and formatting
    if price1 == price2:
        price_str = f"NPR {price1}"
    elif price1 == 0 and price2 < 100:
        price_str = "NPR 0 - 100"
    else:
        price_str = f"NPR {min(price1, price2)} - {max(price1, price2)}"
        
    return price_str, effectiveness

def run():
    print("Assigning relatable Nepali Rupee (NPR) values and effectiveness to all treatments...")
    treatments = Treatment.objects.all()
    count = 0
    
    for t in treatments:
        old_price = t.cost_estimate
        
        # We always want to standardize into relatable NPR formatting
        new_price, effectiveness = get_relatable_npr_price(t.treatment_type)
        
        t.cost_estimate = new_price
        t.effectiveness_rate = effectiveness
        t.save()
        print(f"[{t.treatment_type}] {t.name[:30]}... | {old_price} -> {new_price} | Eff: {effectiveness}%")
        count += 1
            
    print(f"\n✅ Finished successfully! Updated {count} treatments to relatable NPR prices and effectiveness.")

if __name__ == '__main__':
    run()
