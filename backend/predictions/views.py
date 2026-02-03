"""
Predictions API Views
Provides endpoints for AI-based identification and diagnosis.

Author: Smart Plant Health Management System
Sprint: 4 - Disease Detection & AI Assistance
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .models import Prediction
from .serializers import (
    PlantIdentificationSerializer,
    PredictionCreateSerializer,
    PredictionDetailSerializer
)
from .ai_utils import identifier

class PredictionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for handling AI predictions and identification.
    """
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
        """
        Identifies a plant from an uploaded image without saving a permanent prediction.
        Ideal for auto-filling the "Add Plant" form.
        
        Endpoint: POST /api/predictions/identify/
        """
        serializer = PredictionCreateSerializer(data=request.data)
        if serializer.is_valid():
            # In a real app, we'd save it temporarily or process the byte stream
            # For now, we save it to handle the file path for inference
            prediction_obj = serializer.save(user=request.user, confidence=0)
            
            try:
                # Perform AI inference
                results = identifier.predict(prediction_obj.image.path)
                
                if results:
                    # Cleanup the temporary prediction object if we don't want to keep it
                    # Or update it with the results
                    prediction_obj.confidence = results['confidence']
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
                return Response({
                    "success": False,
                    "message": str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
