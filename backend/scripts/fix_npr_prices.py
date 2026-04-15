import os
import django
import re

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from diseases.models import Treatment

def format_price(price_str):
    if not price_str or price_str == 'N/A':
        return 'N/A'
    
    # Remove existing NPR prefix if any to avoid duplication
    clean_str = price_str.replace('NPR', '').strip()
    
    if re.match(r'^\d+\s*-\s*\d+$', clean_str) or re.match(r'^\d+$', clean_str):
        return f"NPR {clean_str}"
    
  
    if '$' in price_str:
        # Convert $ to NPR (rough estimate for placeholders)
        try:
            val = int(re.search(r'\d+', price_str).group())
            return f"NPR {val * 130}"
        except:
            return price_str
            
    return f"NPR {clean_str}"

def run():
    print("Normalizing treatment prices...")
    treatments = Treatment.objects.all()
    count = 0
    for t in treatments:
        old_price = t.cost_estimate
        new_price = format_price(old_price)
        if old_price != new_price:
            t.cost_estimate = new_price
            t.save()
            print(f"Updated '{t.name}': {old_price} -> {new_price}")
            count += 1
    
    print(f"Finished. Updated {count} treatments.")

if __name__ == '__main__':
    run()
