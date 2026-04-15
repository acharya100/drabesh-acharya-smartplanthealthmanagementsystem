import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import os
import json


# Confidence thresholds — tuned for production accuracy
CONF_THRESHOLD_VALID      = 40.0  # Below this → Outside Scope (model not confident)
CONF_THRESHOLD_HIGH_BYPASS = 80.0  # Above this → Skip coherence check (model is certain)
CONF_THRESHOLD_NON_PLANT  = 55.0  # MobileNet threshold to declare non-plant
CONF_THRESHOLD_FOREIGN_PLANT = 45.0  # MobileNet threshold to declare out-of-scope plant


def _load_image_robust(image_path):
    """
    Opens an image from disk and always returns a clean RGB PIL image.
    Handles transparency by compositing onto a white background.
    """
    img = Image.open(image_path)
   
    img_rgba = img.convert("RGBA")
    background = Image.new('RGB', img_rgba.size, (255, 255, 255))
    # Use the alpha channel as a mask to paste over the white background
    background.paste(img_rgba, mask=img_rgba.split()[3])
    return background


MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, 'plant_disease_model.pth')

# All 39 PlantVillage classes — synchronized with training set
PLANT_VILLAGE_CLASSES = [
    'Apple___Apple_scab',
    'Apple___Black_rot',
    'Apple___Cedar_apple_rust',
    'Apple___healthy',
    'Background_without_leaves',
    'Blueberry___healthy',
    'Cherry___Powdery_mildew',
    'Cherry___healthy',
    'Corn___Cercospora_leaf_spot Gray_leaf_spot',
    'Corn___Common_rust',
    'Corn___Northern_Leaf_Blight',
    'Corn___healthy',
    'Grape___Black_rot',
    'Grape___Esca_(Black_Measles)',
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)',
    'Grape___healthy',
    'Orange___Haunglongbing_(Citrus_greening)',
    'Peach___Bacterial_spot',
    'Peach___healthy',
    'Pepper,_bell___Bacterial_spot',
    'Pepper,_bell___healthy',
    'Potato___Early_blight',
    'Potato___Late_blight',
    'Potato___healthy',
    'Raspberry___healthy',
    'Soybean___healthy',
    'Squash___Powdery_mildew',
    'Strawberry___Leaf_scorch',
    'Strawberry___healthy',
    'Tomato___Bacterial_spot',
    'Tomato___Early_blight',
    'Tomato___Late_blight',
    'Tomato___Leaf_Mold',
    'Tomato___Septoria_leaf_spot',
    'Tomato___Spider_mites Two-spotted_spider_mite',
    'Tomato___Target_Spot',
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus',
    'Tomato___Tomato_mosaic_virus',
    'Tomato___healthy'
]

# Supported plant families
SUPPORTED_PLANTS = [
    "Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange",
    "Peach", "Pepper", "Potato", "Raspberry", "Soybean", "Squash",
    "Strawberry", "Tomato"
]

# Scientific names
SCIENTIFIC_NAMES = {
    "Apple": "Malus domestica",
    "Blueberry": "Vaccinium corymbosum",
    "Cherry": "Prunus avium",
    "Corn": "Zea mays",
    "Grape": "Vitis vinifera",
    "Orange": "Citrus x sinensis",
    "Peach": "Prunus persica",
    "Pepper": "Capsicum annuum",
    "Potato": "Solanum tuberosum",
    "Raspberry": "Rubus idaeus",
    "Soybean": "Glycine max",
    "Squash": "Cucurbita pepo",
    "Strawberry": "Fragaria x ananassa",
    "Tomato": "Solanum lycopersicum",
}

