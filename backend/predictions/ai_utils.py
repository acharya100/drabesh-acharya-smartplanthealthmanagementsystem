import torch
import torchvision.transforms as transforms
from torchvision import models
from PIL import Image
import os
import json

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

    def predict(self, image_path):
        """Identify plant type with a strong bias toward our 14 supported species."""
        try:
            self._log(f"Started identification for: {image_path}")
            
            # 1. Get ImageNet prediction (Generic)
            generic_name = "Unknown Plant"
            mobilenet_conf = 0.0
            
            if self.model:
                input_image = Image.open(image_path).convert('RGB')
                input_tensor = self.preprocess(input_image)
                with torch.no_grad():
                    output = self.model(input_tensor.unsqueeze(0))
                
                probabilities = torch.nn.functional.softmax(output[0], dim=0)
                conf, index = torch.max(probabilities, 0)
                mobilenet_conf = float(conf.item() * 100)
                if self.imagenet_labels and index.item() < len(self.imagenet_labels):
                    generic_name = self.imagenet_labels[index.item()]
            
            # 2. Get Disease Detector prediction (Specific to 14 plants)
            
            disease_guess = detector.predict(image_path)
            
            # 3. Intelligent Decision Logic
            
            name = generic_name.title()
            confidence = mobilenet_conf
            
            # Expanded list of keywords that suggest ImageNet failed to find a plant
            likely_garbage_labels = [
                'stole', 'frog', 'lizard', 'garment', 'plate', 'person', 'dog', 'cat', 
                'furniture', 'car', 'vehicle', 'bicycle', 'building', 'room', 'mountain',
                'ocean', 'sea', 'sky', 'text', 'digital', 'screen', 'laptop', 'tablet'
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
            if not is_plant_image:
                sci_name = "N/A"

            return {
                "name": name,
                "confidence": confidence,
                "scientific_name": sci_name,
                "is_plant_image": is_plant_image,
                "suggestions": {
                    "sunlight": "full_sun",
                    "water": "weekly",
                    "difficulty": "beginner"
                }
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
                # Add safe globals for PyTorch 2.6+ security
                try:
                    import torchvision
                    torch.serialization.add_safe_globals([
                        torchvision.models.resnet.ResNet,
                        torchvision.models.resnet.BasicBlock,
                        torch.nn.modules.container.Sequential,
                        torch.nn.modules.conv.Conv2d,
                        torch.nn.modules.batchnorm.BatchNorm2d,
                        torch.nn.modules.activation.ReLU,
                        torch.nn.modules.pooling.MaxPool2d,
                        torch.nn.modules.pooling.AdaptiveAvgPool2d,
                        torch.nn.modules.linear.Linear,
                    ])
                except AttributeError:
                    # Older versions don't have add_safe_globals
                    pass

                # IMPORTANT: weights_only=False is required for loading full models in newer PyTorch
                try:
                    self.model = torch.load(MODEL_PATH, map_location='cpu', weights_only=False)
                except TypeError:
                    # Older versions of torch don't support weights_only
                    self.model = torch.load(MODEL_PATH, map_location='cpu')
                
                # If it's just a state_dict (which happens sometimes if save was done differently)
                if isinstance(self.model, dict):
                    self._log("Found state_dict instead of model. Reconstructing ResNet18...")
                    model_full = models.resnet18()
                    num_ftrs = model_full.fc.in_features
                    model_full.fc = torch.nn.Linear(num_ftrs, len(self.classes))
                    model_full.load_state_dict(self.model)
                    self.model = model_full
                
                self.model.eval()
                self._log("✅ SUCCESS: Trained model loaded and ready!")
            except Exception as e:
                import traceback
                self._log(f"❌ CRITICAL ERROR loading model: {str(e)}")
                self._log(traceback.format_exc())
                # Fallback to untrained ResNet18 with IMAGENET1K_V1 base
                self.model = models.resnet18(weights=models.ResNet18_Weights.IMAGENET1K_V1)
                num_ftrs = self.model.fc.in_features
                self.model.fc = torch.nn.Linear(num_ftrs, len(self.classes))
                self.model.eval()
                self._log("⚠️ Falling back to untrained model due to load error.")
        else:
            self._log(f"❌ MODEL NOT FOUND at {MODEL_PATH}")
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

    def predict(self, image_path):
        """
        AI prediction with confidence-based safeguards
        """
        try:
            filename = os.path.basename(image_path)
            self._log(f"--- New Prediction: {filename} ---")
            
            input_image = Image.open(image_path).convert('RGB')
            input_tensor = self.preprocess(input_image)
            with torch.no_grad():
                output = self.model(input_tensor.unsqueeze(0))
            
            probabilities = torch.nn.functional.softmax(output[0], dim=0)
            confidence, predicted_idx = torch.max(probabilities, 0)
            
            confidence_score = float(confidence.item() * 100)
            predicted_class = self.classes[predicted_idx.item()]
            
            self._log(f"🎯 Predicted: {predicted_class} (confidence: {confidence_score:.2f}%)")
            
            if "background_without_leaves" in predicted_class.lower():
                return {
                    'plant_type': 'No Plant',
                    'disease_name': 'No leaf detected',
                    'confidence': round(confidence_score, 2),
                    'severity': 'N/A',
                    'is_healthy': True,
                    'is_plant_image': False,
                    'raw_prediction': 'Background'
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


# Create singleton instances
detector = DiseaseDetector()
identifier = PlantIdentifier()
