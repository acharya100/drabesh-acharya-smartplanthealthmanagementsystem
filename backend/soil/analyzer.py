# -- Optimal ranges (scientifically validated for South Asian crops) ----------
OPTIMAL_RANGES = {
    'nitrogen':       {'low': 250, 'high': 300},   # kg/ha
    'phosphorus':     {'low': 60,  'high': 120},   # kg/ha
    'potassium':      {'low': 220, 'high': 350},   # kg/ha
    'ph_level':       {'low': 6.5, 'high': 7.2},   # pH units
    'moisture':       {'low': 45,  'high': 70},    # %
    'organic_matter': {'low': 3.5, 'high': 7.0},  # %
}

# -- Per-deficiency data --------------------------------------------------------
DEFICIENCY_RECOMMENDATIONS = {
    'nitrogen': {
        'name': 'Nitrogen (N) Deficiency',
        'explanation': (
            'Nitrogen (N) is critically low. Nitrogen is the primary driver of vegetative growth, '
            'essential for chlorophyll synthesis. Deficiency manifests as uniform yellowing '
            'of older leaves and stunted, spindly stalks.'
        ),
        'suggestion': (
            'Apply Urea (46% N) at 50-100 kg/ha or Ammonium Sulphate. For organic systems, '
            'incorporate high-quality compost, blood meal, or green manure crops like Sesbania. '
            'Split applications are vital to prevent leaching losses.'
        ),
        'product_keywords': ['urea', 'nitrogen', 'npk', 'manure', 'organic'],
        'severity': 'high',
    },
    'phosphorus': {
        'name': 'Phosphorus (P) Deficiency',
        'explanation': (
            'Phosphorus (P) is below the optimal threshold. P is critical for root architecture '
            'and energy transfer (ATP). Deficiency often causes dark green or purple-tinted '
            'leaves and delayed maturity in crops.'
        ),
        'suggestion': (
            'Apply DAP (Diammonium Phosphate) or Single Super Phosphate (SSP) at 100-150 kg/ha. '
            'In organic fields, use bone meal or rock phosphate. Ensure soil pH is near neutral '
            'to maximize P-availability.'
        ),
        'product_keywords': ['dap', 'phosphate', 'ssp', 'fertilizer'],
        'severity': 'medium',
    },
    'potassium': {
        'name': 'Potassium (K) Deficiency',
        'explanation': (
            'Potassium (K) levels are insufficient. K regulates stomatal opening and water '
            'stress tolerance. Deficiency leads to "firing" or necrosis along the leaf margins '
            'and reduced fruit quality/size.'
        ),
        'suggestion': (
            'Apply Muriate of Potash (MOP) or Potassium Sulphate (SOP) at 60-120 kg/ha. '
            'Wood ash is an excellent organic source. Potassium is essential for crop '
            'resilience against drought and disease.'
        ),
        'product_keywords': ['potash', 'mop', 'sop', 'fertilizer', 'ash'],
        'severity': 'medium',
    },
    'ph_acidic': {
        'name': 'High Soil Acidity (Low pH)',
        'explanation': (
            'Soil pH is below 6.5, indicating acidity. This locks up essential nutrients like '
            'Phosphorus and Calcium while increasing the solubility of toxic Aluminium, '
            'which stunts root growth.'
        ),
        'suggestion': (
            'Apply agricultural lime (calcium carbonate) or dolomite. The dosage depends on '
            'soil texture; typically 1-3 tonnes/ha. Incorporate thoroughly into the topsoil '
            'and allow 2-3 months for the reaction to stabilize pH.'
        ),
        'product_keywords': ['lime', 'dolomite', 'calcium', 'ph-buffer'],
        'severity': 'high',
    },
    'ph_alkaline': {
        'name': 'High Soil Alkalinity (High pH)',
        'explanation': (
            'Soil pH exceeds 7.2, indicating alkalinity. This causes micronutrient deficiencies '
            '(Iron, Zinc, Manganese) even if they are present in the soil, leading to '
            'interveinal chlorosis in young leaves.'
        ),
        'suggestion': (
            'Apply elemental sulphur or acidifying fertilizers like Ammonium Sulphate. '
            'Incorporate organic matter like peat or compost to naturally buffer the pH. '
            'Avoid irrigation with high-bicarbonate water.'
        ),
        'product_keywords': ['sulphur', 'sulfur', 'ammonium-sulphate', 'acidifier'],
        'severity': 'high',
    },
    'moisture_low': {
        'name': 'Severe Moisture Stress',
        'explanation': (
            'Soil moisture is below the 45% threshold. Water is the medium for nutrient '
            'transport; without it, plants cannot uptake minerals, leading to wilting '
            'and metabolic shutdown.'
        ),
        'suggestion': (
            'Implement drip irrigation to target the root zone directly. Apply mulch (straw, '
            'leaves, or plastic) to reduce evaporation and maintain soil temperature. '
            'Improve soil structure with organic matter to increase water-holding capacity.'
        ),
        'product_keywords': ['mulch', 'irrigation', 'moisture-meter', 'compost'],
        'severity': 'medium',
    },
    'moisture_high': {
        'name': 'Soil Waterlogging (High Moisture)',
        'explanation': (
            'Soil moisture exceeds 70%. Excessive water displaces oxygen in the soil pores, '
            'leading to root asphyxiation and the growth of anaerobic pathogens.'
        ),
        'suggestion': (
            'Improve field drainage by creating trenches or using raised beds. Incorporate coarse organic matter to improve soil aeration.'
        ),
        'product_keywords': ['drainage', 'gypsum', 'perlite'],
        'severity': 'medium',
    },
    'organic_matter_low': {
        'name': 'Depleted Organic Matter',
        'explanation': (
            'Organic matter (OM) is below 3.5%. OM is the foundation of soil fertility, '
            'providing a slow-release nutrient reservoir and improving soil structure '
            'for better aeration and water retention.'
        ),
        'suggestion': (
            'Apply 5-10 tonnes/ha of well-decomposed farmyard manure or vermicompost. '
            'Integrate green manure crops (legumes) into the rotation. Minimize deep '
            'tillage to prevent the oxidation of existing organic carbon.'
        ),
        'product_keywords': ['compost', 'vermicompost', 'manure', 'humus'],
        'severity': 'medium',
    },
}

