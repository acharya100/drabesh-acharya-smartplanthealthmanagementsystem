from rest_framework import serializers
from .models import SoilAnalysis


class SoilAnalysisSerializer(serializers.ModelSerializer):
    class Meta:
        model = SoilAnalysis
        fields = [
            'id', 'user', 'nitrogen', 'phosphorus', 'potassium',
            'ph_level', 'moisture', 'organic_matter', 'soil_type',
            'health_score', 'deficiencies', 'recommendations', 'suggested_products',
            'created_at',
        ]
        read_only_fields = [
            'id', 'user', 'health_score', 'deficiencies',
            'recommendations', 'suggested_products', 'created_at'
        ]


class SoilAnalysisInputSerializer(serializers.Serializer):
    nitrogen = serializers.FloatField(min_value=0, max_value=1000)
    phosphorus = serializers.FloatField(min_value=0, max_value=500)
    potassium = serializers.FloatField(min_value=0, max_value=1000)
    ph_level = serializers.FloatField(min_value=0, max_value=14)
    moisture = serializers.FloatField(min_value=0, max_value=100)
    organic_matter = serializers.FloatField(min_value=0, max_value=15, required=False, default=None, allow_null=True)
    soil_type = serializers.ChoiceField(choices=['sandy', 'loamy', 'clay', 'silty', 'peaty', 'chalky'])

    def validate(self, attrs):
        """Cross-field validation for realistic soil parameters."""
        ph = attrs.get('ph_level')
        if ph is not None and not (0 <= ph <= 14):
            raise serializers.ValidationError({'ph_level': 'pH must be between 0 and 14.'})

        moisture = attrs.get('moisture')
        if moisture is not None and not (0 <= moisture <= 100):
            raise serializers.ValidationError({'moisture': 'Moisture must be between 0% and 100%.'})

        organic_matter = attrs.get('organic_matter')
        if organic_matter is not None and not (0 <= organic_matter <= 15):
            raise serializers.ValidationError({'organic_matter': 'Organic matter must be between 0% and 15%.'})

        return attrs
