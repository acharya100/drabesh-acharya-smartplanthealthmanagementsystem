import sys
import os
import torch

# Mock the environment
sys.path.append(os.getcwd())

from predictions.ai_utils import DiseaseDetector

detector = DiseaseDetector()

# Test Case: 100% confidence but scattered families (The reported bug)
# Mock probabilities tensor (let's say 40 classes)
probs = torch.zeros(len(detector.classes))
# Index of 'Apple___Apple_scab' is 0
probs[0] = 1.0 # 100% confidence
# Index of 'Corn___Common_rust' is 1
# Index of 'Grape___Black_rot' is 2

out_of_scope = detector._is_out_of_scope(probs)
print(f"Is 100% Apple Scab out of scope? {out_of_scope}")

if out_of_scope:
    print("BUG STILL PRESENT!")
else:
    print("FIX VERIFIED LOCALLY!")