SOIL_TYPE_NOTES = {
    'sandy': (
        'Sandy soil drains very quickly and has low nutrient retention. '
        'Apply fertilizers in smaller, more frequent doses (split applications) to prevent leaching. '
        'Regular additions of organic compost are essential to improve structure and water retention.'
    ),
    'loamy': (
        'Loamy soil is the ideal agricultural soil type with good drainage, '
        'aeration, and nutrient retention. Maintain this balance with annual '
        'organic matter additions (compost or manure at 3-5 t/ha).'
    ),
    'clay': (
        'Clay soil retains water and nutrients well but is prone to waterlogging '
        'and compaction. Add gypsum (calcium sulphate) at 1-2 t/ha to improve '
        'structure. Avoid tillage when wet. Raised beds can improve drainage significantly.'
    ),
    'silty': (
        'Silty soil is fertile but compacts easily, reducing aeration and root penetration. '
        'Avoid heavy machinery when wet. Regular additions of organic matter '
        'improve structure. Use cover crops to protect the surface.'
    ),
    'peaty': (
        'Peaty soil is naturally acidic and rich in organic matter but may need liming '
        'to raise pH for most crops. It has excellent water retention. '
        'Avoid over-drainage which causes irreversible shrinkage.'
    ),
    'chalky': (
        'Chalky soil is naturally alkaline and shallow. Most nutrients except molybdenum '
        'are less available. Choose lime-tolerant crops and apply acidifying fertilizers. '
        'Organic matter additions are crucial as chalky soils have low natural fertility.'
    ),
}


