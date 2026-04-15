import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from predictions.ai_utils import detector

def test_predictions():
    # Use existing images or dummy logic
    from unittest.mock import patch, MagicMock

    class DummyModel:
        def __call__(self, x):
            import torch
            # return fake logits with one high value
            out = torch.zeros((1, 39))
            # simulate 'Tomato___Spider_mites Two-spotted_spider_mite' which is index 34
            out[0, 34] = 100.0  
            return out

    # Override the loaded model inside the detector
    detector.model = DummyModel()
    
    # We also mock the image loading
    mock_img = MagicMock()
    with patch('predictions.ai_utils._load_image_robust', return_value=MagicMock()):
        result = detector.predict("dummy.jpg", is_plant_hint=True)
        print("Prediction Result:", result)

if __name__ == '__main__':
    test_predictions()
