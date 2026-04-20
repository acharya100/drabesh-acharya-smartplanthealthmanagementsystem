import os
import django
import json
import re

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from soil.models import SoilAnalysis
from chat.models import ChatMessage

def aggressive_ascii_clean(text):
    if not text or not isinstance(text, str):
        return text
    
    # 1. Handle common Mojibake sequences explicitly
    replacements = {
        'â€“': '-',   # Mojibake en-dash
        'â€"': '-',   # Mojibake em-dash
        'â€œ': '"',   # Mojibake left smart quote
        'â€': '"',    # Mojibake right smart quote
        '\u2013': '-', # Unicode en-dash
        '\u2014': '-', # Unicode em-dash
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
        
    # 2. Force convert to ASCII, replacing any remaining non-ASCII with '-'
    # We use 'ignore' or 'replace' but we want '-' specifically for dashes
    # Actually, let's just use a regex to keep only printable ASCII
    text = re.sub(r'[^\x20-\x7E]', '-', text)
    
    # 3. Clean up multiple dashes resulting from replacements
    text = re.sub(r'-+', '-', text)
    
    return text.strip()

def sanitize_database():
    print("--- Starting Aggressive Database Sanitization ---")
    
    # 1. SoilAnalysis
    count_sa = 0
    for sa in SoilAnalysis.objects.all():
        changed = False
        recs = sa.recommendations
        if isinstance(recs, list):
            for r in recs:
                for key in ['suggestion', 'explanation', 'nutrient']:
                    if key in r and isinstance(r[key], str):
                        original = r[key]
                        cleaned = aggressive_ascii_clean(original)
                        if original != cleaned:
                            r[key] = cleaned
                            changed = True
        
        # Overall explanation
        if hasattr(sa, 'overall_explanation') and sa.overall_explanation:
             original = sa.overall_explanation
             cleaned = aggressive_ascii_clean(original)
             if original != cleaned:
                 sa.overall_explanation = cleaned
                 changed = True

        if changed:
            sa.recommendations = recs
            sa.save()
            count_sa += 1
            print(f"  Fixed SoilAnalysis ID {sa.id}")

    # 2. ChatMessage
    count_chat = 0
    for msg in ChatMessage.objects.all():
        if msg.content:
            original = msg.content
            cleaned = aggressive_ascii_clean(original)
            if original != cleaned:
                msg.content = cleaned
                msg.save()
                count_chat += 1
                print(f"  Fixed ChatMessage ID {msg.id}")

    print(f"--- Sanitization Complete ---")
    print(f"SoilAnalysis records fixed: {count_sa}")
    print(f"ChatMessage records fixed: {count_chat}")

if __name__ == "__main__":
    sanitize_database()