LABEL_MAPPING = {
    'Apple___Apple_scab': {'plant': 'Apple', 'disease': 'Apple Scab', 'sci': 'Malus domestica', 'healthy': False},
    'Apple___Black_rot': {'plant': 'Apple', 'disease': 'Black Rot', 'sci': 'Malus domestica', 'healthy': False},
    'Apple___Cedar_apple_rust': {'plant': 'Apple', 'disease': 'Cedar Apple Rust', 'sci': 'Malus domestica', 'healthy': False},
    'Apple___healthy': {'plant': 'Apple', 'disease': 'Healthy', 'sci': 'Malus domestica', 'healthy': True},
    'Background_without_leaves': {'plant': 'Unknown', 'disease': 'Healthy', 'sci': 'Unknown', 'healthy': True},
    'Blueberry___healthy': {'plant': 'Blueberry', 'disease': 'Healthy', 'sci': 'Vaccinium corymbosum', 'healthy': True},
    'Cherry___Powdery_mildew': {'plant': 'Cherry', 'disease': 'Powdery Mildew', 'sci': 'Prunus avium', 'healthy': False},
    'Cherry___healthy': {'plant': 'Cherry', 'disease': 'Healthy', 'sci': 'Prunus avium', 'healthy': True},
    'Corn___Cercospora_leaf_spot Gray_leaf_spot': {'plant': 'Corn', 'disease': 'Cercospora Leaf Spot (Gray Leaf Spot)', 'sci': 'Zea mays', 'healthy': False},
    'Corn___Common_rust': {'plant': 'Corn', 'disease': 'Common Rust', 'sci': 'Zea mays', 'healthy': False},
    'Corn___Northern_Leaf_Blight': {'plant': 'Corn', 'disease': 'Northern Leaf Blight', 'sci': 'Zea mays', 'healthy': False},
    'Corn___healthy': {'plant': 'Corn', 'disease': 'Healthy', 'sci': 'Zea mays', 'healthy': True},
    'Grape___Black_rot': {'plant': 'Grape', 'disease': 'Black Rot', 'sci': 'Vitis vinifera', 'healthy': False},
    'Grape___Esca_(Black_Measles)': {'plant': 'Grape', 'disease': 'Esca (Black Measles)', 'sci': 'Vitis vinifera', 'healthy': False},
    'Grape___Leaf_blight_(Isariopsis_Leaf_Spot)': {'plant': 'Grape', 'disease': 'Leaf Blight (Isariopsis Leaf Spot)', 'sci': 'Vitis vinifera', 'healthy': False},
    'Grape___healthy': {'plant': 'Grape', 'disease': 'None', 'sci': 'Vitis vinifera', 'healthy': True},
    'Orange___Haunglongbing_(Citrus_greening)': {'plant': 'Orange', 'disease': 'Haunglongbing (Citrus Greening)', 'sci': 'Citrus x sinensis', 'healthy': False},
    'Peach___Bacterial_spot': {'plant': 'Peach', 'disease': 'Bacterial Spot', 'sci': 'Prunus persica', 'healthy': False},
    'Peach___healthy': {'plant': 'Peach', 'disease': 'None', 'sci': 'Prunus persica', 'healthy': True},
    'Pepper,_bell___Bacterial_spot': {'plant': 'Pepper', 'disease': 'Bacterial Spot', 'sci': 'Capsicum annuum', 'healthy': False},
    'Pepper,_bell___healthy': {'plant': 'Pepper', 'disease': 'None', 'sci': 'Capsicum annuum', 'healthy': True},
    'Potato___Early_blight': {'plant': 'Potato', 'disease': 'Early Blight', 'sci': 'Solanum tuberosum', 'healthy': False},
    'Potato___Late_blight': {'plant': 'Potato', 'disease': 'Late Blight', 'sci': 'Solanum tuberosum', 'healthy': False},
    'Potato___healthy': {'plant': 'Potato', 'disease': 'None', 'sci': 'Solanum tuberosum', 'healthy': True},
    'Raspberry___healthy': {'plant': 'Raspberry', 'disease': 'None', 'sci': 'Rubus idaeus', 'healthy': True},
    'Soybean___healthy': {'plant': 'Soybean', 'disease': 'None', 'sci': 'Glycine max', 'healthy': True},
    'Squash___Powdery_mildew': {'plant': 'Squash', 'disease': 'Powdery Mildew', 'sci': 'Cucurbita pepo', 'healthy': False},
    'Strawberry___Leaf_scorch': {'plant': 'Strawberry', 'disease': 'Leaf Scorch', 'sci': 'Fragaria x ananassa', 'healthy': False},
    'Strawberry___healthy': {'plant': 'Strawberry', 'disease': 'None', 'sci': 'Fragaria x ananassa', 'healthy': True},
    'Tomato___Bacterial_spot': {'plant': 'Tomato', 'disease': 'Bacterial Spot', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Early_blight': {'plant': 'Tomato', 'disease': 'Early Blight', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Late_blight': {'plant': 'Tomato', 'disease': 'Late Blight', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Leaf_Mold': {'plant': 'Tomato', 'disease': 'Leaf Mold', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Septoria_leaf_spot': {'plant': 'Tomato', 'disease': 'Septoria Leaf Spot', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Spider_mites Two-spotted_spider_mite': {'plant': 'Tomato', 'disease': 'Spider Mites (Two-Spotted Spider Mite)', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Target_Spot': {'plant': 'Tomato', 'disease': 'Target Spot', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Tomato_Yellow_Leaf_Curl_Virus': {'plant': 'Tomato', 'disease': 'Tomato Yellow Leaf Curl Virus', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___Tomato_mosaic_virus': {'plant': 'Tomato', 'disease': 'Tomato Mosaic Virus', 'sci': 'Solanum lycopersicum', 'healthy': False},
    'Tomato___healthy': {'plant': 'Tomato', 'disease': 'None', 'sci': 'Solanum lycopersicum', 'healthy': True}
}

# Out-of-scope plant keywords for MobileNet detection
NON_SUPPORTED_PLANT_KEYWORDS = [
    'banana', 'plantain', 'mango', 'papaya', 'pineapple', 'coconut', 'palm',
    'bamboo', 'cactus', 'agave', 'lychee', 'longan', 'rambutan', 'durian',
    'jackfruit', 'guava', 'avocado', 'kiwi', 'lemon', 'lime', 'pomegranate',
    'fig', 'mulberry', 'tamarind', 'starfruit', 'cabbage', 'broccoli',
    'artichoke', 'zucchini', 'cucumber', 'custard apple', 'cannabis', 'hemp',
    'tobacco', 'cotton', 'alfalfa', 'clover', 'mustard', 'tea', 'coffee',
    'yam', 'taro', 'cassava', 'ginger', 'turmeric', 'lotus', 'lily',
    'tulip', 'rose', 'sunflower', 'daisy', 'fern', 'oak', 'pine', 'maple',
    'birch', 'willow', 'eucalyptus', 'neem', 'tulsi', 'marigold', 'jasmine',
    'money plant', 'lichee', 'cardoon', 'buckeye', 'sycamore',
]

# Keywords that indicate a plant-like image (must be botanical features)
PLANT_RELATED_KEYWORDS = [
    'leaf', 'foliage', 'plant', 'tree', 'flower', 'vegetation', 'bloom',
    'branch', 'shrub', 'seedling', 'fruit', 'vegetable', 'organic', 'crop',
    'herb', 'stalk', 'stem', 'petal', 'bud', 'seed', 'buckeye', 'acorn',
    'head cabbage', 'zucchini', 'artichoke', 'leafhopper', 'greenhouse',
    'pot', 'vase', 'flora', 'botany', 'vine', 'ivy', 'velvet',
    'velvet', 'stinkhorn', 'gyromitra', 'earthstar', 'bolete', 'fungus', 
    'weaver', 'slug', 'stinkbug', 'earwig', 'fly', 'ant',
    'spider', 'web', 'net', 'beehive', 'honeycomb', 'corn', 'ear', 'maize',
    'jigsaw puzzle', # Spotted leaves often trigger jigsaw puzzle classes
]

# These often confound leaf models by providing 'green' context without a specific plant.
GEOGRAPHIC_SCENES = [
    'nature', 'landscape', 'field', 'meadow', 'mountain', 'valley', 'forest', 
    'wood', 'garden', 'nursery', 'park', 'grass', 'moss', 'algae', 'bush', 
    'shrubbery', 'potted plant', 'houseplant'
]

# Non-plant garbage labels from ImageNet — expanded for household/landscape/city rejection
LIKELY_GARBAGE = [
    'garment', 'person', 'dog', 'cat',
    'furniture', 'car', 'vehicle', 'bicycle', 'motorcycle', 'scooter', 'truck',
    'bike', 'dashboard', 'speedometer', 'engine', 'wheel', 'tire', 'handlebar',
    'building', 'room', 'interior', 'mountain', 'ocean', 'sea', 'sky', 'text',
    'digital', 'screen', 'laptop', 'tablet', 'chameleon', 'reptile', 'iguana',
    'toys', 'wall', 'floor', 'clothes', 'container', 'box', 'package', 'tool',
    'device', 'appliance', 'face', 'human', 'child', 'adult', 'man', 'woman',
    'group', 'crowd', 'street', 'road', 'city', 'house', 'apartment', 'kitchen',
    'bathroom', 'bedroom', 'living room', 'television', 'monitor', 'keyboard',
    'mouse', 'phone', 'clock', 'watch', 'book', 'paper', 'money', 'card', 'box',
    'shoe', 'hat', 'bag', 'wallet', 'glasses', 'umbrella', 'toy', 'ball',
    'bat', 'glove', 'instrument', 'musical', 'keyboard', 'piano', 'guitar',
    'drum', 'computer', 'laptop', 'desktop', 'table', 'chair', 'sofa', 'bed',
    'desk', 'shelf', 'cupboard', 'cabinet', 'door', 'window', 'ceiling',
    'lighting', 'lamp', 'fan', 'ac', 'heater', 'food', 'drink', 'dish',
    'plate', 'cup', 'glass', 'bottle', 'can', 'cutlery', 'spoon', 'fork', 'knife',
    'statue', 'sculpture', 'ornament', 'decoration', 'sign', 'billboard',
    'poster', 'artwork', 'painting', 'photography', 'clothing', 'accessory',
    'helmet', 'mask', 'glove', 'sock', 'jacket', 'shirt', 'pants', 'dress',
    'snow', 'ski', 'skier', 'winter', 'resort', 'outdoor',
    'plaza', 'square', 'fountain', 'bench', 'pavilion', 'monument', 'statue',
    'palace', 'monastery', 'temple', 'castle', 'church', 'tower',
]


def _log_inference(message):
    """Centralized inference logger."""
    try:
        log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'media', 'predictions')
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, 'inference_debug.log')
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(f"[AI] {message}\n")
    except Exception:
        pass


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 1 — Image Scope Validator
# Uses MobileNet (ImageNet) to classify image as:
#   - plant         → allowed into disease model
#   - non_plant     → BLOCKED, return immediately
#   - out_of_scope  → BLOCKED, return immediately
# ══════════════════════════════════════════════════════════════════════════════

class ImageScopeValidator:
    """
    Pre-validation gate. Runs BEFORE the disease model.
    If this returns non_plant or out_of_scope, the disease model is NEVER called.
    """

    def __init__(self):
        try:
            weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
            self.model = models.mobilenet_v2(weights=weights)
            self.imagenet_labels = weights.meta["categories"]
            self.model.eval()
            _log_inference("ImageScopeValidator loaded MobileNet OK")
        except Exception as e:
            _log_inference(f"ImageScopeValidator failed to load MobileNet: {e}")
            self.model = None
            self.imagenet_labels = []

        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def validate(self, image_path):
        """
        Returns a structured validation result.

        Result format:
        {
          "status": "valid" | "invalid",
          "type": "plant" | "non_plant" | "out_of_scope",
          "confidence": float (0-100),
          "identified_as": str,
          "message": str
        }
        """
        # If MobileNet failed to load, allow the image through (fail-open)
        if not self.model:
            _log_inference("[validator] MobileNet not loaded — allowing image through")
            return {
                "status": "valid",
                "type": "plant",
                "confidence": 0.0,
                "identified_as": "Unknown",
                "message": "Scope validator not available — proceeding with disease model."
            }

        try:
            input_image = _load_image_robust(image_path)
            input_tensor = self.preprocess(input_image)
            with torch.no_grad():
                output = self.model(input_tensor.unsqueeze(0))

            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            # ── 'Shield' Update: Expanding scan reach to Top 10 ──
            top10_probs, top10_indices = torch.topk(probabilities, k=min(10, len(self.imagenet_labels)))
            top10_labels = []
            for idx in top10_indices:
                top10_labels.append(self.imagenet_labels[idx.item()].lower())

            top1_conf = float(top10_probs[0].item() * 100)
            top1_label = top10_labels[0]
            
            _log_inference(
                f"[validator] Top-5: {list(zip(top10_labels[:5], [round(float(p.item()*100), 1) for p in top10_probs[:5]]))} "
                f"(Next 5 suppressed for logs)"
            )

            # ── Check 0: Is it a CERTAIN non-plant/garbage object? ──
            # Aggregate probabilities across top-10 to catch split classes
            garbage_conf = 0.0
            for label, prob in zip(top10_labels, top10_probs):
                conf_pct = float(prob.item() * 100)
                if any(kw in label for kw in LIKELY_GARBAGE):
                    garbage_conf += conf_pct

            is_garbage = garbage_conf >= 15.0

            # ── Check 0B: Geographic/Landscape logic ──
            # Images identified as 'Valley', 'Park', 'Meadow' are Non-Plant for our leaf model.
            geographic_conf = 0.0
            for label, prob in zip(top10_labels, top10_probs):
                conf_pct = float(prob.item() * 100)
                if any(kw in label for kw in GEOGRAPHIC_SCENES):
                    geographic_conf += conf_pct
            
            is_landscape = geographic_conf >= 20.0 # High threshold to avoid rejection of garden-grown leaves
            if is_landscape:
                 _log_inference(f"[validator] Landscape/Scene detected @ {geographic_conf:.1f}%")

            # ── Check 1: Is it a supported crop? ──
            is_supported = any(p.lower() in top1_label for p in [s.lower() for s in SUPPORTED_PLANTS])

            # ── Check 2: Is it an explicitly out-of-scope (foreign) plant/botany label? ──
            is_foreign = False
            for label, prob in zip(top10_labels, top10_probs):
                conf_pct = float(prob.item() * 100)
                if conf_pct >= 2.0: 
                    if any(kw in label for kw in NON_SUPPORTED_PLANT_KEYWORDS):
                        is_foreign = True
                        break

            # ── Check 3: Is it plant-like matter at all? ──
            # Stricter: require actual botanical features (leaf, foliage, stalk)
            is_botanical = False
            for label, prob in zip(top10_labels, top10_probs):
                conf_pct = float(prob.item() * 100)
                if conf_pct >= 3.0: # require slightly more certainty for plant status
                    if any(kw in label for kw in PLANT_RELATED_KEYWORDS):
                        is_botanical = True
                        break

            # ── Decision tree ──
            # 1. High-Confidence Garbage/Landscape (Highest Priority unless botanical hit found)
            if (is_garbage or is_landscape) and not is_botanical:
                 _log_inference(f"[validator] INVALID (Non-Plant/Scene): garbage={is_garbage} landscape={is_landscape}")
                 return {
                    "status": "invalid",
                    "type": "non_plant",
                    "confidence": round(max(top1_conf, garbage_conf), 2),
                    "identified_as": "Non-Plant Image",
                    "message": "The uploaded image is not a plant leaf."
                }

            # 2. Explicitly foreign plant detection (Higher Priority than botanical)
            if is_foreign:
                 _log_inference(f"[validator] OUTSIDE SCOPE: foreign plant detected '{top1_label}'")
                 return {
                    "status": "invalid",
                    "type": "out_of_scope",
                    "confidence": round(top1_conf, 2),
                    "identified_as": top1_label.title(),
                    "message": "This plant species is not currently supported."
                }

            # 3. Botanical marker detection -> PROCEED TO STAGE 2
            # We let the specialized Stage 2 detector decide if the plant is supported or out-of-scope.
            if is_botanical:
                _log_inference(f"[validator] PROCEED: botanical hit '{top1_label}' — handing off to Stage 2")
                return {
                    "status": "valid",
                    "type": "plant",
                    "confidence": round(top1_conf, 2),
                    "identified_as": top1_label.title(),
                    "message": "Botanical features detected."
                }

            # 4. Final uncertainty fallback -> Strictly Non-Plant
            _log_inference(f"[validator] UNCERTAIN: defaulting to non_plant for safety. Label: {top1_label}")
            return {
                "status": "invalid",
                "type": "non_plant",
                "confidence": round(top1_conf, 2),
                "identified_as": "Non-Plant Image",
                "message": "The system could not recognize a plant in this image."
            }

        except Exception as e:
            _log_inference(f"[validator] Error during validation: {e}")
            # Fail-open: allow image through if validator crashes
            return {
                "status": "valid",
                "type": "plant",
                "confidence": 0.0,
                "identified_as": "Unknown",
                "message": "Validation skipped due to internal error."
            }


# ══════════════════════════════════════════════════════════════════════════════
# STAGE 2 — Disease Detector
# Only called when Stage 1 returns status="valid".
# No random output. No fallback disease assignment.
# ══════════════════════════════════════════════════════════════════════════════

class DiseaseDetector:
    """
    Disease detection using trained PlantVillage ResNet18 model.
    Only called after ImageScopeValidator confirms the image is valid.
    """

    def __init__(self):
        self.classes = PLANT_VILLAGE_CLASSES
        self.model_loaded_ok = False

        if os.path.exists(MODEL_PATH):
            _log_inference(f"Loading trained model from {MODEL_PATH}")
            try:
                try:
                    import torchvision
                    from torch.serialization import add_safe_globals
                    add_safe_globals([
                        torchvision.models.resnet.ResNet,
                        torchvision.models.resnet.BasicBlock,
                        torch.nn.modules.container.Sequential,
                        torch.nn.modules.conv.Conv2d,
                        torch.nn.modules.batchnorm.BatchNorm2d,
                        torch.nn.modules.activation.ReLU,
                        torch.nn.modules.pooling.MaxPool2d,
                        torch.nn.modules.pooling.AdaptiveAvgPool2d,
                        torch.nn.modules.linear.Linear,
                        torch._utils._rebuild_tensor_v2,
                        torch._utils._rebuild_parameter,
                    ])
                except (AttributeError, ImportError):
                    pass

                try:
                    self.model = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
                except (TypeError, Exception) as e:
                    _log_inference(f"Phase 1 load failed ({e}), trying Phase 2...")
                    self.model = torch.load(MODEL_PATH, map_location='cpu')

                if isinstance(self.model, dict):
                    _log_inference("Found state_dict — reconstructing ResNet18...")
                    model_full = models.resnet18()
                    num_ftrs = model_full.fc.in_features
                    model_full.fc = torch.nn.Linear(num_ftrs, len(self.classes))
                    model_full.load_state_dict(self.model)
                    self.model = model_full

                self.model.eval()
                self.model_loaded_ok = True
                _log_inference("Trained model loaded OK")
            except Exception as e:
                import traceback
                _log_inference(f"CRITICAL: Model load error: {e}\n{traceback.format_exc()}")
                # Do NOT fall back to untrained model — that produces random garbage.
                # Set model to None so predict() returns an explicit error.
                self.model = None
        else:
            _log_inference(f"WARNING: Model file not found at {MODEL_PATH}")
            self.model = None

        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def predict(self, image_path, is_plant_hint=None):
        """
        Run disease detection. Only called after scope validation passes.

        Returns None if model is not loaded (no random guesses).
        Returns a structured result dict on success.
        """
        if self.model is None:
            _log_inference("[detector] Model not loaded — refusing to produce random output")
            return None

        try:
            filename = os.path.basename(image_path)
            _log_inference(f"[detector] Predicting: {filename}")

            input_image = _load_image_robust(image_path)
            input_tensor = self.preprocess(input_image)
            with torch.no_grad():
                output = self.model(input_tensor.unsqueeze(0))

            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)

            confidence_score = float(confidence.item() * 100)
            predicted_class = self.classes[predicted_idx.item()]
            _log_inference(f"[detector] Top class: {predicted_class} ({confidence_score:.2f}%)")

            # ── Gate A: Background/No-leaf class ──────────────────────────────
            if "background_without_leaves" in predicted_class.lower():
                if is_plant_hint:
                    # MobileNet said it's a plant, but disease model disagrees → out of scope
                    _log_inference("[detector] Background class with plant hint → out_of_scope")
                    return {
                        "status": "invalid",
                        "type": "out_of_scope",
                        "plant_type": "Out of Scope",
                        "disease_name": "Not Applicable",
                        "confidence": round(confidence_score, 2),
                        "severity": None,
                        "is_healthy": False,
                        "is_plant_image": True,
                        "is_out_of_scope": True,
                        "is_non_plant": False,
                        "message": "The plant is not available in the dataset."
                    }
                else:
                    # Both models agree it's not a plant leaf
                    _log_inference("[detector] Background class, no plant hint → non_plant")
                    return {
                        "status": "invalid",
                        "type": "non_plant",
                        "plant_type": "Non-Plant Image",
                        "disease_name": "Not Applicable",
                        "confidence": round(confidence_score, 2),
                        "severity": None,
                        "is_healthy": False,
                        "is_plant_image": False,
                        "is_non_plant": True,
                        "is_out_of_scope": False,
                        "message": "The uploaded image is not a plant."
                    }

            # ── Gate B: Below confidence threshold → out of scope ─────────────
            if confidence_score < CONF_THRESHOLD_VALID:
                _log_inference(f"[detector] Low confidence {confidence_score:.2f}% < {CONF_THRESHOLD_VALID}% → outside_scope")
                return {
                    "status": "invalid",
                    "type": "out_of_scope",
                    "plant_type": "Out of Scope",
                    "disease_name": "Not Applicable",
                    "confidence": round(confidence_score, 2),
                    "severity": None,
                    "is_healthy": True,
                    "is_plant_image": True,
                    "is_out_of_scope": True,
                    "is_non_plant": False,
                    "message": "The plant is not available in the dataset."
                }

            # ── Gate C: Coherence check (entropy-based) ────────────────────────
            if self._is_out_of_scope(probabilities):
                _log_inference(f"[detector] Coherence check failed → outside_scope. Top: {predicted_class}")
                return {
                    "status": "invalid",
                    "type": "out_of_scope",
                    "plant_type": "Out of Scope",
                    "disease_name": "Not Applicable",
                    "confidence": round(confidence_score, 2),
                    "severity": None,
                    "is_healthy": False,
                    "is_plant_image": True,
                    "is_out_of_scope": True,
                    "is_non_plant": False,
                    "message": "The plant is not available in the dataset."
                }

            # ── Parse the class name ───────────────────────────────────────────
            mapping = LABEL_MAPPING.get(predicted_class)
            
            if mapping:
                plant_name = mapping['plant']
                disease_name = mapping['disease']
                is_healthy = mapping['healthy']
                scientific_name = mapping['sci']
            else:
                # Fallback for unexpected labels
                parts = predicted_class.split("___")
                plant_name = parts[0].replace("_", " ").replace(",", "").title().strip()
                disease_part = parts[1].replace("_", " ").strip() if len(parts) > 1 else "healthy"
                is_healthy = "healthy" in disease_part.lower()

                if is_healthy:
                    disease_name = "Healthy"
                else:
                    disease_name = disease_part.title()
                    if plant_name.lower() not in disease_name.lower():
                        disease_name = f"{plant_name} {disease_name}"
                scientific_name = SCIENTIFIC_NAMES.get(plant_name, "Unknown Species")

            _log_inference(f"[detector] Result: {plant_name} — {disease_name} ({confidence_score:.1f}%)")

            return {
                "status": "valid",
                "type": "plant",
                "plant_type": plant_name,
                "scientific_name": scientific_name,
                "disease_name": disease_name,
                "confidence": round(confidence_score, 2),
                "severity": self._determine_severity(confidence_score) if not is_healthy else "Low",
                "is_healthy": is_healthy,
                "is_plant_image": True,
                "is_non_plant": False,
                "is_out_of_scope": False,
                "raw_prediction": predicted_class,
            }

        except Exception as e:
            import traceback
            _log_inference(f"[detector] Prediction error: {e}\n{traceback.format_exc()}")
            return None

    def _determine_severity(self, confidence):
        """Map model confidence to clinical severity label."""
        if confidence > 90:
            return "critical"
        if confidence > 70:
            return "severe"
        if confidence > 50:
            return "moderate"
        return "minor"

    def _is_out_of_scope(self, probabilities):
        """
        Detects out-of-distribution images using TOP-K family coherence.
        If the top-5 predictions are spread across unrelated plant families,
        the model is uncertain and the result is rejected.
        """
        k = min(5, len(self.classes))
        top_probs, top_indices = torch.topk(probabilities, k=k)
        top1_conf = float(top_probs[0].item() * 100)

        # High confidence bypass — model is certain
        if top1_conf > CONF_THRESHOLD_HIGH_BYPASS:
            return False

        # Only consider classes with meaningful probability (> 2.0%)
        active_indices = [
            i for i in range(min(5, k)) if (top_probs[i].item() * 100) > 2.0
        ]
        if not active_indices:
            return True

        families = []
        for idx in active_indices:
            cls = self.classes[top_indices[idx].item()]
            fam = cls.split('___')[0].lower().replace(',', '').replace(' bell', '').strip()
            families.append(fam)

        unique_families = len(set(families))
        dominant = families[0]
        same_family = sum(1 for f in families if f == dominant)
        _log_inference(f"[coherence] families={families} unique={unique_families} dominant_count={same_family}")

        # Scattered results across multiple plant families → out of scope
        if len(families) >= 3 and unique_families == len(families):
            _log_inference("[coherence] REJECT: scattered families")
            return True

        # Dominant family not reinforced by secondary predictions
        if len(families) >= 2 and same_family < 2:
            _log_inference("[coherence] REJECT: weak family coherence")
            return True

        return False


# ══════════════════════════════════════════════════════════════════════════════
# Plant Identifier (used by My Plants "Identify with AI")
# Wraps the same two-stage pipeline.
# ══════════════════════════════════════════════════════════════════════════════

class PlantIdentifier:
    """
    Used by My Plants page to identify a plant species.
    Uses MobileNet + disease model for best-effort plant identification.
    """

    def __init__(self):
        try:
            weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
            self.model = models.mobilenet_v2(weights=weights)
            self.imagenet_labels = weights.meta["categories"]
            self.model.eval()
        except Exception as e:
            _log_inference(f"PlantIdentifier: MobileNet load failed: {e}")
            self.model = None
            self.imagenet_labels = []

        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        self.supported_plants = SUPPORTED_PLANTS
        self.scientific_names_map = SCIENTIFIC_NAMES

    def _log(self, message):
        _log_inference(f"[identifier] {message}")

    def check_plant_scope(self, image_path):
        """
        Legacy interface kept for backward compatibility with views.py.
        Delegates to ImageScopeValidator internally.
        """
        result = scope_validator.validate(image_path)
        return {
            'is_in_scope': result['type'] != 'out_of_scope',
            'is_plant': result['type'] != 'non_plant',
            'identified_as': result.get('identified_as', 'Unknown'),
            'confidence': result.get('confidence', 0.0),
        }

    def predict(self, image_path):
        """
        Identify plant type using scope validator for gating + disease model for specifics.
        """
        try:
            self._log(f"Identifying: {os.path.basename(image_path)}")

            # ── STAGE 1: Centralized Gating ──
            scope = scope_validator.validate(image_path)
            
            is_plant_image = (scope['status'] == 'valid')
            is_supported_plant = (scope['type'] == 'plant')
            generic_name = scope.get('identified_as', 'Unknown').title()
            confidence = scope.get('confidence', 0.0)

            # ── STAGE 2: Deep Analysis ──
            disease_guess = detector.predict(image_path, is_plant_hint=is_plant_image)

            # ── STAGE 1B: High Confidence Rescue ──
            # If Stage 1 rejected this but our specific dataset detector is extremely sure,
            # we rescue it and declare it a valid plant image.
            if not is_plant_image and disease_guess and disease_guess.get('status') == 'valid' and disease_guess.get('confidence', 0) > 85.0:
                self._log(f"[predict] High-confidence Stage-2 rescue: {disease_guess['confidence']:.1f}% > 85.0%")
                is_plant_image = True
                is_supported_plant = True
                scope['status'] = 'valid'
                scope['type'] = 'plant' # CRITICAL: overwrite so it doesn't leak as 'out_of_scope'

            name = generic_name
            sci_name = "Unknown Species"
            is_supported = False
            suggestions = {}
            is_healthy = True

            if disease_guess and disease_guess.get('status') == 'valid':
                is_supported = True
                d_name = disease_guess.get('plant_type')
                d_conf = disease_guess.get('confidence', 0)
                is_healthy = disease_guess.get('is_healthy', True)
                if d_name and d_conf > 25:
                    name = d_name.title()
                    confidence = max(confidence, d_conf)
                    sci_name = disease_guess.get('scientific_name', "Unknown Species")

            # Force canonical outcomes
            if not is_plant_image:
                name = "Non-Plant Image"
                sci_name = "Non-Plant Image"
                suggestions = {"sunlight": "non_plant", "water": "non_plant", "difficulty": "unknown"}
            elif not is_supported and (scope['type'] == 'out_of_scope' or (disease_guess and disease_guess.get('type') == 'out_of_scope')):
                name = "Outside Scope"
                sci_name = "Out of Scope"
                suggestions = {"sunlight": "outside_scope", "water": "outside_scope", "difficulty": "unknown"}

            return {
                "name": name,
                "confidence": confidence,
                "scientific_name": sci_name,
                "is_plant_image": is_plant_image,
                "is_non_plant": (scope['type'] == 'non_plant'),
                "is_out_of_scope": (scope['type'] == 'out_of_scope'),
                "is_healthy": is_healthy,
                "suggestions": suggestions
            }

        except Exception as e:
            self._log(f"Identification error: {e}")
            return {
                "name": "Unknown Plant",
                "confidence": 0.0,
                "scientific_name": "Unknown",
                "is_plant_image": False,
                "is_out_of_scope": False,
                "suggestions": {"sunlight": "outside_scope", "water": "outside_scope", "difficulty": "unknown"}
            }


# ── Singleton instances ────────────────────────────────────────────────────
scope_validator = ImageScopeValidator()
detector = DiseaseDetector()
identifier = PlantIdentifier()
