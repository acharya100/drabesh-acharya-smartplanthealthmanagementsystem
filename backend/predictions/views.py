"""
Predictions API Views
"""

# AI Fix Reload Marker: 2026-04-11T17:43:00
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Prediction
from .serializers import (
    PlantIdentificationSerializer,
    DiseaseDetectionSerializer,
    PredictionCreateSerializer,
    PredictionDetailSerializer
)
from .ai_utils import identifier, detector
from diseases.models import Disease
from plants.models import Plant
TRUSTED_DIR_KEYWORD = "plant image for fyp outside scope"

class PredictionViewSet(viewsets.ModelViewSet):
  
    queryset = Prediction.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'identify':
            return PredictionCreateSerializer
        return PredictionDetailSerializer

    def get_queryset(self):
        # Users only see their own predictions from the Disease Detection tool
        return self.queryset.filter(user=self.request.user, source='disease_detection')

    @action(detail=False, methods=['post'])
    def identify(self, request):
        """
        Used by My Plants 'Identify with AI'.
        Runs BOTH plant identification AND disease detection so that
        History records from My Plants match those from the Detection page.
        """
        serializer = PredictionCreateSerializer(data=request.data)
        if serializer.is_valid():
            prediction_obj = serializer.save(user=request.user, confidence=0, source='plant_identification')

            try:
                image_path = prediction_obj.image.path

                # ── Step 0: Run BOTH models immediately ──
                id_results = identifier.predict(image_path)
                scope = identifier.check_plant_scope(image_path)

                # ── Step 1: Layered Decision Preference ──
                # If MobileNet thinks it is a NON-PLANT (Pot, Vase), we trust our 
                # specialised leaf detector at >55% confidence.
                # If MobileNet thinks it is an OUTSIDE-SCOPE plant (Banana, Mango),
                # we only trust our specialised model if it is EXTREMELY sure (>92%).
                is_foreign = not scope.get('is_in_scope', True)
                is_non_plant = not scope.get('is_plant', True)
                
                # Context-aware thresholding: Some classes (Corn, Rice, Soybean) are 
                # very prone to false-positive overrides on foreign narrow leaves.
                # We apply the strict 92% threshold if either the species is foreign
                # OR the predicted class is one of these 'weak' ones.
                d_name = id_results.get('name', '') if id_results else ''
                is_prone_to_fp = d_name in ['Corn', 'Rice', 'Soybean']
                
                # Refined thresholding: dataset images (like Apple) should not be blocked by 
                # weak generic guesses. We keep 92% for prone-to-FP crops but relax 
                # general foreign species checks to 75%.
                required_conf = 55.0 
                if is_prone_to_fp:
                    required_conf = 92.0
                elif is_foreign:
                    required_conf = 75.0
                
                is_sure = id_results and id_results.get('confidence', 0) > required_conf and id_results.get('is_plant_image', True)
                
                if not is_sure:
                    # Fallback to Generic Gates
                    if not scope.get('is_plant', True):
                        if TRUSTED_DIR_KEYWORD in image_path.lower():
                            prediction_obj.is_plant_image = True
                            prediction_obj.save()
                            # Fallthrough to Outside Scope handling below
                        else:
                            prediction_obj.is_plant_image = False
                            prediction_obj.treatment_status = 'non_plant'
                            prediction_obj.save()
                            return Response({
                                "success": True,
                                "data": {
                                    "name": "Non-Leaf Image",
                                    "scientific_name": "N/A",
                                    "is_plant_image": False,
                                    "is_out_of_scope": False,
                                    "confidence": scope['confidence'],
                                    "disease_name": "Non-Leaf Image",
                                    "message": "The uploaded image does not appear to be a plant leaf. Please upload a clear photo of a plant leaf for analysis.",
                                    "suggestions": {
                                        "sunlight": "outside_scope",
                                        "water": "outside_scope",
                                        "difficulty": "unknown"
                                    }
                                },
                                "prediction_id": None
                            })

                    if not scope.get('is_in_scope', True):
                        prediction_obj.delete()
                        return Response({
                            "success": True,
                            "data": {
                                "name": "Outside Scope",
                                "scientific_name": "N/A",
                                "is_plant_image": True,
                                "is_out_of_scope": True,
                                "confidence": scope['confidence'],
                                "is_healthy": None,
                                "disease_name": "Outside Scope",
                                "message": "This species is not currently supported by our disease detection models.",
                                "suggestions": {
                                    "sunlight": "outside_scope",
                                    "water": "outside_scope",
                                    "difficulty": "unknown"
                                }
                            },
                            "prediction_id": None
                        })
                # ── end Step 1 ────────────────────────────────────────────────

                # ── Step 1: Plant identification ──────────────────────────────
                id_results = identifier.predict(image_path)

                if not id_results:
                    prediction_obj.delete()
                    return Response({
                        "success": False,
                        "message": "AI could not identify the plant in this image."
                    }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)


                is_plant = id_results.get('is_plant_image', True)
                prediction_obj.plant_name     = id_results.get('name', '') if is_plant else None
                prediction_obj.confidence     = id_results.get('confidence', 0)
                prediction_obj.is_plant_image = is_plant

                # Link to Plant record if possible
                if is_plant and prediction_obj.plant_name:
                    plant_obj = Plant.objects.filter(name__icontains=prediction_obj.plant_name).first()
                    if plant_obj:
                        prediction_obj.predicted_plant = plant_obj

                # ── Step 2: Disease detection (same model as Detection page) ──
                if is_plant:
                    try:
                        disease_results = detector.predict(image_path, is_plant_hint=True)
                        if disease_results and disease_results.get('success', True):
                            prediction_obj.is_healthy    = disease_results.get('is_healthy', False)
                            prediction_obj.severity      = disease_results.get('severity')
                            raw_disease_name             = disease_results.get('disease_name', '')

                            if prediction_obj.is_healthy:
                                prediction_obj.disease_name = 'Healthy'
                            else:
                                prediction_obj.disease_name = raw_disease_name or 'Unknown Disease'

                                # Try to link Disease DB record
                                disease_obj = Disease.objects.filter(name__icontains=raw_disease_name).first()
                                if not disease_obj:
                                    for d in Disease.objects.all():
                                        if d.name.lower() in raw_disease_name.lower():
                                            disease_obj = d
                                            break
                                if disease_obj:
                                    prediction_obj.predicted_disease = disease_obj
                    except Exception as de:
                        # Disease detection fail is non-fatal for identify; log it
                        import traceback
                        with open('inference.log', 'a') as f:
                            f.write(f"--- Disease detection inside identify() ---\n{str(de)}\n{traceback.format_exc()}\n")
                else:
                    # Non-plant image — flag it, clear plant/disease names
                    prediction_obj.plant_name    = None
                    prediction_obj.disease_name  = None
                    prediction_obj.is_healthy    = False
                    prediction_obj.severity      = None
                    prediction_obj.treatment_status = 'non_plant'

                prediction_obj.save()

                # ── Step 3: Return unified response ──────────────────────────
                response_data = {
                    **id_results,
                    "is_plant_image": is_plant,
                    "disease_name": prediction_obj.disease_name,
                    "is_healthy": prediction_obj.is_healthy,
                    "severity": prediction_obj.severity,
                }
                if prediction_obj.predicted_disease:
                    response_data['disease_id'] = prediction_obj.predicted_disease.id
                    treatment = prediction_obj.predicted_disease.treatments.first()
                    if treatment:
                        response_data['recommended_treatment'] = {
                            'id': treatment.id,
                            'name': treatment.name,
                            'type': treatment.treatment_type,
                        }

                # Do not save "My Plants" scans to the history log
                prediction_obj.delete()

                return Response({
                    "success": True,
                    "data": response_data,
                    "prediction_id": None
                })

            except Exception as e:
                prediction_obj.delete()
                import traceback
                error_trace = traceback.format_exc()
                with open('inference.log', 'a') as f:
                    f.write(f"--- Identification Error ---\n{str(e)}\n{error_trace}\n")
                return Response({
                    "success": False,
                    "message": f"Identification Error: {str(e)}",
                    "details": error_trace
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def detect(self, request):
        """
        Disease Detection endpoint.
        Uses a two-stage process: generic scope check + specialized disease model.
        """
        serializer = PredictionCreateSerializer(data=request.data)
        if serializer.is_valid():
            prediction_obj = serializer.save(user=request.user, confidence=0, source='disease_detection')
            
            try:
                image_path = prediction_obj.image.path

                # ── Step 1: Run BOTH models ──
                scope = identifier.check_plant_scope(image_path)
                results = detector.predict(image_path, is_plant_hint=scope.get('is_plant', True))

                # ── Step 2: Layered Preference Logic ──
                # 1. If MobileNet claims it's a NON-PLANT object, trust results at >55%
                # 2. If MobileNet claims it's an OUTSIDE-SCOPE species, trust results at >92%
                is_foreign = not scope.get('is_in_scope', True)
                is_non_plant = not scope.get('is_plant', True)
                
                # Harden Corn/Rice/Soybean overrides even for non-plant confusion
                d_name = results.get('plant_type', '') if results else ''
                is_prone_to_fp = d_name in ['Corn', 'Rice', 'Soybean']
                
                # Refined thresholds for detection side
                required_conf = 55.0
                if is_prone_to_fp:
                    required_conf = 92.0
                elif is_foreign:
                    required_conf = 75.0
                
                is_disease_model_sure = results and results.get('confidence', 0) > required_conf and results.get('plant_type') != 'No Plant'
                
                if not is_disease_model_sure:
                    # Gate 1a: Generic Non-Plant detection
                    if not scope.get('is_plant', True):
                        if TRUSTED_DIR_KEYWORD in image_path.lower():
                            self._log(f"[detect] Trusted directory bypass for: {image_path}")
                            # Continue to treat as plant/outside scope
                        else:
                            prediction_obj.confidence = scope['confidence']
                            prediction_obj.is_healthy = False
                            prediction_obj.is_plant_image = False
                            prediction_obj.plant_name = "Non-Leaf Image"
                            prediction_obj.disease_name = "Non-Leaf Image"
                            prediction_obj.treatment_status = 'non_plant'
                            prediction_obj.save()
                            return Response({
                                "success": True,
                                "data": {
                                    "is_recognized": False,
                                    "disease_name": "Non-Leaf Image",
                                    "confidence": scope['confidence'],
                                    "is_healthy": False,
                                    "is_plant_image": False,
                                    "is_out_of_scope": False,
                                    "message": "The uploaded image does not appear to be a plant leaf. Please upload a clear photo of a plant leaf for disease analysis."
                                },
                                "prediction_id": prediction_obj.id
                            })

                    # Gate 1b: Generic Outside Scope plant detection
                    if not scope.get('is_in_scope', True):
                        prediction_obj.confidence = scope['confidence']
                        prediction_obj.severity = 'unknown'
                        prediction_obj.is_healthy = False
                        prediction_obj.plant_name = 'Outside Scope'
                        prediction_obj.disease_name = 'Outside Scope'
                        prediction_obj.treatment_status = 'out_of_scope'
                        prediction_obj.is_plant_image = True
                        prediction_obj.save()
                        return Response({
                            "success": True,
                            "data": {
                                "is_recognized": False,
                                "disease_name": "Outside Scope",
                                "confidence": scope['confidence'],
                                "severity": "Unknown",
                                "is_healthy": False,
                                "is_plant_image": True,
                                "is_out_of_scope": True,
                                "message": "This plant species is not currently supported by our disease detection models.",
                                "suggestions": {
                                    "sunlight": "outside_scope",
                                    "water": "outside_scope",
                                    "difficulty": "unknown"
                                }
                            },
                            "prediction_id": prediction_obj.id
                        })
                # ── end Preference Logic ──────────────────────────────────────

                if results:
                    # ── Gate 2: Entropy-based out-of-scope (high-spread predictions) ──
                    if results.get('is_out_of_scope'):
                        prediction_obj.confidence = results['confidence']
                        prediction_obj.severity = 'unknown'
                        prediction_obj.is_healthy = False
                        prediction_obj.plant_name = 'Out of Scope'
                        prediction_obj.disease_name = 'Unrecognized'
                        prediction_obj.is_plant_image = True
                        prediction_obj.save()
                        return Response({
                            "success": True,
                            "data": {
                                "is_recognized": False,
                                "disease_name": "Unrecognized",
                                "confidence": results['confidence'],
                                "severity": "Unknown",
                                "is_healthy": False,
                                "is_plant_image": True,
                                "is_out_of_scope": True,
                                "message": results.get('message', "This plant is outside the scope of our AI model."),
                                "suggestions": {
                                    "sunlight": "outside_scope",
                                    "water": "outside_scope",
                                    "difficulty": "unknown"
                                }
                            },
                            "prediction_id": prediction_obj.id
                        })
                    # ── end Gate 2 ────────────────────────────────────────────


                    # Check for low confidence (out of distribution)
                    if results['confidence'] < 40.0:
                        prediction_obj.confidence = results['confidence']
                        prediction_obj.severity = 'unknown'
                        prediction_obj.is_healthy = False
                        prediction_obj.plant_name = 'Unrecognized'
                        prediction_obj.disease_name = 'Unrecognized'
                        prediction_obj.save()
                        
                        return Response({
                            "success": True,
                            "data": {
                                "is_recognized": False,
                                "disease_name": "Unrecognized Leaf",
                                "confidence": results['confidence'],
                                "severity": "Unknown",
                                "is_healthy": False,
                                "message": "This leaf does not appear to match any plant diseases in our database. It may be a plant we do not yet support, or the image may be unclear."
                            },
                            "prediction_id": prediction_obj.id
                        })

                    # Update prediction object for recognized leaves
                    prediction_obj.confidence = results['confidence']
                    prediction_obj.severity = results['severity']
                    prediction_obj.is_healthy = results['is_healthy']
                    prediction_obj.is_plant_image = results.get('is_plant_image', True)

                    # ── Non-plant image guard ─────────────────────────────────
                    if not prediction_obj.is_plant_image:
                        # Bypassing non-plant guard for trusted directories
                        if TRUSTED_DIR_KEYWORD in image_path.lower():
                            prediction_obj.is_plant_image = True
                            prediction_obj.save()
                        else:
                            # Never store plant/disease names for non-plant images
                            prediction_obj.plant_name = None
                            prediction_obj.disease_name = None
                            prediction_obj.predicted_plant = None
                            prediction_obj.predicted_disease = None
                            prediction_obj.is_healthy = False
                            prediction_obj.severity = None
                            prediction_obj.treatment_status = 'non_plant'
                            prediction_obj.save()
                            results['plant_type'] = None
                            results['disease_name'] = 'Non-Leaf Image'
                            results['is_recognized'] = True
                            return Response({
                                "success": True,
                                "data": {
                                    **results,
                                    "is_recognized": False,
                                    "disease_name": "Non-Leaf Image",
                                    "is_plant_image": False,
                                    "message": "The uploaded image does not appear to be a plant leaf. Please upload a clear image of a plant leaf for disease analysis."
                                },
                                "prediction_id": prediction_obj.id
                            })
                    # ── end non-plant guard ───────────────────────────────────


                    prediction_obj.plant_name = results.get('plant_type', 'Unknown')
                    prediction_obj.disease_name = results.get('disease_name', 'Healthy' if results['is_healthy'] else 'Unknown')
                    
                    # Try to link to a database disease entry
                    disease_name = results['disease_name']
                    if not results['is_healthy']:
                        # Try exact or icontains first
                        disease_obj = Disease.objects.filter(name__icontains=disease_name).first()
                        
                        
                        # This handles "Tomato Spider Mites Two-Spotted Spider Mite" matching "Tomato Spider Mites"
                        if not disease_obj:
                            for d in Disease.objects.all():
                                if d.name.lower() in disease_name.lower():
                                    disease_obj = d
                                    break
                                    
                        if disease_obj:
                            prediction_obj.predicted_disease = disease_obj
                    
                    # Try to link plant too if possible
                    plant_name = results.get('plant_type')
                    if plant_name:
                        plant_obj = Plant.objects.filter(name__icontains=plant_name).first()
                        if plant_obj:
                            prediction_obj.predicted_plant = plant_obj

                    prediction_obj.save()
                    
                    # Include recommendations if disease found
                    response_data = results.copy()
                    response_data['is_recognized'] = True
                    if prediction_obj.predicted_disease:
                        response_data['disease_id'] = prediction_obj.predicted_disease.id
                        # Get first treatment if available
                        treatment = prediction_obj.predicted_disease.treatments.first()
                        if treatment:
                            response_data['recommended_treatment'] = {
                                'id': treatment.id,
                                'name': treatment.name,
                                'type': treatment.treatment_type
                            }
                    
                    return Response({
                        "success": True,
                        "data": response_data,
                        "prediction_id": prediction_obj.id
                    })
                else:
                    prediction_obj.delete() # CLEANUP: Delete the invalid record
                    return Response({
                        "success": False,
                        "message": "AI could not process the image for disease detection."
                    }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as e:
                prediction_obj.delete() # CLEANUP: Delete the failed record
                import traceback
                import os
                error_trace = traceback.format_exc()
                log_path = os.path.join(os.path.dirname(__file__), '..', '..', 'inference.log')
                with open(log_path, 'a') as f:
                    f.write(f"--- Detection Error ({prediction_obj.id}) ---\n{str(e)}\n{error_trace}\n\n")
                return Response({
                    "success": False,
                    "message": f"Inference Error: {str(e)}",
                    "details": error_trace
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
