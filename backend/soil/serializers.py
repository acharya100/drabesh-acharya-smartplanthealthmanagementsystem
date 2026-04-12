from rest_framework import serializers
from .models import SoilAnalysis


class SoilAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilAnalysis
        fields = [
            'id', 'user', 'nitrogen', 'phosphorus', 'potassium',
            'ph_level', 'moisture', 'soil_type',
            'health_score', 'deficiencies', 'recommendations', 'suggested_products',
            'created_at',
        ]
        read_only_fields = ['id', 'user', 'health_score', 'deficiencies', 'recommendations', 'suggested_products', 'created_at']


class SoilAnalysisInputSerializer(serializers.Serializer):
    nitrogen = serializers.FloatField(min_value=0, max_value=1000)
    phosphorus = serializers.FloatField(min_value=0, max_value=500)
    potassium = serializers.FloatField(min_value=0, max_value=1000)
    ph_level = serializers.FloatField(min_value=0, max_value=14)
    moisture = serializers.FloatField(min_value=0, max_value=100)
    soil_type = serializers.ChoiceField(choices=['sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky'])
