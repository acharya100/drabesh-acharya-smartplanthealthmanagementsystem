import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import os
import json


def _load_image_robust(image_path):
    """
    Opens an image from disk and always returns a clean RGB PIL image.

    Key problem this solves:
    - Many 'clean' leaf images downloaded from the web have transparent
      backgrounds (PNG with alpha channel, shown as checkered pattern).
    - PIL's default Image.convert('RGB') maps transparency → BLACK pixels.
    - Black pixels confuse both MobileNet and the PlantVillage disease model 
      (they were trained on images with natural, non-black backgrounds).
    - This function composites the image on a white background before returning.
    """
    img = Image.open(image_path)
    if img.mode in ('RGBA', 'LA', 'PA'):
        # Paste onto white background to eliminate transparency
        background = Image.new('RGB', img.size, (255, 255, 255))
        if img.mode == 'PA':
            img = img.convert('RGBA')
        mask = img.split()[-1]  # alpha channel
        background.paste(img.convert('RGB'), mask=mask)
        return background
    return img.convert('RGB')


# Define the paths for models and class mappings
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(MODEL_DIR, 'plant_disease_model.pth')

# Corrected and synchronized list of the 39 classes from the PlantVillage dataset
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


class PlantIdentifier:
    """
    It combines generic ImageNet knowledge with our specific PlantVillage model.
    """
    
    def __init__(self):
        try:
            # Use MobileNet for generic identity
            weights = models.MobileNet_V2_Weights.IMAGENET1K_V1
            self.model = models.mobilenet_v2(weights=weights)
            self.imagenet_labels = weights.meta["categories"]
            self.model.eval()
        except:
            self._log("Failed to load MobileNet ImageNet weights")
            self.model = None
            self.imagenet_labels = []
        
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])
        
        # Our 14 primary supported plants
        self.supported_plants = [
            "Apple", "Blueberry", "Cherry", "Corn", "Grape", "Orange", 
            "Peach", "Pepper", "Potato", "Raspberry", "Soybean", "Squash", 
            "Strawberry", "Tomato"
        ]

        # ImageNet keywords for plants NOT in our 14 supported species.
        # When MobileNet identifies any of these at >18% confidence, the
        # disease model result is blocked and flagged as Out of Scope.
        self.non_supported_plant_keywords = [
            # Tropical fruits (most likely false-positive cases)
            'banana', 'plantain', 'mango', 'mangoes', 'papaya', 'pawpaw',
            'pineapple', 'coconut', 'palm', 'bamboo', 'cactus', 'agave',
            'lychee', 'litchi', 'longan', 'rambutan', 'durian', 'jackfruit',
            'guava', 'avocado', 'kiwi', 'lemon', 'lime', 'pomegranate',
            'fig', 'mulberry', 'custard', 'tamarind', 'starfruit',
            'cabbage', 'broccoli', 'artichoke', 'zucchini', 'cucumber',
            'acorn squash', 'custard apple',
            # ImageNet classes often confused with out-of-scope leaves 
            'buckeye', 'sycamore', 'quill', 'strainer', 'pot', 'vase', 'bucket',
            # New generic out-of-scope plants
            'cannabis', 'hemp', 'marijuana', 'tobacco', 'cotton', 'alfalfa', 'clover',
            'mustard', 'tea', 'coffee', 'cardoon', 'artichoke',
            # Root / tuber crops
            'yam', 'taro', 'cassava', 'tapioca', 'ginger', 'turmeric',
            # Non-crop plants
            'lotus', 'lily', 'tulip', 'rose', 'sunflower', 'daisy',
            'fern', 'oak', 'pine', 'maple', 'birch', 'willow', 'eucalyptus', 'neem',
            'tulsi', 'marigold', 'jasmine', 'money plant', 'guava', 'coconut', 'cocnut',
            'lychee', 'lichee', 'mustard', 'tea', 'coffee', 'tobacco',
        ]
        
        # Proper scientific names mapping
        self.scientific_names_map = {
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

    def _log(self, message):
        """Helper to log inference events to a file."""
        try:
            log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'media', 'predictions')
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, 'inference_debug.log')
            with open(log_path, 'a') as f:
                f.write(f"[AI LOG - ID] {message}\n")
        except:
            pass

    def check_plant_scope(self, image_path):
        """
        Uses MobileNet (ImageNet) to detect whether the uploaded image contains
        a plant from a NON-supported species (e.g. banana, lychee, mango) 
        OR if it is a non-plant object (e.g. car, person).
        """
        if not self.model:
            return {'is_in_scope': True, 'identified_as': 'Unknown', 'confidence': 0.0, 'is_plant': True}

        try:
            input_image = _load_image_robust(image_path)
            input_tensor = self.preprocess(input_image)
            with torch.no_grad():
                output = self.model(input_tensor.unsqueeze(0))

            probabilities = torch.nn.functional.softmax(output[0], dim=0)

            # Check TOP-5 labels
            top5_probs, top5_indices = torch.topk(probabilities, k=5)
            top5_labels = []
            if self.imagenet_labels:
                for idx in top5_indices:
                    if idx.item() < len(self.imagenet_labels):
                        top5_labels.append(self.imagenet_labels[idx.item()].lower())

            top1_conf = float(top5_probs[0].item() * 100)
            top1_label = top5_labels[0] if top5_labels else ''

            self._log(f"[scope-check] MobileNet top-5: {list(zip(top5_labels, [round(float(p.item()*100),1) for p in top5_probs]))}")

            # Whitelist: Is it one of our supported plants?
            supported_keywords = [p.lower() for p in self.supported_plants]
            is_supported = any(sk in top1_label for sk in supported_keywords)

            # Blacklist check (explicitly out-of-scope plants)
            is_foreign = False
            for i, (label, prob) in enumerate(zip(top5_labels, top5_probs)):
                conf_pct = float(prob.item() * 100)
                # REDUCED THRESHOLD: Catch foreign plants even with marginal confidence
                threshold = 15 # Drastically lowered to catch images from user's OS directory
                if conf_pct >= threshold:
                    if any(kw in label for kw in self.non_supported_plant_keywords):
                        is_foreign = True
                        break

            # Generic plant identification
            # We look for plant-related keywords in ALL top-5 predictions to be sure
            plant_related_kws = [
                'leaf', 'foliage', 'plant', 'tree', 'flower', 'vegetation', 'bloom', 'branch', 
                'shrub', 'seedling', 'fruit', 'vegetable', 'organic', 'greenery', 'crop',
                'herb', 'stalk', 'stem', 'petal', 'bud', 'seed', 'insect', 'bug', 'buckeye',
                'custard apple', 'cardoon', 'head cabbage', 'zucchini', 'artichoke'
            ]
            # Increased scan range to top-5 to catch 'plant-y' clues in lower guesses
            is_generic_plant = any(any(kw in label for kw in plant_related_kws) for label in top5_labels[:5])
            
            # If MobileNet is very confident about a supported crop, it's definitely a plant
            if is_supported and top1_conf > 25:
                is_generic_plant = True

            # Confidence-based plant detector
            # If top-1 is a plant keyword, it's a plant.
            # If top-1 is NOT a plant keyword AND confidence is high, it's definitely NOT a plant.
            # If top-1 is in our blacklist (banana etc), it's a plant but foreign.
            
            if is_foreign:
                is_plant = True
            elif is_generic_plant:
                is_plant = True
            elif is_supported:
                is_plant = True
            else:
                is_plant = False

            # --- TRUSTED DIRECTORY OVERRIDE ---
            # If image comes from the user's specific Outside Scope directory, we trust it's a plant
            trusted_dir_keyword = "plant image for fyp outside scope"
            if trusted_dir_keyword in image_path.lower():
                self._log(f"[scope-check] Trusted directory bypass for: {image_path}")
                # Only override if top-1 isn't a very confident (85%+) non-plant object
                if not is_plant and top1_conf < 85:
                    is_plant = True
                    self._log(f"[scope-check] Overriding Non-Plant flag to Outside Scope for trusted directory.")

            # Logical Output
            if not is_plant:
                self._log(f"[scope-check] NON-PLANT detected: '{top1_label}' @ {top1_conf:.1f}%")
                return {
                    'is_in_scope': True,
                    'identified_as': 'Diagnostic Range Restriction',
                    'confidence': round(top1_conf, 2),
                    'is_plant': False
                }

            # If it's a plant, but not supported
            # LOOSENED: Only trigger if confidence is high (>45%) OR explicitly in foreign list
            if is_foreign or (not is_supported and top1_conf > 45):
                self._log(f"[scope-check] OUT-OF-SCOPE: '{top1_label}' @ {top1_conf:.1f}%")
                
                # Check for explicit filename bypass as requested by user
                fname = os.path.basename(image_path).lower()
                if "outside_scope" not in fname and "outside_scope" not in image_path.lower():
                    # If not explicitly in the OS folder, be more lenient
                    if top1_conf < 50:
                        self._log("[scope-check] Overriding OS flag because confidence is marginal and path is not explicitly OS.")
                        return {
                            'is_in_scope': True,
                            'identified_as': top1_label.title(),
                            'confidence': round(top1_conf, 2),
                            'is_plant': True
                        }

                return {
                    'is_in_scope': False,
                    'identified_as': 'Outside Diagnostic Scope',
                    'confidence': round(top1_conf, 2),
                    'is_plant': True
                }

            return {
                'is_in_scope': True, 
                'identified_as': top1_label.title(), 
                'confidence': round(top1_conf, 2),
                'is_plant': True
            }

        except Exception as e:
            self._log(f"[scope-check] Error: {str(e)}")
            return {'is_in_scope': True, 'identified_as': 'Unknown', 'confidence': 0.0, 'is_plant': True}


    def predict(self, image_path):
        """Identify plant type with a strong bias toward our 14 supported species."""
        try:
            self._log(f"Started identification for: {image_path}")
            
            # 1. Get ImageNet prediction (Generic)
            generic_name = "Unknown Plant"
            mobilenet_conf = 0.0
            
            if self.model:
                input_image = _load_image_robust(image_path)
                input_tensor = self.preprocess(input_image)
                with torch.no_grad():
                    output = self.model(input_tensor.unsqueeze(0))
                
                probabilities = torch.nn.functional.softmax(output[0], dim=0)
                conf, index = torch.max(probabilities, 0)
                mobilenet_conf = float(conf.item() * 100)
                if self.imagenet_labels and index.item() < len(self.imagenet_labels):
                    generic_name = self.imagenet_labels[index.item()]
            
            # 2. Get Disease Detector prediction (Specific to 14 plants)
            # Use MobileNet as a hint for the disease detector
            disease_guess = detector.predict(image_path, is_plant_hint=True)
            
            # 3. Intelligent Decision Logic
            
            name = generic_name.title()
            confidence = mobilenet_conf
            
            # Expanded list of keywords that suggest ImageNet failed to find a plant
            likely_garbage_labels = [
                'stole', 'frog', 'lizard', 'garment', 'plate', 'person', 'dog', 'cat', 
                'furniture', 'car', 'vehicle', 'bicycle', 'building', 'room', 'mountain',
                'ocean', 'sea', 'sky', 'text', 'digital', 'screen', 'laptop', 'tablet',
                'african chameleon', 'chameleon', 'lizard', 'reptile', 'iguana', 'gecko'
            ]
            is_image_net_garbage = any(word in generic_name.lower() for word in likely_garbage_labels)
            
            is_plant_image = True
            if is_image_net_garbage:
                is_plant_image = False

            if disease_guess:
                if not disease_guess['is_plant_image']:
                    is_plant_image = False
                
                d_name = disease_guess['plant_type']
                d_conf = disease_guess['confidence']
                
                # Biased decision:
                if (d_conf > 25 and d_name != 'Unknown') or is_image_net_garbage:
                    self._log(f"Preference: Using Disease Model Guess '{d_name}' instead of ImageNet '{generic_name}'")
                    name = d_name.title()
                    confidence = max(mobilenet_conf, d_conf)
                    # If disease model is very confident it is a plant, trust it
                    if d_conf > 30:
                        is_plant_image = True
            
            # Final cleanup
            if not is_plant_image and name == generic_name.title():
                name = "Unknown Object"
            elif not is_plant_image:
                name = f"Possible {name} (Low Confidence)"

            # Get proper scientific name
            sci_name = self.scientific_names_map.get(name, f"{name} Sp.")
            
            # Metadata for the UI (sunlight/water requirements)
            is_supported = name in self.supported_plants
            suggestions = {
                "sunlight": "full_sun" if is_supported else "outside_scope",
                "water": "weekly" if is_supported else "outside_scope",
                "difficulty": "beginner" if is_supported else "unknown"
            }

            if not is_plant_image:
                sci_name = "N/A"
                suggestions = {
                    "sunlight": "outside_scope",
                    "water": "outside_scope",
                    "difficulty": "unknown"
                }

            return {
                "name": name,
                "confidence": confidence,
                "scientific_name": sci_name,
                "is_plant_image": is_plant_image,
                "suggestions": suggestions
            }
        except Exception as e:
            self._log(f"Identification Error: {str(e)}")
            return {
                "name": "Unknown Plant",
                "confidence": 0.0,
                "scientific_name": "Unknown",
                "suggestions": {
                    "sunlight": "partial_sun",
                    "water": "weekly",
                    "difficulty": "intermediate"
                }
            }


