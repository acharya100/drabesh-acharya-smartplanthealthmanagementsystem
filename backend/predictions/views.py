"""
Predictions API Views
"""

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

class PredictionViewSet(viewsets.ModelViewSet):
  
    queryset = Prediction.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_serializer_class(self):
        if self.action == 'identify':
            return PredictionCreateSerializer
        return PredictionDetailSerializer

    def get_queryset(self):
        # Users only see their own predictions
        return self.queryset.filter(user=self.request.user)

    @action(detail=False, methods=['post'])
    def identify(self, request):
      
        serializer = PredictionCreateSerializer(data=request.data)
        if serializer.is_valid():
           
            prediction_obj = serializer.save(user=request.user, confidence=0)
            
            try:
                # Perform AI inference
                results = identifier.predict(prediction_obj.image.path)
                
                if results:
                    # Update it with the results
                    prediction_obj.confidence = results['confidence']
                    prediction_obj.plant_name = results['name'] # Save raw AI name
                    prediction_obj.is_plant_image = results.get('is_plant_image', True)
                    
                    # Try to link to a database plant entry
                    plant_obj = Plant.objects.filter(name__icontains=results['name']).first()
                    if plant_obj:
                        prediction_obj.predicted_plant = plant_obj
                        
                    prediction_obj.save()
                    
                    return Response({
                        "success": True,
                        "data": results,
                        "prediction_id": prediction_obj.id
                    })
                else:
                    return Response({
                        "success": False,
                        "message": "AI could not identify the plant in this image."
                    }, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            except Exception as e:
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
       
        serializer = PredictionCreateSerializer(data=request.data)
        if serializer.is_valid():
            prediction_obj = serializer.save(user=request.user, confidence=0)
            
            try:
                # Perform disease detection
                results = detector.predict(prediction_obj.image.path)
                
                if results:
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
