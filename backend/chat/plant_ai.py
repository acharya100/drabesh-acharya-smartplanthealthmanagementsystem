import re

KNOWLEDGE_BASE = [
    {
        "keywords": ["buy", "ecommerce", "marketplace", "shop", "order"],
        "response": "Go to Marketplace → select product → Add to Cart → open cart → checkout → enter delivery details → place order."
    },
    {
        "keywords": ["beginner", "start", "what to do", "help"],
        "response": "Start with:\n1. Upload plant photo in Detection\n2. Follow treatment steps\n3. Buy required products from Marketplace\n4. Track progress in History"
    },
    {
        "keywords": ["apple black rot", "black rot", "apple scab", "fungus"],
        "response": "1. Remove and destroy infected fruit, leaves, and cankers.\n2. Prune branches 15–20 cm below the visible damage.\n3. Disinfect pruning tools with 70% alcohol between cuts.\n4. Spray Copper Oxychloride every 10–14 days.\n5. Improve canopy air circulation to prevent spreading.\n\nIs the infection mostly on leaves or fruits? 🍎"
    },
    {
        "keywords": ["tomato blight", "early blight", "late blight"],
        "response": "1. Remove the affected leaves immediately.\n2. Apply Mancozeb or Copper Oxychloride weekly.\n3. Water only at the base of the plant.\n4. Improve plant staking for better airflow.\n\nAre you seeing this on a few plants or the entire crop?"
    },
    {
        "keywords": ["mildew", "powdery mildew", "white powder", "white spots"],
        "response": "1. Spray Potassium Bicarbonate or Neem oil.\n2. Spray in the morning so plants dry quickly.\n3. Make sure to cover the undersides of the leaves.\n4. Ensure good air circulation around the plants.\n\nIs the white powder fully covering the leaves or just in spots?"
    },
    {
        "keywords": ["aphids", "greenbugs", "sap sucking", "curling leaves"],
        "response": "1. Blast insects off with a strong water hose.\n2. Spray Neem oil (5mL/L) heavily in the evening.\n3. Use insecticidal soap for thick clusters.\n4. Avoid excess nitrogen fertilizer.\n\nAre there ants farming the aphids nearby? 🐜"
    },
    {
        "keywords": ["soil", "npk", "ph", "test", "analysis"],
        "response": "1. Perform a local soil test to get N, P, K, and pH values.\n2. Enter your values into the Soil Analysis tool.\n3. Follow the custom fertilizer and pH recommendations given.\n\nDo you currently know any of your soil values?"
    },
    {
        "keywords": ["nitrogen", "urea", "yellow leaves"],
        "response": "1. Apply Urea or a Nitrogen-rich fertilizer.\n2. Water the plant immediately after applying.\n3. Do not over-apply because it causes root burn.\n\nAre the older leaves yellowing first?"
    }
]

def get_ai_response(user_message):
    '''Mock AI response generator tailored to the exact strict AI persona rules provided by user.'''
    msg = user_message.lower()
    
    # Check severity cost queries
    if "severity" in msg:
        if "minor" in msg or "low" in msg:
            return "Estimated Treatment Cost:\n~ NPR 250"
        elif "moderate" in msg:
            return "Estimated Treatment Cost:\n~ NPR 350"
        elif "severe" in msg or "high" in msg or "critical" in msg:
            return "Estimated Treatment Cost:\n~ NPR 450"
        else:
            return "Estimated Treatment Cost is ~ NPR 250 - 450.\n\nPlease specify if the damage is minor, moderate, or severe."
            
    # Check known
    for item in KNOWLEDGE_BASE:
        for kw in item["keywords"]:
            if kw in msg:
                return item["response"]
                
    # Fallback (out of scope handling per rules)
    return "I mainly help with plant health topics like diseases, fertilizers, and pest control.\n\nFeel free to ask anything related to plant care."