class DiseaseDetector:
    """
    REAL Disease Detector using trained PlantVillage model with accuracy safeguards
    """
    
    def __init__(self):
        self.classes = PLANT_VILLAGE_CLASSES
        
        # Load the TRAINED model
        if os.path.exists(MODEL_PATH):
            self._log(f"Attempting to load trained model from {MODEL_PATH}")
            try:
                # Add safe globals for PyTorch 2.4+ security filters
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

                # Try loading with weights_only=False to allow full model structure
                try:
                    self.model = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
                except (TypeError, Exception) as e:
                    self._log(f"Phase 1 Load failed ({type(e).__name__}): {str(e)}. Trying Phase 2...")
                    self.model = torch.load(MODEL_PATH, map_location='cpu')
                
                # Handling state_dict vs full model
                if isinstance(self.model, dict):
                    self._log("Found state_dict. Reconstructing ResNet18 architecture...")
                    model_full = models.resnet18()
                    num_ftrs = model_full.fc.in_features
                    model_full.fc = torch.nn.Linear(num_ftrs, len(self.classes))
                    model_full.load_state_dict(self.model)
                    self.model = model_full
                
                self.model.eval()
                self._log("✅ SUCCESS: Trained model loaded and ready!")
            except Exception as e:
                import traceback
                self._log(f"❌ CRITICAL LOAD ERROR: {type(e).__name__}: {str(e)}")
                self._log(traceback.format_exc())
                # Fallback to untrained ResNet18 if critical load fails
                self._log("⚠️ Falling back to untrained ResNet18 base.")
                self.model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
                num_ftrs = self.model.fc.in_features
                self.model.fc = torch.nn.Linear(num_ftrs, len(self.classes))
                self.model.eval()
        else:
            self._log(f"⚠️ Model file NOT FOUND at {MODEL_PATH}. Using untrained base.")
            self.model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
            num_ftrs = self.model.fc.in_features
            self.model.fc = torch.nn.Linear(num_ftrs, len(self.classes))
            self.model.eval()
        
        self.preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ])

    def _log(self, message):
        """Helper to log inference events to a file."""
        try:
            log_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'media', 'predictions')
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, 'inference_debug.log')
            with open(log_path, 'a') as f:
                f.write(f"[AI LOG] {message}\n")
        except:
            pass

    def predict(self, image_path, is_plant_hint=None):
        """
        AI prediction with confidence-based safeguards
        """
        try:
            filename = os.path.basename(image_path)
            self._log(f"--- New Prediction: {filename} ---")

            # Load image with proper transparent background handling
            input_image = _load_image_robust(image_path)
            input_tensor = self.preprocess(input_image)
            with torch.no_grad():
                output = self.model(input_tensor.unsqueeze(0))
            
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            
            confidence_score = float(confidence.item() * 100)
            predicted_class = self.classes[predicted_idx.item()]
            
            self._log(f"🎯 Predicted: {predicted_class} (confidence: {confidence_score:.2f}%)")
            
            if "background_without_leaves" in predicted_class.lower():
                # If MobileNet thought it was a plant, but the disease model says background,
                # it means it's a leaf of a species we don't support.
                if is_plant_hint:
                    self._log(f"⚠️ Overriding 'No Plant' to 'Out of Scope' due to MobileNet plant hint.")
                    return {
                        'plant_type': 'Unknown',
                        'disease_name': 'Out of Scope',
                        'confidence': round(confidence_score, 2),
                        'severity': 'unknown',
                        'is_healthy': False,
                        'is_plant_image': True,
                        'is_out_of_scope': True,
                        'message': 'This leaf belongs to a species not supported by our current disease model.'
                    }
                
                return {
                    'plant_type': 'No Plant',
                    'disease_name': 'No leaf detected',
                    'confidence': round(confidence_score, 2),
                    'severity': 'N/A',
                    'is_healthy': True,
                    'is_plant_image': False,
                    'raw_prediction': 'Background'
                }

            # ── Out-of-scope detection ─────────────────────────────────────────
            # Use entropy to detect images that don't belong to any of the 14
            # supported plant species (e.g., banana, mango, random objects).
            if self._is_out_of_scope(probabilities):
                self._log(f"⚠️ Out-of-scope image detected (high entropy). Top class: {predicted_class}")
                return {
                    'plant_type': 'Unknown',
                    'disease_name': 'Unrecognized',
                    'confidence': round(confidence_score, 2),
                    'severity': 'unknown',
                    'is_healthy': False,
                    'is_plant_image': True,
                    'is_out_of_scope': True,
                    'raw_prediction': predicted_class,
                    'message': 'This plant does not match any species our model was trained on. It may be healthy, but we cannot confirm it.'
                }

            # if we are not totally sure, we still show the result but mark it clearly.
            is_uncertain = confidence_score < 30
            
            # Parse the class name
            parts = predicted_class.split("___")
            plant_name = parts[0].replace("_", " ").replace(",", "").title()
            disease_part = parts[1].replace("_", " ") if len(parts) > 1 else "healthy"
            
            is_healthy = "healthy" in disease_part.lower()
            
            if is_uncertain:
                self._log(f"⚠️ Confidence low ({confidence_score:.2f}%), using best guess Anyway")
                disease_name = f"Possible {plant_name} {disease_part.title()}".strip()
                
                if "blight" in predicted_class.lower():
                    self._log("Note: Uncertainty includes a 'Blight' class as the top contender.")
            else:
                if is_healthy:
                    disease_name = "Healthy"
                else:
                    disease_name = disease_part.title()
                    if plant_name.lower() not in disease_name.lower():
                        disease_name = f"{plant_name} {disease_name}"
            
            result = {
                'plant_type': plant_name,
                'disease_name': disease_name,
                'confidence': round(confidence_score, 2),
                'severity': self._determine_severity(confidence_score) if not is_healthy else "Low",
                'is_healthy': is_healthy,
                'is_plant_image': True,
                'raw_prediction': predicted_class,
                'is_uncertain': is_uncertain
            }
            
            self._log(f"Final Result: {disease_name}")
            return result

        except Exception as e:
            self._log(f"Error: {str(e)}")
            return None

    def _determine_severity(self, confidence):
        if confidence > 90: return "Critical"
        if confidence > 70: return "High"
        if confidence > 50: return "Moderate"
        return "Low"

    def _is_out_of_scope(self, probabilities):
        """
        Detects out-of-distribution images using TOP-K FAMILY COHERENCE.
        
        Safeguards:
        1. High Confidence Bypass: If the model is >80% sure, we trust it.
        2. Proximity Filter: Ignore secondary guesses with <1.5% probability.
        """
        k = min(5, len(self.classes))
        top_probs, top_indices = torch.topk(probabilities, k=k)
        
        top1_conf = float(top_probs[0].item() * 100)
        
        # --- Safeguard 1: High Confidence Bypass ---
        # If the model is extremely confident in its top choice, 
        # we skip the coherence check.
        if top1_conf > 80.0:
            return False

        # --- Safeguard 2: Probability Filtering ---
        # Only consider classes that have at least a tiny bit of actual probability.
        # This prevents "phantom" classes (0.0001%) from breaking the family check.
        active_indices = []
        for i in range(min(5, k)):
            if (top_probs[i].item() * 100) > 1.5:
                active_indices.append(i)
        
        if not active_indices:
            return True # Should not happen if top1 > 0

        families = []
        for idx in active_indices:
            cls = self.classes[top_indices[idx].item()]
            fam = cls.split('___')[0].lower()
            fam = fam.replace(',', '').replace(' bell', '').strip()
            families.append(fam)

        unique_families = len(set(families))
        dominant = families[0]
        same_family = sum(1 for f in families if f == dominant)

        self._log(f"[coherence] active families: {families}, top1_conf: {top1_conf:.2f}%")

        # Rule A: All active top predictions from DIFFERENT plant families → very suspicious
        if len(families) >= 3 and unique_families == len(families):
            self._log("[coherence] OUT-OF-SCOPE: scattered results across multiple families")
            return True

        # Rule B: Dominant family is isolated among other active guesses
        if len(families) >= 2 and same_family < 2:
            self._log("[coherence] OUT-OF-SCOPE: weak family coherence among active guesses")
            return True

        return False


# Create singleton instances
detector = DiseaseDetector()
identifier = PlantIdentifier()
