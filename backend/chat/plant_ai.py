"""
Smart Plant Health Management System - Expert Chat Engine
Provides human-like, context-aware responses to agricultural queries.
No generic AI phrases. Responses read like advice from a knowledgeable colleague.
"""

import re


KNOWLEDGE_BASE = [

    # -- SYSTEM USAGE
    {
        "keywords": ["how to use", "how does", "guide", "tutorial", "getting started", "help me", "explain the system", "what can this do", "what does this system"],
        "response": (
            "I'm happy to help you get started! This system is designed to be your all-in-one agricultural consultant.\n\n"
            "Here's how I can help you today:\n\n"
            "* **Disease Detection** - Upload a leaf photo and I'll identify the issue with an AI-driven treatment plan.\n"
            "* **Soil Analysis** - Enter your NPK and pH levels to get professional fertilizer recommendations based on NARC/FAO standards.\n"
            "* **My Plants** - Keep a personal log of your crops and monitor their health over time.\n"
            "* **Marketplace** - You can buy recommended fertilizers and organic treatments directly from our shop.\n\n"
            "Is there a specific feature you'd like me to explain more?"
        ),
        "weight": 10,
    },
    {
        "keywords": ["outside scope", "not supported", "unrecognized plant", "not in database"],
        "response": (
            "When you see 'Outside Scope', it means the plant species in your photo is not currently supported by the disease detection model.\n\n"
            "The AI was trained on specific crops - mainly tomato, potato, apple, corn, pepper, grape, peach, cherry, and strawberry. "
            "If you upload a banana leaf, mango leaf, or any other unsupported species, the system will flag it as outside scope rather than guess incorrectly.\n\n"
            "This is intentional - it's better to tell you honestly that the plant isn't supported than to give you a wrong diagnosis.\n\n"
            "If your crop isn't supported yet, I'd recommend consulting your local agriculture office for a hands-on assessment."
        ),
        "weight": 10,
    },
    {
        "keywords": ["non-plant", "non plant", "not a plant", "non-plant image", "not a leaf", "invalid image", "wrong image"],
        "response": (
            "The 'Non-Plant Image' result means the uploaded photo doesn't appear to show a plant leaf. "
            "This could happen if the image is blurry, shows a background object, or is too dark to process.\n\n"
            "For best results:\n"
            "- Take the photo in natural daylight\n"
            "- Make sure the leaf fills most of the frame\n"
            "- Avoid shadows and reflections\n"
            "- Upload a single leaf, not the whole plant from a distance"
        ),
        "weight": 10,
    },
    {
        "keywords": ["disease detection", "how does detection work", "ai detection", "how to detect", "scan plant", "upload photo", "take photo of plant"],
        "response": (
            "The disease detection works in two stages:\n\n"
            "1. **Scope check** - The system first checks whether the image is a plant leaf and whether the species is supported.\n"
            "2. **Disease classification** - If it passes the scope check, the AI classifies the image into one of 38 disease categories (or healthy).\n\n"
            "To get accurate results, upload a clear, well-lit photo of a single leaf showing the affected area clearly. "
            "The system gives you a confidence percentage - results above 70% are generally reliable.\n\n"
            "After detection, you can start tracking treatment progress directly from the results screen."
        ),
        "weight": 9,
    },
    {
        "keywords": ["treatment history", "treatment status", "track treatment", "mark treated", "in progress", "treatment tracking"],
        "response": (
            "Treatment History keeps a log of all your disease detection scans. "
            "You can update each scan's status using the dropdown on the card:\n\n"
            "- **Untreated** - You've detected the disease but haven't started treatment yet\n"
            "- **In Progress** - You're actively treating the plant\n"
            "- **Treated** - Treatment is complete and the plant has recovered\n\n"
            "The severity level (Low, Moderate, Severe, Critical) affects the estimated treatment cost shown. "
            "You can also update the severity if it changes over time.\n\n"
            "Records marked as Healthy, Non-Plant Image, or Outside Scope don't show a cost estimate."
        ),
        "weight": 9,
    },
    {
        "keywords": ["marketplace", "shop", "buy", "store", "order", "cash on delivery", "cod", "checkout", "cart"],
        "response": (
            "Here's how to buy products from the marketplace:\n\n"
            "1. Click **Store** in the navigation bar\n"
            "2. Browse or search for products by name or category\n"
            "3. Click a product to view the details and price\n"
            "4. Click **Add to Cart** and then go to your cart (top-right icon)\n"
            "5. Click **Proceed to Checkout**, fill in your delivery details, and place the order\n\n"
            "Only **Cash on Delivery** is supported at the moment. "
            "Your order will be delivered to the address you provide at checkout.\n\n"
            "After running a Soil Analysis, the system also recommends specific products based on your soil deficiencies - so you can buy the right fertilizer without guessing."
        ),
        "weight": 9,
    },
    {
        "keywords": ["soil analysis", "soil test", "npk", "soil health", "how to analyze soil", "soil tool", "analyze soil", "enter soil values"],
        "response": (
            "The Soil Analysis tool helps you understand what your soil needs before you plant or fertilize.\n\n"
            "Here's how to use it:\n"
            "1. Measure your soil using a lab test or a soil testing kit (available at agriculture offices)\n"
            "2. Open **Soil Analysis** from the navigation bar\n"
            "3. Move the sliders to match your measured values: Nitrogen, Phosphorus, Potassium, pH, Moisture, and Organic Matter\n"
            "4. Select your soil type (Sandy, Loamy, Clay, etc.)\n"
            "5. Click **Analyze Soil**\n\n"
            "You'll get a health score from 0 to 100, a list of deficiencies, and specific fertilizer recommendations with exact application rates. "
            "The system also suggests products from the marketplace that directly address your deficiencies."
        ),
        "weight": 9,
    },
    {
        "keywords": ["dashboard", "stats", "statistics", "counts don't match", "wrong count", "plant count", "healthy count"],
        "response": (
            "The dashboard shows a summary of all your plant and detection activity:\n\n"
            "- **Total Plants** - Plants saved in My Plants\n"
            "- **Healthy Plants** - Plants confirmed healthy by the AI\n"
            "- **Unhealthy Plants** - Plants with detected diseases\n"
            "- **Outside Scope** - Scans of unsupported plant species\n"
            "- **Non-Plant Image** - Uploads that weren't plant leaves\n\n"
            "The counts include both your saved plants and your disease detection history, "
            "so even if you don't save a plant, your detection scans still count toward the dashboard totals."
        ),
        "weight": 8,
    },
    {
        "keywords": ["password", "forgot password", "reset password", "otp", "verification code", "login", "sign in", "sign up", "register", "account"],
        "response": (
            "If you've forgotten your password:\n"
            "1. Click **Forgot Password** on the login screen\n"
            "2. Enter your registered email address\n"
            "3. Check your inbox for a 6-digit verification code (valid for 2 minutes)\n"
            "4. Enter the code - if verified correctly, you'll be taken to the password reset screen\n"
            "5. Set your new password\n\n"
            "The code expires in 2 minutes for security. If it expires, just click 'Resend Code' to get a new one."
        ),
        "weight": 8,
    },

    # -- APPLE DISEASES --------------------------------------------------------
    {
        "keywords": ["apple black rot", "black rot apple", "apple rot"],
        "response": (
            "Apple Black Rot is a fungal disease caused by Botryosphaeria obtusa. "
            "It affects fruit, leaves, and the bark of twigs.\n\n"
            "**On infected trees, do this:**\n"
            "- Remove and destroy all infected fruit - don't compost it\n"
            "- Prune affected twigs at least 15 cm below the visible canker\n"
            "- Disinfect pruning tools between cuts with 70% alcohol or bleach solution\n"
            "- Spray Copper Oxychloride (50% WP) every 10-14 days during the growing season\n"
            "- Improve air circulation by thinning the tree canopy\n\n"
            "**Prevention for next season:**\n"
            "- Apply dormant copper sprays before bud break\n"
            "- Never leave fallen or mummified fruit on the ground - it overwinters the fungus"
        ),
        "weight": 12,
    },
    {
        "keywords": ["apple scab", "apple leaf spot", "apple fungus"],
        "response": (
            "Apple Scab is caused by the fungus Venturia inaequalis. "
            "It creates olive-green to dark, velvety spots on leaves and fruit.\n\n"
            "- Start fungicide sprays from bud-burst. Use Mancozeb, Captan, or Myclobutanil.\n"
            "- Spray every 7-10 days during wet periods, especially from pink bud to petal fall.\n"
            "- Rake and remove fallen leaves each autumn - the fungus overwinters in leaf litter.\n"
            "- Avoid overhead irrigation; water at the base of the tree instead.\n\n"
            "Once scab is well established in a season, it's difficult to control. "
            "Preventive spraying before infection periods is far more effective than curative treatment."
        ),
        "weight": 12,
    },
    {
        "keywords": ["apple cedar rust", "cedar apple rust", "rust apple"],
        "response": (
            "Cedar Apple Rust is caused by Gymnosporangium juniperi-virginianae. "
            "It requires two hosts to complete its life cycle - apple and juniper.\n\n"
            "- Apply myclobutanil or propiconazole from pink bud stage through petal fall\n"
            "- Remove juniper trees near your apple orchard if possible - they harbor the fungus\n"
            "- Resistant apple varieties are a long-term solution if rust is a recurring issue\n\n"
            "Bright orange or rust-colored spots on the upper leaf surface are the key sign."
        ),
        "weight": 12,
    },

    # -- TOMATO DISEASES -------------------------------------------------------
    {
        "keywords": ["tomato late blight", "late blight tomato", "phytophthora tomato"],
        "response": (
            "Tomato Late Blight, caused by Phytophthora infestans, is one of the most destructive crop diseases. "
            "It can destroy an entire field within a week under wet, cool conditions.\n\n"
            "**Immediate steps:**\n"
            "- Remove and destroy all affected plant parts - bag them and don't compost\n"
            "- Apply Mancozeb (2.5 g/L of water) or Copper Oxychloride every 5-7 days\n"
            "- Water only at the soil level - never from above\n"
            "- Increase spacing between plants to allow airflow\n\n"
            "**Important:** Act fast. Late blight spreads through wind and rain. "
            "If more than 30% of the plant is infected, removing the plant entirely is usually better than trying to save it."
        ),
        "weight": 12,
    },
    {
        "keywords": ["tomato early blight", "early blight tomato", "alternaria tomato"],
        "response": (
            "Tomato Early Blight is caused by Alternaria solani. "
            "It shows as dark brown spots with concentric rings (like a target) on older leaves first.\n\n"
            "- Remove and destroy infected leaves as soon as you spot them\n"
            "- Apply Mancozeb or Chlorothalonil every 7-10 days\n"
            "- Avoid wetting the foliage when watering\n"
            "- Mulch the soil around plants to prevent spores splashing up from soil\n"
            "- Stake plants to keep them off the ground\n\n"
            "Early blight usually starts on the lowest, oldest leaves. "
            "Catching it early and removing affected leaves significantly slows the spread."
        ),
        "weight": 12,
    },
    {
        "keywords": ["tomato leaf mold", "leaf mold", "cladosporium tomato"],
        "response": (
            "Tomato Leaf Mold is caused by Passalora fulva (formerly Cladosporium fulvum). "
            "It thrives in high humidity and shows as yellow patches on the upper leaf surface with olive-brown mold underneath.\n\n"
            "- Reduce humidity in the growing area - improve ventilation\n"
            "- Remove severely infected leaves\n"
            "- Apply copper-based fungicides or Chlorothalonil\n"
            "- Avoid overhead watering"
        ),
        "weight": 12,
    },
    {
        "keywords": ["tomato spider mite", "spider mite tomato", "two-spotted mite", "mite tomato"],
        "response": (
            "Spider mites on tomatoes thrive in hot, dry conditions. "
            "Look for tiny stippled dots on leaves and very fine webbing.\n\n"
            "- Spray plants thoroughly with water to knock mites off - do this early morning\n"
            "- Apply Neem oil (5 mL/L) or insecticidal soap every 5-7 days for 3 weeks\n"
            "- Miticide sprays (Abamectin or Bifenazate) work well for severe infestations\n"
            "- Keep plants well-watered - stressed, dry plants are more vulnerable\n"
            "- Introduce predatory mites (Phytoseiulus persimilis) as a biological control"
        ),
        "weight": 12,
    },
    {
        "keywords": ["tomato septoria", "septoria leaf spot", "septoria tomato"],
        "response": (
            "Septoria Leaf Spot causes small, circular spots with dark borders and a gray or white center. "
            "It attacks lower leaves first and works upward.\n\n"
            "- Remove infected leaves immediately and dispose of them away from the garden\n"
            "- Apply Mancozeb or Copper-based fungicide every 7-10 days\n"
            "- Avoid working with plants when leaves are wet (spreads spores)\n"
            "- Rotate your tomato crop at least every 2 years - the fungus survives in soil"
        ),
        "weight": 12,
    },
    {
        "keywords": ["tomato target spot", "target spot tomato"],
        "response": (
            "Tomato Target Spot, caused by Corynespora cassiicola, shows as dark, irregularly shaped spots "
            "with concentric rings. It primarily affects leaves but can also hit stems and fruit.\n\n"
            "- Remove affected leaves and improve airflow around plants\n"
            "- Apply Azoxystrobin or Tebuconazole fungicides\n"
            "- Avoid excessive nitrogen fertilization - it promotes soft, disease-prone growth\n"
            "- Maintain consistent watering to avoid plant stress"
        ),
        "weight": 12,
    },
    {
        "keywords": ["tomato healthy", "healthy tomato", "my tomato is fine", "tomato looks good"],
        "response": (
            "Great news! To keep your tomatoes healthy long-term:\n\n"
            "- Water deeply but infrequently - at the base, not from above\n"
            "- Feed with a balanced fertilizer every 2-3 weeks (use lower nitrogen once fruiting starts)\n"
            "- Support stems with stakes or cages to prevent touching the soil\n"
            "- Inspect leaves weekly - catching problems early makes a big difference\n"
            "- Rotate tomatoes to a new bed every 2 years to prevent soil-borne diseases"
        ),
        "weight": 11,
    },

    # -- POTATO DISEASES -------------------------------------------------------
    {
        "keywords": ["potato late blight", "potato blight", "late blight potato"],
        "response": (
            "Potato Late Blight, caused by Phytophthora infestans, is the same pathogen responsible for the Irish Potato Famine. "
            "It spreads extremely fast in cool, wet weather.\n\n"
            "- Spray Mancozeb or Cymoxanil + Mancozeb every 5-7 days as a preventive\n"
            "- If you already see dark, water-soaked patches on leaves, use Metalaxyl-based fungicide\n"
            "- Remove infected plant material immediately - never compost it\n"
            "- Harvest tubers before the disease reaches the stems and infects the soil\n\n"
            "Check tubers carefully before storing - infected tubers rot in storage and destroy the entire crop."
        ),
        "weight": 12,
    },
    {
        "keywords": ["potato early blight", "early blight potato", "alternaria potato"],
        "response": (
            "Potato Early Blight shows as dark brown circular spots with yellow halos on older leaves. "
            "It's caused by Alternaria solani.\n\n"
            "- Remove and burn infected leaves\n"
            "- Apply Mancozeb, Chlorothalonil, or Azoxystrobin every 7-10 days\n"
            "- Maintain adequate potassium levels - potassium-deficient plants are more vulnerable\n"
            "- Avoid overhead irrigation and plant in well-drained soil"
        ),
        "weight": 12,
    },

    # -- CORN / MAIZE DISEASES -------------------------------------------------
    {
        "keywords": ["corn gray leaf spot", "gray leaf spot", "corn leaf spot", "maize leaf spot"],
        "response": (
            "Corn Gray Leaf Spot, caused by Cercospora zeae-maydis, shows as rectangular, gray to tan lesions "
            "that run parallel to leaf veins.\n\n"
            "- Plant resistant hybrids if available in your region\n"
            "- Rotate corn with soybean or another non-host crop\n"
            "- Apply Strobilurin fungicides (Azoxystrobin, Pyraclostrobin) at tasseling if conditions are wet\n"
            "- Avoid minimum tillage monoculture - residue on the soil surface carries the fungus"
        ),
        "weight": 12,
    },
    {
        "keywords": ["corn rust", "common rust corn", "maize rust"],
        "response": (
            "Common Corn Rust, caused by Puccinia sorghi, produces brick-red to dark pustules on both leaf surfaces.\n\n"
            "- Apply Triazole or Strobilurin fungicides early when pustules first appear\n"
            "- Plant rust-resistant hybrids for your area\n"
            "- Rust typically doesn't cause major yield loss unless infection is severe and early"
        ),
        "weight": 12,
    },
    {
        "keywords": ["corn northern leaf blight", "northern leaf blight", "nlb corn"],
        "response": (
            "Northern Corn Leaf Blight, caused by Exserohilum turcicum, shows as long, cigar-shaped, grayish lesions on leaves.\n\n"
            "- Apply Azoxystrobin or Propiconazole at early stages\n"
            "- Plant resistant varieties when possible\n"
            "- Use crop rotation - the pathogen survives in crop debris\n"
            "- Infection above the ear is the most damaging - prioritize treatment if the upper canopy is affected"
        ),
        "weight": 12,
    },

    # -- PEPPER DISEASES -------------------------------------------------------
    {
        "keywords": ["pepper bacterial spot", "bacterial spot pepper", "pepper spot"],
        "response": (
            "Pepper Bacterial Spot, caused by Xanthomonas bacteria, shows as small, water-soaked spots that "
            "turn dark with a yellow halo.\n\n"
            "- Copper-based bactericides (Copper Hydroxide or Copper Oxychloride) applied every 7-10 days\n"
            "- Remove infected leaves and avoid working in the garden when plants are wet\n"
            "- Use disease-free seed and certified transplants\n"
            "- Rotate with non-solanaceous crops for at least 2 years"
        ),
        "weight": 12,
    },

    # -- GRAPE DISEASES------------------------------
    {
        "keywords": ["grape black measles", "black measles grape", "esca grape"],
        "response": (
            "Grape Black Measles is caused by a complex of wood-rotting fungi. "
            "It shows as dark streaking inside the wood and leaf scorching.\n\n"
            "- There's no direct chemical cure once vines are infected\n"
            "- Prune heavily affected parts and seal wound with fungicide paint\n"
            "- Foliar sodium arsenite (where legally permitted) can slow internal spread\n"
            "- Replace severely infected plants with certified disease-free stock"
        ),
        "weight": 12,
    },
    {
        "keywords": ["grape leaf blight", "grape blight", "isariopsis grape", "cercospora grape"],
        "response": (
            "Grape Leaf Blight shows as angular, brown lesions on leaves and can cause premature defoliation.\n\n"
            "- Apply Copper-based fungicides or Mancozeb\n"
            "- Increase airflow by proper pruning and canopy management\n"
            "- Avoid wetting foliage during irrigation\n"
            "- Remove fallen diseased leaves from the vineyard floor"
        ),
        "weight": 12,
    },

    # -- STRAWBERRY DISEASES 
    {
        "keywords": ["strawberry leaf scorch", "strawberry scorch", "strawberry leaf spot"],
        "response": (
            "Strawberry Leaf Scorch shows as dark purple spots with reddish borders that eventually cause leaf edges to curl and die.\n\n"
            "- Remove and destroy infected leaves and older foliage after harvest\n"
            "- Apply Copper hydroxide or Myclobutanil fungicide\n"
            "- Ensure good drainage - waterlogged strawberry beds are more susceptible\n"
            "- Use disease-resistant varieties when replanting"
        ),
        "weight": 12,
    },

    # -- POWDERY MILDEW (GENERAL) 
    {
        "keywords": ["powdery mildew", "white powder", "white coating", "white spots leaves", "powdery dust"],
        "response": (
            "Powdery Mildew is a fungal disease that thrives in warm, dry days combined with cool nights and high humidity. "
            "Unlike most fungal diseases, it doesn't need free water on leaves to spread.\n\n"
            "- Apply Potassium Bicarbonate or Neem oil (5 mL/L) every 7 days\n"
            "- Sulfur-based fungicides work well if applied before symptoms appear\n"
            "- Spray in the morning so plants dry fully before evening\n"
            "- Make sure to cover the undersides of leaves - that's often where it starts\n"
            "- Prune congested growth to improve air circulation\n\n"
            "Don't over-apply nitrogen fertilizer - it produces soft, lush growth that powdery mildew loves."
        ),
        "weight": 11,
    },

    # -- PESTS ----------------------------
    {
        "keywords": ["aphids", "greenfly", "blackfly", "sap sucker", "curling leaves", "sticky leaves"],
        "response": (
            "Aphids are soft-bodied insects that cluster on new growth, stems, and the underside of leaves. "
            "They weaken plants by sucking sap and can spread viruses between plants.\n\n"
            "- Blast them off with a strong jet of water - do this early morning\n"
            "- Apply Neem oil (5 mL/L of water) every 5-7 days\n"
            "- Insecticidal soap spray works well on dense colonies\n"
            "- Avoid excess nitrogen fertilizer - it produces the soft, tender growth aphids prefer\n"
            "- Introduce or encourage ladybirds (ladybugs) - they're natural aphid predators\n\n"
            "If you see ants on your plants, they're probably farming the aphids. "
            "Putting a sticky barrier on the stem base will stop ants from protecting the aphid colonies."
        ),
        "weight": 11,
    },
    {
        "keywords": ["whitefly", "white fly", "cloud of flies", "white insect"],
        "response": (
            "Whiteflies are small, sap-sucking insects that fly up in a cloud when disturbed. "
            "They weaken plants and excrete sticky honeydew that causes sooty mould.\n\n"
            "- Yellow sticky traps are very effective for monitoring and control\n"
            "- Apply Neem oil or insecticidal soap every 5-7 days, targeting the leaf undersides\n"
            "- Pyrethrin spray can give quick knock-down of heavy infestations\n"
            "- Introduce Encarsia formosa (a parasitic wasp) as biological control in greenhouses"
        ),
        "weight": 11,
    },
    {
        "keywords": ["spider mite", "red spider", "webbing on leaves", "stippled leaves", "mite"],
        "response": (
            "Spider mites are tiny arachnids (not insects) that thrive in hot, dry conditions. "
            "Signs include fine webbing and a bronze or stippled appearance on leaves.\n\n"
            "- Spray plants with water regularly - mites hate high humidity\n"
            "- Apply Neem oil or a specific miticide (Abamectin, Bifenazate)\n"
            "- Miticides work best when applied in the evening to avoid burning leaves\n"
            "- Rotate between different miticides - spider mites develop resistance quickly"
        ),
        "weight": 11,
    },

    # -- SOIL & FERTILIZERS ----------
    {
        "keywords": ["nitrogen", "urea", "yellow leaves", "leaves turning yellow", "slow growth", "pale leaves"],
        "response": (
            "Yellow leaves on older (lower) growth usually signal a nitrogen deficiency, "
            "since nitrogen moves from old leaves to new ones when supplies are short.\n\n"
            "- Apply Urea (46% N) at 50-100 kg/ha, split into two applications\n"
            "- Water the plant immediately after applying urea to prevent volatilisation\n"
            "- Ammonium Sulphate is a good alternative for acidic soils and also adds sulphur\n"
            "- Adding well-rotted compost builds up nitrogen naturally over time\n\n"
            "Note: If the yellowing is between the veins (not the whole leaf), it could be a different deficiency. "
            "Yellowing between veins on young leaves typically points to iron or manganese deficiency instead."
        ),
        "weight": 11,
    },
    {
        "keywords": ["phosphorus", "purple leaves", "reddish stem", "poor roots", "slow flowering"],
        "response": (
            "Purple or reddish discolouration on leaf undersides and stems is a classic sign of phosphorus deficiency. "
            "It's most visible in cool weather or in compacted, waterlogged soil.\n\n"
            "- Apply DAP (18-46-0) at 100-150 kg/ha before planting or early in the season\n"
            "- For existing crops, use a liquid phosphate fertilizer for quicker uptake\n"
            "- Soil pH between 6.0-7.0 is critical - phosphorus becomes unavailable in very acidic or very alkaline soil\n\n"
            "If your pH is outside 6.0-7.0, fix the pH first. Applying phosphorus to the wrong pH soil is wasteful."
        ),
        "weight": 11,
    },
    {
        "keywords": ["potassium", "brown leaf edges", "scorch edges", "brown tips", "poor fruit", "fruit quality"],
        "response": (
            "Brown or scorched leaf edges, particularly on mature leaves, are a typical sign of potassium deficiency. "
            "It also reduces fruit quality, sugar content, and disease resistance.\n\n"
            "- Apply Muriate of Potash (MOP, 0-0-60) at 60-100 kg/ha\n"
            "- For sensitive crops like tomatoes or potatoes, use Sulphate of Potash (SOP) instead - it's chloride-free\n"
            "- Apply at planting and side-dress again at fruit set for high-demand crops\n\n"
            "Potassium is especially important for fruit development. If you're growing for yield, don't skip it."
        ),
        "weight": 11,
    },
    {
        "keywords": ["soil ph", "acidic soil", "alkaline soil", "pH too low", "pH too high", "lime soil", "sulfur soil", "ph 5", "ph 8"],
        "response": (
            "Soil pH controls how well plants can absorb nutrients. Most crops do best between pH 6.0 and 7.5.\n\n"
            "**If your pH is below 6.0 (too acidic):**\n"
            "- Apply agricultural lime (calcium carbonate) at 1-3 tonnes/ha\n"
            "- Work it into the top 20 cm of soil\n"
            "- Re-test after 4-6 weeks - pH changes slowly\n\n"
            "**If your pH is above 7.5 (too alkaline):**\n"
            "- Apply elemental sulphur at 200-500 kg/ha\n"
            "- Use acidifying fertilisers like ammonium sulphate\n"
            "- Peat moss or composted pine bark can help acidify slightly over time\n\n"
            "pH affects everything else - even a perfect fertiliser program fails if the pH is wrong."
        ),
        "weight": 11,
    },
    {
        "keywords": ["organic matter", "compost", "humus", "manure", "soil biology", "poor soil structure"],
        "response": (
            "Organic matter is the foundation of healthy soil. It feeds beneficial microbes, "
            "improves water retention, and helps hold nutrients. Soil below 3% organic matter struggles to support healthy crops.\n\n"
            "- Apply 5-10 tonnes/ha of well-composted farmyard manure or vermicompost\n"
            "- Cover crops (legumes, green manure) are excellent for building organic matter between seasons\n"
            "- Avoid excessive tillage - it breaks down organic matter faster than crops can replace it\n"
            "- Mulching surface with straw or wood chips builds organic matter gradually and reduces moisture loss\n\n"
            "Building organic matter takes several seasons. It's a long-term investment with substantial returns."
        ),
        "weight": 11,
    },
    {
        "keywords": ["irrigation", "watering", "moisture", "dry soil", "water stress", "wilting", "drought"],
        "response": (
            "Water management has a bigger impact on crop health than most farmers realise.\n\n"
            "**General guidelines:**\n"
            "- Water deeply but infrequently rather than shallow and often - this encourages deep root growth\n"
            "- Water at the soil level, not from above - wet foliage is a major disease risk\n"
            "- The best time to water is early morning\n"
            "- Check soil moisture 5-10 cm below the surface - if it's dry there, it's time to water\n\n"
            "**For dry or sandy soils:** Mulch with 5-8 cm of straw, which can reduce evaporation by up to 70%.\n\n"
            "**Moisture levels for analysis:** Optimal soil moisture for most crops is 40-65%. "
            "Below 40% causes stress; above 65% risks waterlogging and root rot."
        ),
        "weight": 10,
    },

    # -- PREVENTION & GENERAL -
    {
        "keywords": ["prevention", "prevent disease", "avoid disease", "disease-free"],
        "response": (
            "Prevention is always easier (and cheaper) than treatment. Here's what experienced farmers consistently do:\n\n"
            "1. **Crop rotation** - Don't plant the same crop family in the same spot two years running\n"
            "2. **Use certified disease-free seed and transplants** - This eliminates the most common source of infection\n"
            "3. **Water at the base** - Wet foliage is a direct invitation for fungal diseases\n"
            "4. **Good spacing** - Overcrowded plants have poor airflow, which keeps leaves wet longer\n"
            "5. **Regular inspection** - Walk your field weekly. Catching problems early is the biggest factor in control\n"
            "6. **Soil health** - Healthy soil produces resilient plants. Focus on organic matter and balanced nutrition\n"
            "7. **Remove plant debris** - After harvest, clean up crop residues that harbour disease pathogens"
        ),
        "weight": 10,
    },
    {
        "keywords": ["fertilizer", "fertiliser", "feed plant", "plant food", "fertilize", "what fertilizer"],
        "response": (
            "The right fertilizer depends on what your soil actually needs. "
            "Applying without a soil test is guesswork - you might apply what you don't need and miss what you do.\n\n"
            "**General framework:**\n"
            "- Before planting: Apply a balanced NPK fertilizer (like 15-15-15) based on soil test results\n"
            "- During vegetative growth: Side-dress with nitrogen (urea or ammonium sulphate)\n"
            "- When flowering/fruiting starts: Reduce nitrogen, increase potassium\n\n"
            "Use the Soil Analysis tool in this system to get specific recommendations based on your actual soil values. "
            "It will tell you exactly what to apply, at what rate, and why."
        ),
        "weight": 10,
    },
    {
        "keywords": ["neem oil", "neem", "organic pesticide", "organic treatment", "natural remedy"],
        "response": (
            "Neem oil is one of the most versatile organic pesticides available. "
            "It works against a broad range of pests (aphids, mites, whiteflies) and some fungal diseases.\n\n"
            "**How to use it correctly:**\n"
            "- Mix 5 mL pure neem oil per litre of water with a few drops of dish soap (to emulsify)\n"
            "- Spray in the evening - neem can burn leaves in direct sunlight\n"
            "- Cover all leaf surfaces, especially undersides\n"
            "- Repeat every 7 days for active infestations, every 14 days as preventive\n\n"
            "Neem degrades quickly in sunlight, so it needs regular reapplication. "
            "It also doesn't provide instant results - expect 3-7 days to see a clear reduction in pests."
        ),
        "weight": 10,
    },
]


