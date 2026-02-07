"""
Serializers for Disease and Treatment APIs
"""

from rest_framework import serializers
from .models import Disease, Treatment
from plants.models import Plant
from plants.serializers import PlantListSerializer


class TreatmentListSerializer(serializers.ModelSerializer):
    
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

        return obj.get_instruction_steps()
    
    def get_products_list(self, obj):
       
        return obj.get_products_list()


class DiseaseListSerializer(serializers.ModelSerializer):
   
    
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
        
        return obj.get_severity_color()


class DiseaseDetailSerializer(serializers.ModelSerializer):

    
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
       
        return obj.get_severity_color()


class DiseaseCreateUpdateSerializer(serializers.ModelSerializer):
   
    
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
        
        if not value or not value.strip():
            raise serializers.ValidationError("Disease name cannot be empty")
        
        return value.strip()
    
    def validate_symptoms(self, value):
       
        if not value or not value.strip():
            raise serializers.ValidationError(
                "Symptoms description is required for disease identification"
            )
        
        return value.strip()
    
    def validate(self, data):
       
        # Ensure contagious diseases have spread rate information
        if data.get('is_contagious') and not data.get('spread_rate'):
            raise serializers.ValidationError({
                'spread_rate': 'Spread rate should be specified for contagious diseases'
            })
        
        return data


class TreatmentCreateUpdateSerializer(serializers.ModelSerializer):
    disease = serializers.PrimaryKeyRelatedField(
        queryset=Disease.objects.all(),
        required=False,
        allow_null=True
    )
    custom_disease_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
   
    
    class Meta:
        model = Treatment
        fields = [
            'disease',
            'custom_disease_name',
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
        
        if value is not None and (value < 0 or value > 100):
            raise serializers.ValidationError(
                "Effectiveness rate must be between 0 and 100"
            )
        
        return value
    
    def validate_instructions(self, value):
       
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
    
    def validate(self, data):
        """Ensure either disease or custom_disease_name is provided."""
        if not data.get('disease') and not data.get('custom_disease_name'):
            raise serializers.ValidationError(
                "Either select an existing disease or provide a custom disease name."
            )
        return data
    
    def create(self, validated_data):
        """Handle custom disease creation if custom_disease_name is provided."""
        custom_disease_name = validated_data.pop('custom_disease_name', None)
        
        if custom_disease_name and not validated_data.get('disease'):
            # Create a new disease with the custom name
            disease, created = Disease.objects.get_or_create(
                name=custom_disease_name,
                defaults={
                    'disease_type': 'fungal',  # Default type
                    'severity_level': 'moderate',  # Default severity
                    'is_contagious': False,
                    'symptoms': f'Custom disease: {custom_disease_name}',
                }
            )
            validated_data['disease'] = disease
        
        return super().create(validated_data)



