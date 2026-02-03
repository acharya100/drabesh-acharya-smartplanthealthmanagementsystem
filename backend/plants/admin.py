"""
Django Admin Configuration for Plant Model

This module configures the Django admin interface for managing plant data,
providing an intuitive interface for adding and editing plant information.

Author: Smart Plant Health Team
Sprint: 3 - Plant and Disease Management
"""

from django.contrib import admin
from .models import Plant


@admin.register(Plant)
class PlantAdmin(admin.ModelAdmin):
    """
    Admin interface for Plant model with comprehensive display and filtering options.
    """
    # Fields to display in the list view
    list_display = (
        'name',
        'scientific_name',
        'family',
        'sunlight_requirement',
        'water_frequency',
        'difficulty_level',
        'is_edible',
        'created_at'
    )
    
    # Filters in the right sidebar
    list_filter = (
        'sunlight_requirement',
        'water_frequency',
        'difficulty_level',
        'is_edible',
        'is_medicinal',
        'is_toxic',
        'created_at'
    )
    
    # Fields to search
    search_fields = (
        'name',
        'scientific_name',
        'family',
        'description',
        'care_instructions'
    )
    
    # Organize fields in the edit form for better usability
    fieldsets = (
        ('Basic Information', {
            'fields': ('name', 'scientific_name', 'family', 'description')
        }),
        ('Care Requirements', {
            'fields': (
                'care_instructions',
                'sunlight_requirement',
                'water_frequency',
                'difficulty_level'
            )
        }),
        ('Environmental Conditions', {
            'fields': ('min_temperature', 'max_temperature'),
            'description': 'Temperature range in Celsius'
        }),
        ('Growth Characteristics', {
            'fields': ('growth_rate', 'mature_height')
        }),
        ('Plant Properties', {
            'fields': ('is_edible', 'is_medicinal', 'is_toxic'),
            'description': 'Special characteristics and warnings'
        }),
        ('Media', {
            'fields': ('image', 'icon'),
            'classes': ('collapse',)  # Collapsible section
        }),
    )
    
    # Read-only fields (automatically managed)
    readonly_fields = ('created_at', 'updated_at')
    
    # Default ordering in the list view
    ordering = ('name',)