# Matching Engine


def _score_entry(msg_lower, entry):
    """
    Score an entry by counting keyword matches and applying the entry weight.
    Returns 0 if no keywords match.
    """
    score = 0
    for kw in entry["keywords"]:
        if kw.lower() in msg_lower:
            # Longer / more specific keyword = more confidence
            score += len(kw.split()) + 1
    if score > 0:
        score *= entry.get("weight", 5)
    return score


def get_ai_response(user_message: str) -> str:
    """
    Return the best-matching response from the knowledge base.
    Falls back to a contextual, helpful reply if nothing matches well.
    """
    if not user_message or not user_message.strip():
        return "I'm here! What can I help you with today?"

    msg = user_message.lower().strip()

    # -- Quick shortcuts 
    if msg in ["hi", "hello", "hey"]:
        return "Hi there! How can I help you with your plants or soil today?"

    # -- Quick cost estimate shortcut 
    if "cost" in msg or "how much" in msg or "price treatment" in msg:
        if "minor" in msg or "low" in msg:
            return (
                "For a minor infection, we estimate the treatment cost around **NPR 250**. "
                "This usually covers a standard dose of organic pesticide or targeted fungicide."
            )
        elif "moderate" in msg:
            return (
                "For moderate severity, treatment typically costs about **NPR 350**. "
                "This accounts for multiple applications to ensure the pathogen is fully eradicated."
            )
        elif "severe" in msg or "critical" in msg or "high" in msg:
            return (
                "For critical infections, estimate around **NPR 450** for intensive treatment. "
                "At this level, the priority is saving the rest of your crop from spreading infection."
            )
        return (
            "Treatment costs are calculated based on severity:\n\n"
            "* **Minor**: NPR 250\n"
            "* **Moderate**: NPR 350\n"
            "* **Severe / Critical**: NPR 450\n\n"
            "You can find many of the required products in our **Marketplace**!"
        )

    # -- Score all entries -
    best_score = 0
    best_response = None

    for entry in KNOWLEDGE_BASE:
        score = _score_entry(msg, entry)
        if score > best_score:
            best_score = score
            best_response = entry["response"]

    # Return if we have a confident match
    if best_score >= 3:
        return best_response

    if any(w in msg for w in ["tomato", "potato", "apple", "corn", "grape", "pepper", "peach", "cherry", "strawberry", "rice", "wheat"]):
        return (
            "I'm not sure about that specific crop issue, but I'd be happy to look into it if you describe the symptoms. "
            "Are you seeing spots on the leaves, or perhaps some wilting?\n\n"
            "The best way to get a definitive answer is to upload a photo to **Disease Detection** - "
            "it can identify most common issues automatically."
        )

    if any(w in msg for w in ["soil", "fertilizer", "nutrient", "ph", "nitrogen", "potassium", "phosphorus", "compost"]):
        return (
            "That sounds like a soil health question! To give you the most accurate advice, I'd suggest running a **Soil Analysis**. "
            "Just move the sliders to match your recent test results, and I'll give you a detailed breakdown of what your field needs."
        )

    return (
        "That's an interesting question! I don't have a specific answer for that yet, but I'm knowledgeable about "
        "plant diseases, soil health, fertilizers, and how to use this system.\n\n"
        "Could you try rephrasing your question or tell me what's happening in your garden?"
    )
