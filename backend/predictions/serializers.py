"""
Serializers for Predictions API
Handles identification results and prediction history.

Author: Smart Plant Health Management System

"""

from rest_framework import serializers
from .models import Prediction

class PlantIdentificationSerializer(serializers.Serializer):
    """
    Serializer for the AI plant identification response.
    """
    name = serializers.CharField()
    scientific_name = serializers.CharField()
    confidence = serializers.FloatField()
    suggestions = serializers.DictField()

class DiseaseDetectionSerializer(serializers.Serializer):
    """
    Serializer for the AI disease detection response.
    """
    disease_name = serializers.CharField()
    confidence = serializers.FloatField()
    severity = serializers.CharField()
    is_healthy = serializers.BooleanField()


class PredictionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new prediction entry.
    """
    class Meta:
        model = Prediction
        fields = ['image']
        
class PredictionDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for viewing detailed prediction history.
    """
    user_name = serializers.CharField(source='user.username', read_only=True)
    plant_name = serializers.CharField(source='predicted_plant.name', read_only=True)
    disease_name = serializers.CharField(source='predicted_disease.name', read_only=True)
    
    class Meta:
        model = Prediction
        fields = [
            'id', 'user', 'user_name', 'image', 
            'predicted_plant', 'plant_name',
            'predicted_disease', 'disease_name',
            'confidence', 'severity', 'is_healthy', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at']
