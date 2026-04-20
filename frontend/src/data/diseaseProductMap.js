

const DISEASE_PRODUCT_MAP = {
  // -- Fungal diseases --------------------------------------------------------
  "apple black rot": {
    treatable: true,
    keywords: ["captan", "copper", "fungicide", "mancozeb"],
    instructions: [
      "Apply copper-based fungicide every 7-10 days during wet weather.",
      "Remove and destroy all infected fruits and branches.",
      "Prune to improve airflow before the growing season.",
    ],
  },
  "apple scab": {
    treatable: true,
    keywords: ["captan", "fungicide", "sulfur", "copper"],
    instructions: [
      "Apply protectant fungicide before wet periods.",
      "Rake and dispose of fallen leaves to reduce overwintering spores.",
      "Avoid wetting foliage when irrigating.",
    ],
  },
  "apple rust": {
    treatable: true,
    keywords: ["myclobutanil", "fungicide", "sulfur"],
    instructions: [
      "Apply fungicide at first sign of orange lesions.",
      "Remove nearby juniper/cedar hosts if possible.",
      "Repeat spray every 10 days during humid conditions.",
    ],
  },
  "cedar apple rust": {
    treatable: true,
    keywords: ["myclobutanil", "fungicide", "sulfur"],
    instructions: [
      "Begin fungicide application at pink bud stage.",
      "Remove galls from cedar trees nearby.",
      "Spray every 10-14 days through petal fall.",
    ],
  },
  "corn northern leaf blight": {
    treatable: true,
    keywords: ["azoxystrobin", "fungicide", "propiconazole", "mancozeb"],
    instructions: [
      "Apply foliar fungicide at first lesion appearance.",
      "Ensure good field drainage to reduce humidity.",
      "Rotate crops - avoid planting corn in same field consecutive years.",
    ],
  },
  "corn gray leaf spot": {
    treatable: true,
    keywords: ["azoxystrobin", "fungicide", "propiconazole"],
    instructions: [
      "Spray at early tasseling stage.",
      "Use resistant corn hybrids in future planting.",
      "Tillage reduces residue-borne inoculum.",
    ],
  },
  "corn common rust": {
    treatable: true,
    keywords: ["fungicide", "mancozeb", "azoxystrobin", "triazole"],
    instructions: [
      "Apply fungicide at first pustule appearance.",
      "Use resistant varieties.",
      "Monitor fields weekly during warm humid periods.",
    ],
  },
  "grape black rot": {
    treatable: true,
    keywords: ["myclobutanil", "captan", "fungicide", "mancozeb"],
    instructions: [
      "Apply fungicide from bud break through veraison.",
      "Remove mummified berries and canes.",
      "Prune for open canopy and airflow.",
    ],
  },
  "grape leaf blight": {
    treatable: true,
    keywords: ["copper", "fungicide", "mancozeb"],
    instructions: [
      "Spray copper fungicide at bud break.",
      "Remove infected leaves immediately.",
      "Avoid overhead irrigation.",
    ],
  },
  "grape powdery mildew": {
    treatable: true,
    keywords: ["sulfur", "fungicide", "potassium bicarbonate"],
    instructions: [
      "Apply sulfur-based fungicide when temperatures are 10-32  C.",
      "Do not apply sulfur in temperatures above 32  C.",
      "Improve canopy airflow by leaf removal.",
    ],
  },
  "potato early blight": {
    treatable: true,
    keywords: ["chlorothalonil", "fungicide", "mancozeb", "copper"],
    instructions: [
      "Spray at first sign of lower leaf lesions.",
      "Repeat every 7-10 days in humid weather.",
      "Avoid excessive nitrogen fertilization.",
    ],
  },
  "potato late blight": {
    treatable: true,
    keywords: ["chlorothalonil", "mancozeb", "cymoxanil", "fungicide", "copper"],
    instructions: [
      "Apply preventive fungicide before blight season.",
      "Destroy infected plant material - do not compost.",
      "Plant certified disease-free seed potatoes.",
    ],
  },
  "tomato early blight": {
    treatable: true,
    keywords: ["chlorothalonil", "fungicide", "copper", "mancozeb"],
    instructions: [
      "Apply fungicide at first sign of brown target-spot lesions.",
      "Mulch around base to prevent soil splash.",
      "Remove lower infected leaves immediately.",
    ],
  },
  "tomato late blight": {
    treatable: true,
    keywords: ["chlorothalonil", "mancozeb", "cymoxanil", "fungicide", "copper"],
    instructions: [
      "Apply preventive copper fungicide before wet periods.",
      "Avoid overhead watering.",
      "Remove and destroy all infected plants.",
    ],
  },
  "tomato leaf mold": {
    treatable: true,
    keywords: ["copper", "fungicide", "chlorothalonil"],
    instructions: [
      "Reduce humidity - improve greenhouse ventilation.",
      "Apply copper fungicide at first pale spots.",
      "Avoid wetting leaves when watering.",
    ],
  },
  "tomato septoria leaf spot": {
    treatable: true,
    keywords: ["chlorothalonil", "fungicide", "copper", "mancozeb"],
    instructions: [
      "Spray copper or chlorothalonil at first symptom.",
      "Remove infected leaves at base.",
      "Rotate crops and avoid planting tomatoes in the same spot.",
    ],
  },
  "squash powdery mildew": {
    treatable: true,
    keywords: ["sulfur", "potassium bicarbonate", "neem", "fungicide"],
    instructions: [
      "Apply neem oil or sulfur at first white powdery spots.",
      "Spray in early morning - avoid afternoon heat.",
      "Improve air circulation between plants.",
    ],
  },
  "cherry powdery mildew": {
    treatable: true,
    keywords: ["sulfur", "fungicide", "myclobutanil"],
    instructions: [
      "Apply sulfur spray at bud break.",
      "Prune to open canopy.",
      "Avoid excess nitrogen which promotes soft growth.",
    ],
  },
  "peach bacterial spot": {
    treatable: true,
    keywords: ["copper", "bactericide", "oxytetracycline"],
    instructions: [
      "Apply copper bactericide from shuck split through harvest.",
      "Spray following rain events.",
      "Plant resistant peach varieties.",
    ],
  },
  "strawberry leaf scorch": {
    treatable: true,
    keywords: ["copper", "fungicide", "captan"],
    instructions: [
      "Apply captan or copper at first symptom.",
      "Remove old foliage after harvest.",
      "Avoid dense planting - maintain spacing.",
    ],
  },

  // -- Bacterial diseases -----------------------------------------------------
  "fire blight": {
    treatable: true,
    keywords: ["copper", "bactericide", "streptomycin"],
    instructions: [
      "Apply copper bactericide during bloom.",
      "Prune infected wood at least 30 cm below visible canker.",
      "Disinfect tools between cuts with 70% alcohol.",
    ],
  },

  // -- Viral diseases (no chemical cure) -------------------------------------
  "tomato yellow leaf curl virus": {
    treatable: false,
    keywords: ["neem", "insecticide", "sticky trap"],   // only bio-control for the whitefly vector
    preventionGuidance: [
      "Remove and destroy all infected plants immediately.",
      "Control whitefly vectors with yellow sticky traps or neem oil.",
      "Use reflective mulch to deter whiteflies.",
      "Plant certified virus-free transplants.",
      "Choose resistant cultivars for future planting.",
    ],
    instructions: [
      "No chemical cure exists - focus on vector (whitefly) control.",
      "Spray neem oil on underside of leaves to repel whiteflies.",
      "Monitor regularly and remove new infections early.",
    ],
  },
  "tomato mosaic virus": {
    treatable: false,
    keywords: [],
    preventionGuidance: [
      "Remove and destroy all infected plants - do not compost.",
      "Disinfect all tools and hands with soap before touching plants.",
      "Use virus-indexed, certified seeds.",
      "Control aphid vectors with neem oil or insecticidal soap.",
    ],
    instructions: [
      "No chemical treatment available.",
      "Eliminate the source - remove infected plants.",
      "Prevent spread by not touching infected then healthy plants.",
    ],
  },
  "corn smut": {
    treatable: false,
    keywords: [],
    preventionGuidance: [
      "Remove and destroy galls before they rupture.",
      "Do not incorporate infected material into soil.",
      "Use resistant hybrids.",
      "Rotate crops and avoid injuring plants (entry points for fungus).",
    ],
    instructions: [
      "No effective fungicide for corn smut after infection.",
      "Prevention through crop rotation and resistant varieties is key.",
      "Bag and remove all galls before spore release.",
    ],
  },
};

