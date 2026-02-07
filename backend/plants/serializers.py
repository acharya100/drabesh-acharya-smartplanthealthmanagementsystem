"""
Serializers for Plant API
"""

from rest_framework import serializers
from .models import Plant


class PlantListSerializer(serializers.ModelSerializer):
    
    # Add computed fields for better API responses
    temperature_range = serializers.ReadOnlyField()
    is_low_maintenance = serializers.ReadOnlyField()
    
    # Display human-readable choice values
    sunlight_display = serializers.CharField(
        source='get_sunlight_requirement_display',
        read_only=True
    )
    water_frequency_display = serializers.CharField(
        source='get_water_frequency_display',
        read_only=True
    )
    difficulty_display = serializers.CharField(
        source='get_difficulty_level_display',
        read_only=True
    )
    
    class Meta:
        model = Plant
        fields = [
            'id',
            'name',
            'scientific_name',
            'family',
            'description',
            'sunlight_requirement',
            'sunlight_display',
            'water_frequency',
            'water_frequency_display',
            'difficulty_level',
            'difficulty_display',
            'temperature_range',
            'is_low_maintenance',
            'is_edible',
            'is_medicinal',
            'is_toxic',
            'image',
            'icon',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class PlantDetailSerializer(serializers.ModelSerializer):
  
    
    # Computed properties
    temperature_range = serializers.ReadOnlyField()
    is_low_maintenance = serializers.ReadOnlyField()
    
    # Display values for choice fields
    sunlight_display = serializers.CharField(
        source='get_sunlight_requirement_display',
        read_only=True
    )
    water_frequency_display = serializers.CharField(
        source='get_water_frequency_display',
        read_only=True
    )
    difficulty_display = serializers.CharField(
        source='get_difficulty_level_display',
        read_only=True
    )
    
    # Count of related diseases (without loading all disease data)
    disease_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Plant
        fields = [
            'id',
            'name',
            'scientific_name',
            'family',
            'description',
            'care_instructions',
            'sunlight_requirement',
            'sunlight_display',
            'water_frequency',
            'water_frequency_display',
            'min_temperature',
            'max_temperature',
            'temperature_range',
            'growth_rate',
            'mature_height',
            'difficulty_level',
            'difficulty_display',
            'is_low_maintenance',
            'is_edible',
            'is_medicinal',
            'is_toxic',
            'image',
            'icon',
            'disease_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_disease_count(self, obj):
       
        return obj.diseases.count()
    
    def validate_min_temperature(self, value):
       
        if value is not None and (value < -50 or value > 60):
            raise serializers.ValidationError(
                "Minimum temperature must be between -50°C and 60°C"
            )
        return value
    
    def validate_max_temperature(self, value):
      
        if value is not None and (value < -50 or value > 60):
            raise serializers.ValidationError(
                "Maximum temperature must be between -50°C and 60°C"
            )
        return value
    
    def validate(self, data):
       
        min_temp = data.get('min_temperature')
        max_temp = data.get('max_temperature')
        
        # Check if both temperatures are provided and validate their relationship
        if min_temp is not None and max_temp is not None:
            if min_temp >= max_temp:
                raise serializers.ValidationError(
                    "Minimum temperature must be less than maximum temperature"
                )
        
        return data


class PlantCreateUpdateSerializer(serializers.ModelSerializer):
   
    
    class Meta:
        model = Plant
        fields = [
            'name',
            'scientific_name',
            'family',
            'description',
            'care_instructions',
            'sunlight_requirement',
            'water_frequency',
            'min_temperature',
            'max_temperature',
            'growth_rate',
            'mature_height',
            'difficulty_level',
            'is_edible',
            'is_medicinal',
            'is_toxic',
            'image',
            'icon',
        ]
    
    def validate_name(self, value):
       
        if not value or not value.strip():
            raise serializers.ValidationError("Plant name cannot be empty")
        
        # Capitalize first letter of each word for consistency
        return value.strip().title()
    
    def validate(self, data):
       
        # Validate temperature range
        min_temp = data.get('min_temperature')
        max_temp = data.get('max_temperature')
        
        if min_temp is not None and max_temp is not None:
            if min_temp >= max_temp:
                raise serializers.ValidationError({
                    'temperature': 'Minimum temperature must be less than maximum temperature'
                })
        
        # Warn if toxic plant is marked as edible
        if data.get('is_toxic') and data.get('is_edible'):
            raise serializers.ValidationError({
                'is_edible': 'A toxic plant should not be marked as edible'
            })
        
        return data
