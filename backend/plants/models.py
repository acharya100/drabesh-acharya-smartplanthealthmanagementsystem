"""
Plant Models for Smart Plant Health Management System

This module defines the Plant model which stores comprehensive information
about different plant species including their care requirements, growth
characteristics, and identification details.

Author: Smart Plant Health Management System
Sprint: 3 - Plant and Disease Management
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings # Import settings to access AUTH_USER_MODEL

class Plant(models.Model):
    """
    Represents a specific plant entry owned by a user.
    Each user has their own collection of plants, allowing for personalized
    tracking and management within the Smart Plant Health system.
    """
    # Each plant must be owned by a user. This ensures that when you login, 
    # you only see the plants you've added, avoiding clutter from other users.
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='plants',
        help_text="The authorized user who owns this specific plant entry"
    )
    
    # We provide a variety of choices for sunlight and water to make it easy for users
    # to select accurate care requirements for their plants.
    SUNLIGHT_CHOICES = [
        ('full_sun', 'Full Sun (6+ hours)'),
        ('partial_sun', 'Partial Sun (4-6 hours)'),
        ('partial_shade', 'Partial Shade (2-4 hours)'),
        ('full_shade', 'Full Shade (< 2 hours)'),
    ]
    
    WATER_FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('every_2_days', 'Every 2-3 Days'),
        ('weekly', 'Weekly'),
        ('bi_weekly', 'Bi-Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    DIFFICULTY_CHOICES = [
        ('beginner', 'Beginner Friendly'),
        ('intermediate', 'Intermediate'),
        ('advanced', 'Advanced'),
        ('expert', 'Expert'),
    ]
    
    # Basic identification fields
    name = models.CharField(
        max_length=100, 
        help_text="Common name of the plant (e.g., 'Tomato', 'Rose')"
    )
    
    scientific_name = models.CharField(
        max_length=150, 
        blank=True, 
        null=True,
        help_text="Scientific/botanical name (e.g., 'Solanum lycopersicum')"
    )
    
    family = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Plant family classification (e.g., 'Solanaceae')"
    )
    
    # Descriptive information
    description = models.TextField(
        blank=True,
        help_text="General description of the plant, its characteristics, and uses"
    )
    
    # Care instructions
    care_instructions = models.TextField(
        blank=True,
        help_text="Detailed care instructions including soil, fertilizer, pruning, etc."
    )
    
    # Environmental requirements
    sunlight_requirement = models.CharField(
        max_length=20,
        choices=SUNLIGHT_CHOICES,
        default='partial_sun',
        help_text="Amount of sunlight needed for optimal growth"
    )
    
    water_frequency = models.CharField(
        max_length=20,
        choices=WATER_FREQUENCY_CHOICES,
        default='weekly',
        help_text="How often the plant needs watering under normal conditions"
    )
    
    # Temperature preferences (in Celsius)
    min_temperature = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(-50), MaxValueValidator(60)],
        help_text="Minimum temperature tolerance in Celsius"
    )
    
    max_temperature = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(-50), MaxValueValidator(60)],
        help_text="Maximum temperature tolerance in Celsius"
    )
    
    # Growth characteristics
    growth_rate = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Growth rate (e.g., 'Fast', 'Moderate', 'Slow')"
    )
    
    mature_height = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Expected height at maturity (e.g., '1-2 meters')"
    )
    
    # Difficulty and maintenance
    difficulty_level = models.CharField(
        max_length=20,
        choices=DIFFICULTY_CHOICES,
        default='intermediate',
        help_text="Care difficulty level for growers"
    )
    
    # Additional characteristics
    is_edible = models.BooleanField(
        default=False,
        help_text="Whether the plant produces edible parts"
    )
    
    is_medicinal = models.BooleanField(
        default=False,
        help_text="Whether the plant has medicinal properties"
    )
    
    is_toxic = models.BooleanField(
        default=False,
        help_text="Whether the plant is toxic to humans or pets"
    )
    
    # Media
    image = models.ImageField(
        upload_to='plants/images/',
        blank=True,
        null=True,
        help_text="Primary image of the plant"
    )
    
    icon = models.ImageField(
        upload_to='plants/icons/',
        blank=True,
        null=True,
        help_text="Small icon for UI display"
    )
    
    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the plant record was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the plant record was last updated"
    )
    
    class Meta:
        """Meta options for the Plant model"""
        ordering = ['name']  # Order plants alphabetically by name
        verbose_name = 'Plant'
        verbose_name_plural = 'Plants'
        indexes = [
            models.Index(fields=['name']),  # Index for faster name searches
            models.Index(fields=['scientific_name']),  # Index for scientific name lookups
        ]
    
    def __str__(self):
        """String representation of the plant"""
        return f"{self.name} ({self.scientific_name or 'No scientific name'})"
    
    def get_sunlight_display_verbose(self):
        """
        Returns a user-friendly description of sunlight requirements
        
        Returns:
            str: Detailed sunlight requirement description
        """
        return dict(self.SUNLIGHT_CHOICES).get(self.sunlight_requirement, 'Unknown')
    
    def get_water_frequency_display_verbose(self):
        """
        Returns a user-friendly description of watering frequency
        
        Returns:
            str: Detailed watering frequency description
        """
        return dict(self.WATER_FREQUENCY_CHOICES).get(self.water_frequency, 'Unknown')
    
    @property
    def temperature_range(self):
        """
        Returns the temperature range as a formatted string
        
        Returns:
            str: Temperature range (e.g., "15-30°C") or None if not set
        """
        if self.min_temperature is not None and self.max_temperature is not None:
            return f"{self.min_temperature}-{self.max_temperature}°C"
        return None
    
    @property
    def is_low_maintenance(self):
        """
        Determines if the plant is low maintenance
        
        Returns:
            bool: True if difficulty is beginner or intermediate
        """
        return self.difficulty_level in ['beginner', 'intermediate']