// -- Normalise disease name for lookup ----------------------------------------
export const normaliseName = (name = "") => name.toLowerCase().trim();

/**
 * Look up disease entry.
 * Falls back to partial matching if exact key not found.
 */
export const getDiseaseEntry = (diseaseName) => {
  if (!diseaseName) return null;
  const norm = normaliseName(diseaseName);

  // Exact match
  if (DISEASE_PRODUCT_MAP[norm]) return DISEASE_PRODUCT_MAP[norm];

  // Partial match - check if any key is contained in the query or vice versa
  for (const key of Object.keys(DISEASE_PRODUCT_MAP)) {
    if (norm.includes(key) || key.includes(norm)) {
      return DISEASE_PRODUCT_MAP[key];
    }
  }
  return null;
};

/**
 * Filter marketplace products to those relevant for a disease.
 * Returns max `limit` results.
 */
export const getRelevantProducts = (diseaseName, allProducts, limit = 3) => {
  const entry = getDiseaseEntry(diseaseName);
  if (!entry || !entry.treatable || !entry.keywords?.length) return [];

  return allProducts
    .filter(p => {
      const haystack = `${p.name} ${p.description} ${p.tags || ""}`.toLowerCase();
      return entry.keywords.some(kw => haystack.includes(kw.toLowerCase()));
    })
    .slice(0, limit);
};

/**
 * Build a concise chat response for "what product for [disease]?"
 */
export const buildChatProductResponse = (diseaseName, relevantProducts) => {
  const entry = getDiseaseEntry(diseaseName);
  if (!entry) {
    return `I couldn't find specific product recommendations for **${diseaseName}**. Please consult a local agronomist.`;
  }

  const lines = [];
  lines.push(`**${diseaseName}** - ${entry.treatable ? "fungal/bacterial disease that can be managed chemically." : "viral disease with no chemical cure."}`);
  lines.push("");

  if (!entry.treatable) {
    lines.push("**Prevention Guidance:**");
    entry.preventionGuidance.forEach(g => lines.push(`* ${g}`));
    if (relevantProducts.length) {
      lines.push("");
      lines.push("**Supportive Products (bio-control / vectors):**");
      relevantProducts.forEach(p => lines.push(`* **${p.name}** - NPR ${parseFloat(p.effective_price || p.price).toLocaleString()}`));
    }
  } else {
    if (relevantProducts.length) {
      lines.push("**Recommended Products:**");
      relevantProducts.slice(0, 2).forEach(p =>
        lines.push(`* **${p.name}** - NPR ${parseFloat(p.effective_price || p.price).toLocaleString()}`)
      );
      lines.push("");
    }
    lines.push("**Usage Instructions:**");
    entry.instructions.forEach(i => lines.push(`* ${i}`));
  }

  return lines.join("\n");
};

export default DISEASE_PRODUCT_MAP;
