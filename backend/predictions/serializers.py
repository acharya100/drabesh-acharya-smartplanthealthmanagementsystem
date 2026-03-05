"""
Serializers for Predictions API
"""

from rest_framework import serializers
from .models import Prediction

class PlantIdentificationSerializer(serializers.Serializer):
   
    name = serializers.CharField()
    scientific_name = serializers.CharField()
    confidence = serializers.FloatField()
    suggestions = serializers.DictField()

class DiseaseDetectionSerializer(serializers.Serializer):
    
    disease_name = serializers.CharField()
    confidence = serializers.FloatField()
    severity = serializers.CharField()
    is_healthy = serializers.BooleanField()


class PredictionCreateSerializer(serializers.ModelSerializer):
   
    class Meta:
        model = Prediction
        fields = ['image']
        
class PredictionDetailSerializer(serializers.ModelSerializer):
    
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'user', 'user_name', 'image', 
            'predicted_plant', 'plant_name',
            'predicted_disease', 'disease_name',
            'confidence', 'severity', 'is_healthy', 
            'treatment_status', 'is_plant_image', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
