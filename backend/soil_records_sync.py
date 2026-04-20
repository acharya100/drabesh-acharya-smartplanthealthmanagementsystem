import os
import django
import json

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from soil.models import SoilAnalysis

def clean_text(text):
    if not isinstance(text, str):
        return text
    # Replace common mangled sequences and specialty characters
    replacements = {
        '\u2014': '-',   # em-dash
        '\u2013': '-',   # en-dash
        '\xe2\x80\x94': '-', # UTF-8 mangled em-dash
        '\xe2\x80\x93': '-', # UTF-8 mangled en-dash
        '\xe2\x80\x9c': '"', # UTF-8 mangled smart quote
        '\xe2\x80\x9d': '"', # UTF-8 mangled smart quote
        'â€"': '-',      # Mojibake em-dash
        'â€“': '-',       # Mojibake en-dash
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    return text

def sanitize_records():
    print("Starting database sanitization for Soil Analysis records...")
    records = SoilAnalysis.objects.all()
    count = 0
    
    for sa in records:
        changed = False
        
        # Recommendations is a JSONField (list of dicts)
        recs = sa.recommendations
        if isinstance(recs, list):
            for r in recs:
                for key in ['suggestion', 'explanation']:
                    if key in r and isinstance(r[key], str):
                        original = r[key]
                        cleaned = clean_text(original)
                        if original != cleaned:
                            r[key] = cleaned
                            changed = True
                            
        if changed:
            sa.recommendations = recs
            sa.save()
            count += 1
            print(f"  Fixed record ID {sa.id} for user {sa.user.username}")
            
    print(f"Sanitization complete. Fixed {count} records.")

if __name__ == "__main__":
    sanitize_records()