def _compute_organic_matter_from_inputs(nitrogen, moisture, soil_type):
    """
    When organic_matter is not supplied, derive a deterministic estimate
    from the nutrient levels and soil type. This is a heuristic, NOT random.
    Logic: higher N + higher moisture + better soil type = more organic matter.
    """
    base = {
        'sandy': 1.5, 'loamy': 3.5, 'clay': 3.0,
        'silty': 2.5, 'peaty': 8.0, 'chalky': 1.0,
    }.get(soil_type, 2.0)

    # N level contribution (0-280+ kg/ha -> adjust +/-1.5%)
    n_factor = min((nitrogen / 280.0) * 1.5, 1.5)

    # Moisture contribution (40-65% ideal -> adds up to 0.5%)
    m_factor = min((moisture / 65.0) * 0.5, 0.5)

    # Clamp to realistic range
    result = round(base + n_factor + m_factor, 1)
    return min(max(result, 0.5), 12.0)


def compute_score(nitrogen, phosphorus, potassium, ph_level, moisture, organic_matter):
    """Return a deterministic 0-100 soil health score."""
    score = 100.0
    deductions = []

    def penalize(val, r, weight):
        if val < r['low']:
            deficit = (r['low'] - val) / r['low']
            deductions.append(min(deficit * weight, weight))
        elif val > r['high']:
            surplus = (val - r['high']) / r['high']
            deductions.append(min(surplus * weight * 0.5, weight * 0.5))

    penalize(nitrogen,       OPTIMAL_RANGES['nitrogen'],       22)
    penalize(phosphorus,     OPTIMAL_RANGES['phosphorus'],     18)
    penalize(potassium,      OPTIMAL_RANGES['potassium'],      18)
    penalize(ph_level,       OPTIMAL_RANGES['ph_level'],       20)
    penalize(moisture,       OPTIMAL_RANGES['moisture'],       12)
    penalize(organic_matter, OPTIMAL_RANGES['organic_matter'], 10)

    return max(0, int(score - sum(deductions)))


def detect_deficiencies(nitrogen, phosphorus, potassium, ph_level, moisture, organic_matter):
    """Return list of deficiency keys detected from the input values."""
    deficiencies = []
    r = OPTIMAL_RANGES

    if nitrogen < r['nitrogen']['low']:
        deficiencies.append('nitrogen')
    if phosphorus < r['phosphorus']['low']:
        deficiencies.append('phosphorus')
    if potassium < r['potassium']['low']:
        deficiencies.append('potassium')

    if ph_level < r['ph_level']['low']:
        deficiencies.append('ph_acidic')
    elif ph_level > r['ph_level']['high']:
        deficiencies.append('ph_alkaline')

    if moisture < r['moisture']['low']:
        deficiencies.append('moisture_low')
    elif moisture > r['moisture']['high']:
        deficiencies.append('moisture_high')

    if organic_matter < r['organic_matter']['low']:
        deficiencies.append('organic_matter_low')

    return deficiencies


def build_recommendations(deficiencies, soil_type):
    """Return actionable recommendations list with explanations."""
    recs = []
    for key in deficiencies:
        info = DEFICIENCY_RECOMMENDATIONS.get(key)
        if info:
            recs.append({
                'nutrient':    info['name'],
                'explanation': info['explanation'],
                'suggestion':  info['suggestion'],
                'severity':    info.get('severity', 'medium'),
            })

    # Add soil-type specific note as an informational recommendation
    soil_note = SOIL_TYPE_NOTES.get(soil_type)
    if soil_note:
        recs.append({
            'nutrient':    f'Soil Type Advisory ({soil_type.title()})',
            'explanation': f'Your soil is classified as {soil_type}. '
                           f'This affects how fertilizers and water behave in your field.',
            'suggestion':  soil_note,
            'severity':    'info',
        })
    return recs


