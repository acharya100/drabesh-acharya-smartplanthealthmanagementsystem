"""
Serializers for Disease and Treatment APIs

This module defines DRF serializers for Disease and Treatment models,
providing comprehensive JSON serialization with nested relationships.

Author: Smart Plant Health Management System
Sprint: 3 - Plant and Disease Management
"""

from rest_framework import serializers
from .models import Disease, Treatment
from plants.models import Plant
from plants.serializers import PlantListSerializer


class TreatmentListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for treatment list views.
    
    Used when displaying treatments as part of disease details
    or in treatment listing endpoints.
    """
    
    # Display human-readable treatment type
    treatment_type_display = serializers.CharField(
        source='get_treatment_type_display',
        read_only=True
    )
    
    # Computed property
    is_highly_effective = serializers.ReadOnlyField()
    
    class Meta:
        model = Treatment
        fields = [
            'id',
            'name',
            'treatment_type',
            'treatment_type_display',
            'description',
            'effectiveness_rate',
            'expected_duration',
            'is_highly_effective',
            'is_preventive',
            'cost_estimate',
        ]
        read_only_fields = ['id']


class TreatmentDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for treatment detail views.
    
    Includes all treatment information including step-by-step instructions,
    products needed, and safety precautions.
    """
    
    # Display values
    treatment_type_display = serializers.CharField(
        source='get_treatment_type_display',
        read_only=True
    )
    
    # Computed properties
    is_highly_effective = serializers.ReadOnlyField()
    
    # Parsed lists for better frontend consumption
    instruction_steps = serializers.SerializerMethodField()
    products_list = serializers.SerializerMethodField()
    
    # Disease name for context
    disease_name = serializers.CharField(source='disease.name', read_only=True)
    
    class Meta:
        model = Treatment
        fields = [
            'id',
            'disease',
            'disease_name',
            'name',
            'treatment_type',
            'treatment_type_display',
            'description',
            'instructions',
            'instruction_steps',
            'products_needed',
            'products_list',
            'dosage_instructions',
            'application_frequency',
            'effectiveness_rate',
            'expected_duration',
            'is_highly_effective',
            'precautions',
            'cost_estimate',
            'is_preventive',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_instruction_steps(self, obj):
        """
        Returns instructions as a list of steps.
        
        Args:
            obj: Treatment instance
            
        Returns:
            list: List of instruction steps
        """
        return obj.get_instruction_steps()
    
    def get_products_list(self, obj):
        """
        Returns products needed as a list.
        
        Args:
            obj: Treatment instance
            
        Returns:
            list: List of products/materials
        """
        return obj.get_products_list()


class DiseaseListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for disease list views.
    
    Used for listing multiple diseases with essential information.
    Includes affected plant count and treatment count for quick overview.
    """
    
    # Display values for choice fields
    disease_type_display = serializers.CharField(
        source='get_disease_type_display',
        read_only=True
    )
    severity_display = serializers.CharField(
        source='get_severity_level_display',
        read_only=True
    )
    
    # Computed properties
    affected_plant_count = serializers.ReadOnlyField()
    treatment_count = serializers.ReadOnlyField()
    severity_color = serializers.SerializerMethodField()
    
    class Meta:
        model = Disease
        fields = [
            'id',
            'name',
            'scientific_name',
            'disease_type',
            'disease_type_display',
            'severity_level',
            'severity_display',
            'severity_color',
            'is_contagious',
            'spread_rate',
            'affected_plant_count',
            'treatment_count',
            'image',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_severity_color(self, obj):
        """
        Returns color code for severity level.
        
        Args:
            obj: Disease instance
            
        Returns:
            str: Color code for UI display
        """
        return obj.get_severity_color()


class DiseaseDetailSerializer(serializers.ModelSerializer):
    """
    Comprehensive serializer for disease detail views.
    
    Includes all disease information, affected plants, and available treatments.
    Used for single disease retrieval with complete related data.
    """
    
    # Display values
    disease_type_display = serializers.CharField(
        source='get_disease_type_display',
        read_only=True
    )
    severity_display = serializers.CharField(
        source='get_severity_level_display',
        read_only=True
    )
    
    # Nested serializers for related data
    affected_plants = PlantListSerializer(many=True, read_only=True)
    treatments = TreatmentListSerializer(many=True, read_only=True)
    
    # Computed properties
    affected_plant_count = serializers.ReadOnlyField()
    treatment_count = serializers.ReadOnlyField()
    severity_color = serializers.SerializerMethodField()
    
    class Meta:
        model = Disease
        fields = [
            'id',
            'name',
            'scientific_name',
            'disease_type',
            'disease_type_display',
            'affected_plants',
            'affected_plant_count',
            'description',
            'symptoms',
            'causes',
            'severity_level',
            'severity_display',
            'severity_color',
            'is_contagious',
            'spread_rate',
            'prevention_measures',
            'favorable_conditions',
            'image',
            'treatments',
            'treatment_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_severity_color(self, obj):
        """
        Returns color code for severity level.
        
        Args:
            obj: Disease instance
            
        Returns:
            str: Color code for UI display
        """
        return obj.get_severity_color()


class DiseaseCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating diseases.
    
    Handles many-to-many relationships with plants and includes
    comprehensive validation for disease data.
    """
    
    # Accept plant IDs for many-to-many relationship
    affected_plant_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        source='affected_plants',
        queryset=Plant.objects.all(),
        write_only=True,
        required=False
    )
    
    class Meta:
        model = Disease
        fields = [
            'name',
            'scientific_name',
            'disease_type',
            'affected_plant_ids',
            'description',
            'symptoms',
            'causes',
            'severity_level',
            'is_contagious',
            'spread_rate',
            'prevention_measures',
            'favorable_conditions',
            'image',
        ]
    
    def validate_name(self, value):
        """
        Validates disease name is properly formatted.
        
        Args:
            value: Disease name to validate
            
        Returns:
            str: Validated and cleaned name
            
        Raises:
            ValidationError: If name is invalid
        """
        if not value or not value.strip():
            raise serializers.ValidationError("Disease name cannot be empty")
        
        return value.strip()
    
    def validate_symptoms(self, value):
        """
        Ensures symptoms field is not empty.
        
        Args:
            value: Symptoms text to validate
            
        Returns:
            str: Validated symptoms
            
        Raises:
            ValidationError: If symptoms are empty
        """
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Symptoms description is required for disease identification"
            )
        
        return value.strip()
    
    def validate(self, data):
        """
        Cross-field validation for disease data.
        
        Args:
            data: Dictionary of all field values
            
        Returns:
            dict: Validated data
            
        Raises:
            ValidationError: If data is invalid
        """
        # Ensure contagious diseases have spread rate information
        if data.get('is_contagious') and not data.get('spread_rate'):
            raise serializers.ValidationError({
                'spread_rate': 'Spread rate should be specified for contagious diseases'
            })
        
        return data


class TreatmentCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating treatments.
    
    Includes validation for effectiveness rates and required fields.
    """
    
    class Meta:
        model = Treatment
        fields = [
            'disease',
            'name',
            'treatment_type',
            'description',
            'instructions',
            'products_needed',
            'dosage_instructions',
            'application_frequency',
            'effectiveness_rate',
            'expected_duration',
            'precautions',
            'cost_estimate',
            'is_preventive',
        ]
    
    def validate_effectiveness_rate(self, value):
        """
        Validates effectiveness rate is within valid range.
        
        Args:
            value: Effectiveness rate to validate
            
        Returns:
            int: Validated effectiveness rate
            
        Raises:
            ValidationError: If rate is out of range
        """
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Effectiveness rate must be between 0 and 100"
            )
        
        return value
    
    def validate_instructions(self, value):
        """
        Ensures instructions are provided and meaningful.
        
        Args:
            value: Instructions text to validate
            
        Returns:
            str: Validated instructions
            
        Raises:
            ValidationError: If instructions are insufficient
        """
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Detailed instructions are required for treatment application"
            )
        
        # Check for minimum length to ensure quality
        if len(value.strip()) < 20:
            raise serializers.ValidationError(
                "Instructions should be detailed (at least 20 characters)"
            )
        
        return value.strip()



