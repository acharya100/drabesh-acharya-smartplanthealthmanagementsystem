"""
Django Admin Configuration for Disease and Treatment Models
"""

from django.contrib import admin
from .models import Disease, Treatment


class TreatmentInline(admin.TabularInline):
   
    model = Treatment
    extra = 1  # Number of empty forms to display
    fields = ('name', 'treatment_type', 'effectiveness_rate', 'expected_duration')


@admin.register(Disease)
class DiseaseAdmin(admin.ModelAdmin):
    # Fields to display in the list view
    list_display = (
        'name',
        'disease_type',
        'severity_level',
        'is_contagious',
        'affected_plant_count',
        'treatment_count',
        'created_at'
    )
    
    # Filters in the right sidebar
    list_filter = (
        'disease_type',
        'severity_level',
        'is_contagious',
        'created_at'
    )
    
    # Fields to search
    search_fields = (
        'name',
        'scientific_name',
        'symptoms',
        'description'
    )
    
    # Fields to use for autocomplete in foreign key lookups
    filter_horizontal = ('affected_plants',)  
    
    # Inline treatments
    inlines = [TreatmentInline]
    
    # Organize fields in the edit form
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'scientific_name', 'disease_type', 'image')
        }),
        ('Affected Plants', {
            'fields': ('affected_plants',)
        }),
        ('Disease Details', {
            'fields': ('description', 'symptoms', 'causes')
        }),
        ('Severity and Spread', {
            'fields': ('severity_level', 'is_contagious', 'spread_rate')
        }),
        ('Prevention', {
            'fields': ('prevention_measures', 'favorable_conditions'),
            'classes': ('collapse',)  # Collapsible section
        }),
    )
    
    # Read-only fields (automatically managed)
    readonly_fields = ('created_at', 'updated_at')


@admin.register(Treatment)
class TreatmentAdmin(admin.ModelAdmin):
    # Fields to display in the list view
    list_display = (
        'name',
        'disease',
        'treatment_type',
        'effectiveness_rate',
        'expected_duration',
        'is_highly_effective',
        'created_at'
    )
    
    # Filters in the right sidebar
    list_filter = (
        'treatment_type',
        'is_preventive',
        'disease__disease_type',
        'disease__severity_level'
    )
    
    # Fields to search
    search_fields = (
        'name',
        'description',
        'disease__name',
        'instructions'
    )
    
    # Organize fields in the edit form
    fieldsets = (
        ('Basic Information', {
            'fields': ('disease', 'name', 'treatment_type')
        }),
        ('Treatment Details', {
            'fields': ('description', 'instructions', 'products_needed')
        }),
        ('Application', {
            'fields': ('dosage_instructions', 'application_frequency')
        }),
        ('Effectiveness', {
            'fields': ('effectiveness_rate', 'expected_duration', 'is_preventive')
        }),
        ('Safety and Cost', {
            'fields': ('precautions', 'cost_estimate'),
            'classes': ('collapse',)
        }),
    )
    
    # Read-only fields
    readonly_fields = ('created_at', 'updated_at')
