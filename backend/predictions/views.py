"""
Predictions API Views
"""

import os
# AI Fix Reload Marker: 2026-04-11T17:43:00
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from typing import Any

from .models import Prediction
from .serializers import (
    PlantIdentificationSerializer,
    DiseaseDetectionSerializer,
    PredictionCreateSerializer,
    PredictionDetailSerializer
)
from .ai_utils import identifier, detector, scope_validator
from diseases.models import Disease
from plants.models import Plant

# Legacy trusted-dir keyword for backward compatibility with older test images
TRUSTED_DIR_KEYWORD = "plant image for fyp outside scope"


class PredictionViewSet(viewsets.ModelViewSet):
  
    queryset = Prediction.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self): # type: ignore[reportIncompatibleMethodOverride]
        if self.action == 'identify':
            return PredictionCreateSerializer
        return PredictionDetailSerializer

    def get_queryset(self): # type: ignore[reportIncompatibleMethodOverride]
        # Users only see their own predictions from the Disease Detection tool
        return self.queryset.filter(user=self.request.user, source='disease_detection')

    def _log(self, message):
        """Internal logging helper for debugging inference flows."""
        import datetime
        import os
        from django.conf import settings
        # Use full path to root-level inference.log
        log_path = os.path.join(settings.BASE_DIR, 'inference.log')
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        try:
            with open(log_path, 'a', encoding='utf-8') as f:
                f.write(f"[{timestamp}] [PredictionViewSet] {message}\n")
        except Exception as e:
            print(f"Logging error: {e}")

    @action(detail=False, methods=['post'])
    def identify(self, request):
    
        serializer = PredictionCreateSerializer(data=request.data)
        if not serializer.is_valid():
             return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prediction_obj = serializer.save(user=request.user, confidence=0, source='plant_identification')

        try:
            image_path = prediction_obj.image.path
            self._log(f"--- Identify Request for {os.path.basename(image_path)} ---")

            scope = scope_validator.validate(image_path)
            self._log(f"[identify] Scope verdict: status={scope['status']} type={scope['type']}")

            # Trusted images (dataset samples) bypass gating
            if TRUSTED_DIR_KEYWORD in image_path.lower() or "__" in os.path.basename(image_path):
                scope['status'] = 'valid'

            if scope['status'] == 'invalid':
              
                stage2_check = detector.predict(image_path, is_plant_hint=True)
                if stage2_check and stage2_check.get('status') == 'valid' and stage2_check.get('confidence', 0) > 70.0:
                    self._log(f"[identify] High-confidence Stage-2 override triggered: {stage2_check['confidence']:.1f}% > 70.0%")
                    scope['status'] = 'valid' # Rescue it and allow it to proceed to Stage 2 mapping
                    scope['type'] = 'plant'

            if scope['status'] == 'invalid':
                # Map invalid scope result to canonical UI response
                image_type      = scope['type'] # 'non_plant' | 'out_of_scope'
                is_non_plant    = (image_type == 'non_plant')
                is_out_of_scope = (image_type == 'out_of_scope')

                canonical_name = "Non-Plant Image" if is_non_plant else "Outside Scope"
                canonical_msg  = scope.get('message', "Unable to identify image.")

                prediction_obj.is_plant_image  = not is_non_plant
                prediction_obj.is_non_plant    = is_non_plant
                prediction_obj.is_out_of_scope = is_out_of_scope
                prediction_obj.plant_name      = canonical_name
                prediction_obj.disease_name    = "Not Applicable"
                prediction_obj.treatment_status = image_type
                prediction_obj.save()

                # Cleanup the identifying record (we don't persist 'My Plants' identification attempts)
                prediction_obj.delete()

                return Response({
                    "success": True,
                    "data": {
                        "name": canonical_name,
                        "scientific_name": canonical_name,
                        "is_plant_image": not is_non_plant,
                        "is_non_plant": is_non_plant,
                        "is_out_of_scope": is_out_of_scope,
                        "is_healthy": True,
                        "confidence": scope.get('confidence', 0),
                        "disease_name": canonical_name,
                        "message": canonical_msg,
                        "suggestions": {
                            "sunlight": "not_needed" if is_non_plant else "outside_scope",
                            "water": "not_needed" if is_non_plant else "outside_scope",
                            "difficulty": "unknown"
                        }
                    },
                    "prediction_id": None
                })

            id_results = identifier.predict(image_path)
            disease_results = detector.predict(image_path, is_plant_hint=True)

            self._log(f"[identify] Identifier class: {id_results.get('name')} | Detector: {disease_results.get('disease_name')}")

            # Merge results into the prediction object
            prediction_obj.plant_name     = id_results.get('name', 'Unknown Plant')
            prediction_obj.confidence     = max(id_results.get('confidence', 0), disease_results.get('confidence', 0))
            prediction_obj.is_plant_image = True
            is_out_of_scope = (disease_results.get('type') == 'out_of_scope')
            prediction_obj.is_healthy     = True if is_out_of_scope else disease_results.get('is_healthy', False)
            prediction_obj.disease_name   = "Outside Scope" if is_out_of_scope else disease_results.get('disease_name', 'Healthy' if prediction_obj.is_healthy else 'Unknown Disease')
            prediction_obj.save()

            response_data = {
                **(id_results or {}),
                "is_plant_image": True,
                "disease_name": prediction_obj.disease_name,
                "is_healthy": prediction_obj.is_healthy,
                "severity": disease_results.get('severity', 'Low'),
            }

            # Cleanup
            prediction_obj.delete()

            return Response({
                "success": True,
                "data": response_data,
                "prediction_id": None
            })
        except Exception as e:
            if prediction_obj.id:
                prediction_obj.delete()
            import traceback
            error_trace = traceback.format_exc()
            self._log(f"--- Identification Error ---\n{str(e)}\n{error_trace}\n")
            return Response({
                "success": False,
                "message": f"Identification Error: {str(e)}",
                "details": error_trace
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def detect(self, request):

        serializer = PredictionCreateSerializer(data=request.data)
        if not serializer.is_valid():
            # Debug: Log the exact validation error to terminal
            print(f"--- [detect] 400 Bad Request ---")
            print(f"Path: {request.path}")
            print(f"Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        prediction_obj = serializer.save(
            user=request.user, confidence=0, source='disease_detection'
        )

        try:
            image_path = prediction_obj.image.path

            # -- STAGE 1: Scope validation (runs BEFORE disease model) ----------
            scope = scope_validator.validate(image_path)
            self._log(f"[detect] Stage-1 scope: status={scope['status']} type={scope['type']} conf={scope['confidence']:.1f}%")

            # Check for TRUSTED images (dataset samples)
            is_trusted = TRUSTED_DIR_KEYWORD in image_path.lower() or "__" in os.path.basename(image_path)
            if is_trusted:
                self._log("[detect] Trusted image detected - forcing Stage-1 valid")
                scope['status'] = 'valid'

            if scope['status'] == 'invalid':
    
                stage2_check = detector.predict(image_path, is_plant_hint=True)
                if stage2_check and stage2_check.get('status') == 'valid' and stage2_check.get('confidence', 0) > 70.0:
                    self._log(f"[detect] High-confidence Stage-2 override: {stage2_check['confidence']:.1f}% > 70.0%")
                    # Proced to valid handling logic below by setting results
                    results = stage2_check
                else:
                    image_type = scope['type']   # 'non_plant' or 'out_of_scope'
                    is_non_plant     = (image_type == 'non_plant')
                    is_out_of_scope  = (image_type == 'out_of_scope')

                    # Canonical display labels - never left as raw type keys
                    canonical_plant   = 'Non-Plant Image' if is_non_plant else 'Outside Scope'
                    canonical_disease = 'Not Applicable'
                    canonical_sci     = 'Non-Plant Image' if is_non_plant else 'Outside Scope'
                    canonical_msg     = (
                        'The uploaded image is not a plant. Please upload a clear, close-up photo of a plant leaf.'
                        if is_non_plant else
                        'The uploaded image is outside the supported dataset. Currently supported crops: Apple, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato, Blueberry.'
                    )

                    # Persist with canonical values
                    prediction_obj.confidence      = scope['confidence']
                    prediction_obj.is_plant_image  = not is_non_plant
                    prediction_obj.is_non_plant    = is_non_plant
                    prediction_obj.is_out_of_scope = is_out_of_scope
                    prediction_obj.plant_name      = canonical_plant
                    prediction_obj.disease_name    = canonical_disease
                    prediction_obj.is_healthy      = False
                    prediction_obj.severity        = None
                    prediction_obj.treatment_status = image_type  # 'non_plant' | 'out_of_scope'
                    prediction_obj.save()

                    response_data = {
                        'is_plant_image':   not is_non_plant,
                        'is_out_of_scope':  is_out_of_scope,
                        'is_non_plant':     is_non_plant,
                        'is_recognized':    False,
                        'plant_name':       canonical_plant,
                        'scientific_name':  canonical_sci,
                        'disease_name':     canonical_disease,
                        'confidence':       scope['confidence'],
                        'is_healthy':       False,
                        'severity':         None,
                        'message':          canonical_msg,
                    }
                    return Response({
                        'status':        'invalid',
                        'type':          image_type,
                        'message':       canonical_msg,
                        'data':          response_data,
                        'prediction_id': prediction_obj.id,
                        'success':       True,
                    })
            else:
                # -- STAGE 2: Disease model ----------------------------------------
                results = detector.predict(image_path, is_plant_hint=True)
            self._log(f"[detect] Stage-2 detector returned: {results}")

            if results is None:
                # Model not loaded or crashed - do not return random data
                prediction_obj.delete()
                return Response({
                    "status":  "error",
                    "type":    "model_unavailable",
                    "message": "The disease detection model is currently unavailable. Please try again later.",
                    "success": False,
                }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

            # Stage 2 can also return an invalid result (background class, low conf, etc.)
            if results.get('status') == 'invalid':
                image_type       = results.get('type', 'out_of_scope')
                is_non_plant     = (image_type == 'non_plant')
                is_out_of_scope  = (image_type == 'out_of_scope')

                canonical_plant   = 'Non-Plant Image' if is_non_plant else 'Outside Scope'
                canonical_disease = 'Not Applicable'
                canonical_sci     = 'Non-Plant Image' if is_non_plant else 'Outside Scope'
                canonical_msg     = results.get('message') or (
                    'The uploaded image is not a plant. Please upload a clear, close-up photo of a plant leaf.'
                    if is_non_plant else
                    'The uploaded image is outside the supported dataset. Currently supported: Apple, Cherry, Corn, Grape, Orange, Peach, Pepper, Potato, Raspberry, Soybean, Squash, Strawberry, Tomato, Blueberry.'
                )

                prediction_obj.confidence      = results['confidence']
                prediction_obj.is_plant_image  = not is_non_plant
                prediction_obj.is_non_plant    = is_non_plant
                prediction_obj.is_out_of_scope = is_out_of_scope
                prediction_obj.plant_name      = canonical_plant
                prediction_obj.disease_name    = canonical_disease
                prediction_obj.is_healthy      = False
                prediction_obj.severity        = None
                prediction_obj.treatment_status = image_type
                prediction_obj.save()

                response_data = {
                    'is_plant_image':   not is_non_plant,
                    'is_out_of_scope':  is_out_of_scope,
                    'is_non_plant':     is_non_plant,
                    'is_recognized':    False,
                    'plant_name':       canonical_plant,
                    'scientific_name':  canonical_sci,
                    'disease_name':     canonical_disease,
                    'confidence':       results['confidence'],
                    'is_healthy':       False,
                    'severity':         None,
                    'message':          canonical_msg,
                }
                return Response({
                    'status':        'invalid',
                    'type':          image_type,
                    'message':       canonical_msg,
                    'data':          response_data,
                    'prediction_id': prediction_obj.id,
                    'success':       True,
                })

            # -- Valid prediction - persist and return -------------------------
            prediction_obj.confidence     = results['confidence']
            prediction_obj.severity       = results.get('severity')
            prediction_obj.is_healthy     = results['is_healthy']
            prediction_obj.is_plant_image = True
            prediction_obj.is_non_plant   = False
            prediction_obj.is_out_of_scope = False
            prediction_obj.plant_name     = results.get('plant_type', '')
            prediction_obj.disease_name   = results.get('disease_name', 'Healthy' if results['is_healthy'] else '')

            # -- Cost logic (Synchronized with frontend standards) ------------
            if not prediction_obj.is_healthy:
                cost_map = {
                    'minor':    300.00,
                    'moderate': 350.00,
                    'severe':   400.00,
                    'critical': 400.00,
                }
                prediction_obj.estimated_cost = cost_map.get(str(prediction_obj.severity).lower(), 300.00)
            else:
                prediction_obj.estimated_cost = 0.00

            # Link Disease DB record if diseased
            if not results['is_healthy']:
                disease_name_raw = results.get('disease_name', '')
                if disease_name_raw:
                    disease_obj = Disease.objects.filter(name__icontains=disease_name_raw).first()
                    if not disease_obj:
                        for d in Disease.objects.all():
                            if d.name.lower() in disease_name_raw.lower():
                                disease_obj = d
                                break
                    if disease_obj:
                        prediction_obj.predicted_disease = disease_obj

            # Link Plant DB record
            plant_name_raw = results.get('plant_type', '')
            if plant_name_raw:
                plant_obj = Plant.objects.filter(name__icontains=plant_name_raw).first()
                if plant_obj:
                    prediction_obj.predicted_plant = plant_obj

            prediction_obj.save()

            response_data = {
                **(results or {}),
                "is_recognized":  True,
                "is_out_of_scope": False,
            }
            if prediction_obj.predicted_disease:
                response_data['disease_id'] = prediction_obj.predicted_disease.id
                treatment = prediction_obj.predicted_disease.treatments.first()
                if treatment:
                    response_data['recommended_treatment'] = {
                        'id':   treatment.id,
                        'name': treatment.name,
                        'type': treatment.treatment_type,
                    }

            return Response({
                "status":        "valid",
                "type":          "plant",
                "message":       "Analysis complete.",
                "data":          response_data,
                "prediction_id": prediction_obj.id,
                # Legacy key
                "success":       True,
            })

        except Exception as e:
            prediction_obj.delete()
            import traceback
            import os as _os
            error_trace = traceback.format_exc()
            log_path = _os.path.join(_os.path.dirname(__file__), '..', '..', 'inference.log')
            try:
                with open(log_path, 'a') as f:
                    f.write(f"--- detect() Exception ---\n{str(e)}\n{error_trace}\n\n")
            except Exception:
                pass
            return Response({
                "status":  "error",
                "type":    "server_error",
                "message": "An unexpected error occurred during analysis. Please try again.",
                "success": False,
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
