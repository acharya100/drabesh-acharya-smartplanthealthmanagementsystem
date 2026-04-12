"""
Soil Analysis Engine
Computes soil health score, detects nutrient deficiencies, and recommends fertilizers.
"""


# Optimal ranges (kg/ha for N, P, K; standard for pH)
OPTIMAL_RANGES = {
    'nitrogen':   {'low': 240, 'high': 280},
    'phosphorus': {'low': 50,  'high': 100},
    'potassium':  {'low': 200, 'high': 300},
    'ph_level':   {'low': 6.0, 'high': 7.5},
    'moisture':   {'low': 40,  'high': 65},
}

# Recommendations for each deficit
DEFICIENCY_RECOMMENDATIONS = {
    'nitrogen':   {
        'name': 'Nitrogen (N)',
        'suggestion': 'Apply urea (46-0-0) or ammonium sulfate. Use 50-100 kg/ha split in 2 doses.',
        'product_keywords': ['npk', 'fertilizer', 'nitrogen', 'urea'],
    },
    'phosphorus': {
        'name': 'Phosphorus (P)',
        'suggestion': 'Apply DAP (18-46-0) or single super phosphate (SSP) before planting.',
        'product_keywords': ['npk', 'dap', 'phosphate', 'fertilizer'],
    },
    'potassium':  {
        'name': 'Potassium (K)',
        'suggestion': 'Apply Muriate of Potash (MOP) or SOP. Helps with disease resistance and fruit quality.',
        'product_keywords': ['potash', 'npk', 'fertilizer'],
    },
    'ph_acidic':  {
        'name': 'Soil pH (too acidic)',
        'suggestion': 'Apply agricultural lime (CaCO3) at 1-2 tonnes/ha. Recheck pH after 4 weeks.',
        'product_keywords': ['lime', 'chalk', 'ph'],
    },
    'ph_alkaline':{
        'name': 'Soil pH (too alkaline)',
        'suggestion': 'Apply elemental sulfur or peat to lower pH. Avoid over-liming.',
        'product_keywords': ['sulphur', 'sulfur', 'peat'],
    },
    'moisture_low': {
        'name': 'Low Moisture',
        'suggestion': 'Increase irrigation frequency. Consider mulching with organic matter to retain moisture.',
        'product_keywords': ['mulch', 'organic'],
    },
    'moisture_high': {
        'name': 'High Moisture / Waterlogging',
        'suggestion': 'Improve drainage channels. Avoid over-irrigation. Consider raised beds.',
        'product_keywords': [],
    },
}

SOIL_TYPE_NOTES = {
    'sandy':  'Sandy soil drains quickly — apply fertilizer more frequently in smaller doses. Add organic matter.',
    'loamy':  'Loamy soil is ideal. Maintain organic matter with compost additions annually.',
    'clay':   'Clay soil retains water and nutrients well but may become waterlogged. Add gypsum to improve structure.',
    'silty':  'Silty soil is fertile but prone to compaction. Avoid heavy machinery. Add compost.',
    'peaty':  'Peaty soil is acidic and rich in organic matter. May need liming. Good water retention.',
    'chalky': 'Chalky soil is alkaline. Choose lime-tolerant crops. Add acidic fertilizers.',
}


def compute_score(nitrogen, phosphorus, potassium, ph_level, moisture):
    """Return a 0-100 health score."""
    score = 100
    deductions = []

    def penalize(val, r, weight):
        if val < r['low']:
            deficit = (r['low'] - val) / r['low']
            deductions.append(min(deficit * weight, weight))
        elif val > r['high']:
            surplus = (val - r['high']) / r['high']
            deductions.append(min(surplus * weight * 0.5, weight * 0.5))

    penalize(nitrogen,   OPTIMAL_RANGES['nitrogen'],   25)
    penalize(phosphorus, OPTIMAL_RANGES['phosphorus'], 20)
    penalize(potassium,  OPTIMAL_RANGES['potassium'],  20)
    penalize(ph_level,   OPTIMAL_RANGES['ph_level'],   20)
    penalize(moisture,   OPTIMAL_RANGES['moisture'],   15)

    total_deduction = sum(deductions)
    return max(0, int(score - total_deduction))


def detect_deficiencies(nitrogen, phosphorus, potassium, ph_level, moisture):
    """Return list of deficiency keys."""
    deficiencies = []

    def check(param, val, key):
        r = OPTIMAL_RANGES[param]
        if val < r['low']:
            deficiencies.append(key)

    check('nitrogen',   nitrogen,   'nitrogen')
    check('phosphorus', phosphorus, 'phosphorus')
    check('potassium',  potassium,  'potassium')

    if ph_level < OPTIMAL_RANGES['ph_level']['low']:
        deficiencies.append('ph_acidic')
    elif ph_level > OPTIMAL_RANGES['ph_level']['high']:
        deficiencies.append('ph_alkaline')

    if moisture < OPTIMAL_RANGES['moisture']['low']:
        deficiencies.append('moisture_low')
    elif moisture > OPTIMAL_RANGES['moisture']['high']:
        deficiencies.append('moisture_high')

    return deficiencies


def build_recommendations(deficiencies, soil_type):
    """Return actionable recommendations list."""
    recs = []
    for key in deficiencies:
        info = DEFICIENCY_RECOMMENDATIONS.get(key)
        if info:
            recs.append({
                'nutrient': info['name'],
                'suggestion': info['suggestion'],
                'severity': 'high' if key in ('nitrogen', 'ph_acidic', 'ph_alkaline') else 'medium',
            })

    # Add soil-type specific note
    soil_note = SOIL_TYPE_NOTES.get(soil_type)
    if soil_note:
        recs.append({
            'nutrient': f'Soil Type Note ({soil_type.title()})',
            'suggestion': soil_note,
            'severity': 'info',
        })
    return recs


def find_suggested_products(deficiencies):
    """Return list of ecommerce product IDs relevant to deficiencies."""
    try:
        from ecommerce.models import Product
        keywords = set()
        for key in deficiencies:
            info = DEFICIENCY_RECOMMENDATIONS.get(key, {})
            keywords.update(info.get('product_keywords', []))

        if not keywords:
            return []

        from django.db.models import Q
        q = Q()
        for kw in keywords:
            q |= Q(name__icontains=kw) | Q(tags__icontains=kw) | Q(description__icontains=kw)

        products = Product.objects.filter(q, is_active=True)[:5]
        return [{'id': p.id, 'name': p.name, 'price': str(p.price), 'image': p.image.url if p.image else None}
                for p in products]
    except Exception:
        return []


def analyze_soil(nitrogen, phosphorus, potassium, ph_level, moisture, soil_type):
    """Main entry point. Returns dict with score, deficiencies, recommendations, products."""
    score = compute_score(nitrogen, phosphorus, potassium, ph_level, moisture)
    deficiencies = detect_deficiencies(nitrogen, phosphorus, potassium, ph_level, moisture)
    recommendations = build_recommendations(deficiencies, soil_type)
    suggested_products = find_suggested_products(deficiencies)

    return {
        'health_score': score,
        'deficiencies': [DEFICIENCY_RECOMMENDATIONS[d]['name'] for d in deficiencies],
        'recommendations': recommendations,
        'suggested_products': suggested_products,
    }