def build_overall_explanation(score, deficiencies):
    """Generate a single human-readable summary of the soil health."""
    if score >= 75:
        return (
            'Your soil is in excellent condition. All key nutrient levels, '
            'pH, and moisture are within optimal agricultural ranges. '
            'Continue current management practices and re-test annually to maintain this balance.'
        )
    elif score >= 50:
        count = len([d for d in deficiencies if d not in ('moisture_high',)])
        return (
            f'Your soil has {count} area(s) that need attention. '
            'Applying the recommended treatments now will significantly improve crop yield. '
            'Re-test soil after 4-6 weeks of treatment to track improvement.'
        )
    else:
        return (
            'Your soil requires urgent improvement across multiple parameters. '
            'Without treatment, crop yield and plant health will be significantly '
            'reduced. Follow all recommendations below and re-test within 4 weeks.'
        )


def find_suggested_products(deficiencies):
    """Return marketplace product list with a reason string per product."""
    try:
        from ecommerce.models import Product
        from django.db.models import Q

        # Build keyword set from all deficiencies
        keyword_to_reason = {}
        for key in deficiencies:
            info = DEFICIENCY_RECOMMENDATIONS.get(key, {})
            for kw in info.get('product_keywords', []):
                if kw not in keyword_to_reason:
                    keyword_to_reason[kw] = info['name']

        if not keyword_to_reason:
            # No deficiencies - return 2 maintenance products
            maintenance = Product.objects.filter(
                is_active=True
            ).filter(
                Q(name__icontains='compost') | Q(name__icontains='npk') |
                Q(tags__icontains='organic') | Q(description__icontains='maintenance')
            )[:2]
            return [
                {
                    'id': p.id,
                    'name': p.name,
                    'price': str(p.price),
                    'image': p.image.url if p.image else None,
                    'reason': 'Recommended for ongoing soil maintenance and fertility upkeep.',
                }
                for p in maintenance
            ]

        # Otherwise match by keyword
        q = Q()
        for kw in keyword_to_reason:
            q |= Q(name__icontains=kw) | Q(tags__icontains=kw) | Q(description__icontains=kw)

        products = Product.objects.filter(q, is_active=True)[:6]

        result = []
        seen_ids = set()
        for p in products:
            if p.id in seen_ids:
                continue
            seen_ids.add(p.id)

            # Find which deficiency this product matches and attach reason
            name_lower = p.name.lower()
            matched_deficiency = None
            for kw, reason_name in keyword_to_reason.items():
                if kw in name_lower or kw in (p.tags or '').lower() or kw in (p.description or '').lower():
                    matched_deficiency = reason_name
                    break

            result.append({
                'id': p.id,
                'name': p.name,
                'price': str(p.price),
                'image': p.image.url if p.image else None,
                'reason': f'Recommended to address: {matched_deficiency}.'
                          if matched_deficiency else 'Recommended to improve overall soil health.',
            })

        return result[:1]

    except Exception:
        return []


def analyze_soil(nitrogen, phosphorus, potassium, ph_level, moisture, soil_type, organic_matter=None):
    """
    Main entry point. Returns a fully-populated deterministic soil analysis result.
    All values are computed from the inputs - no randomness.
    """
    # Derive organic_matter if not provided
    if organic_matter is None:
        organic_matter = _compute_organic_matter_from_inputs(nitrogen, moisture, soil_type)

    score = compute_score(nitrogen, phosphorus, potassium, ph_level, moisture, organic_matter)
    deficiencies = detect_deficiencies(nitrogen, phosphorus, potassium, ph_level, moisture, organic_matter)
    recommendations = build_recommendations(deficiencies, soil_type)
    suggested_products = find_suggested_products(deficiencies)
    overall_explanation = build_overall_explanation(score, deficiencies)

    return {
        'health_score': score,
        'organic_matter': round(organic_matter, 1),
        'overall_explanation': overall_explanation,
        'deficiencies': [DEFICIENCY_RECOMMENDATIONS[d]['name'] for d in deficiencies],
        'recommendations': recommendations,
        'suggested_products': suggested_products,
    }
