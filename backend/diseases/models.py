"""
Disease and Treatment Models for Smart Plant Health Management System
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from plants.models import Plant


class Disease(models.Model):
    
    # Severity level choices
    SEVERITY_CHOICES = [
        ('mild', 'Mild - Minor damage, easy to treat'),
        ('moderate', 'Moderate - Noticeable damage, requires attention'),
        ('severe', 'Severe - Significant damage, urgent treatment needed'),
        ('critical', 'Critical - Life-threatening to plant'),
    ]
    
    # Disease type/category choices
    TYPE_CHOICES = [
        ('fungal', 'Fungal Disease'),
        ('bacterial', 'Bacterial Disease'),
        ('viral', 'Viral Disease'),
        ('pest', 'Pest Infestation'),
        ('nutritional', 'Nutritional Deficiency'),
        ('environmental', 'Environmental Stress'),
    ]
    
    # Basic identification
    name = models.CharField(
        max_length=150,
        help_text="Common name of the disease (e.g., 'Tomato Late Blight')"
    )
    
    scientific_name = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Scientific name of the pathogen (e.g., 'Phytophthora infestans')"
    )
    
    disease_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='fungal',
        help_text="Category of the disease"
    )
    
    # A disease can affect multiple plants and a plant can have multiple diseases
    affected_plants = models.ManyToManyField(
        Plant,
        related_name='diseases',
        help_text="Plant species that can be affected by this disease"
    )
    
    # Disease information
    description = models.TextField(
        blank=True,
        help_text="General description of the disease and its impact"
    )
    
    symptoms = models.TextField(
        help_text="Detailed description of visible symptoms (e.g., leaf spots, wilting, discoloration)"
    )
    
    causes = models.TextField(
        blank=True,
        help_text="What causes this disease (e.g., fungal spores, bacteria, environmental conditions)"
    )
    
    # Severity and spread
    severity_level = models.CharField(
        max_length=20,
        choices=SEVERITY_CHOICES,
        default='moderate',
        help_text="How severe this disease typically is"
    )
    
    is_contagious = models.BooleanField(
        default=True,
        help_text="Whether the disease can spread to other plants"
    )
    
    spread_rate = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="How quickly the disease spreads (e.g., 'Fast', 'Moderate', 'Slow')"
    )
    
    # Prevention and conditions
    prevention_measures = models.TextField(
        blank=True,
        help_text="Steps to prevent this disease from occurring"
    )
    
    favorable_conditions = models.TextField(
        blank=True,
        help_text="Environmental conditions that favor disease development (e.g., 'High humidity, warm temperatures')"
    )
    
    # Media
    image = models.ImageField(
        upload_to='diseases/images/',
        blank=True,
        null=True,
        help_text="Image showing disease symptoms"
    )
    
    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the disease record was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the disease record was last updated"
    )
    
    class Meta:
        """Meta options for the Disease model"""
        ordering = ['name']
        verbose_name = 'Disease'
        verbose_name_plural = 'Diseases'
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['disease_type']),
            models.Index(fields=['severity_level']),
        ]
    
    def __str__(self):
        """String representation of the disease"""
        return f"{self.name} ({self.get_disease_type_display()})"
    
    @property
    def affected_plant_count(self):

        return self.affected_plants.count()
    
    @property
    def treatment_count(self):
       
        return self.treatments.count()
    
    def get_severity_color(self):
    
        severity_colors = {
            'mild': 'green',
            'moderate': 'yellow',
            'severe': 'orange',
            'critical': 'red',
        }
        return severity_colors.get(self.severity_level, 'gray')


class Treatment(models.Model):
 
    # Treatment type choices
    TYPE_CHOICES = [
        ('organic', 'Organic/Natural'),
        ('chemical', 'Chemical/Synthetic'),
        ('biological', 'Biological Control'),
        ('cultural', 'Cultural Practice'),
        ('mechanical', 'Mechanical/Physical'),
    ]
    
    # Relationship to disease
    disease = models.ForeignKey(
        Disease,
        on_delete=models.CASCADE,
        related_name='treatments',
        help_text="The disease this treatment addresses"
    )
    
    # Treatment identification
    name = models.CharField(
        max_length=200,
        help_text="Name of the treatment method"
    )
    
    treatment_type = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        default='organic',
        help_text="Category of treatment approach"
    )
    
    # Treatment details
    description = models.TextField(
        help_text="Overview of the treatment method and how it works"
    )
    
    # Step-by-step instructions stored as JSON-like text
    # Format: "1. First step\n2. Second step\n3. Third step"
    instructions = models.TextField(
        help_text="Detailed step-by-step instructions for applying the treatment"
    )
    
    # Products and materials needed
    products_needed = models.TextField(
        blank=True,
        help_text="List of products, tools, or materials needed (e.g., 'Neem oil, spray bottle, protective gloves')"
    )
    
    # Dosage and application
    dosage_instructions = models.TextField(
        blank=True,
        help_text="Specific dosage and dilution instructions if applicable"
    )
    
    application_frequency = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="How often to apply the treatment (e.g., 'Every 7 days for 3 weeks')"
    )
    
    # Effectiveness and duration
    effectiveness_rate = models.IntegerField(
        blank=True,
        null=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        help_text="Estimated effectiveness percentage (0-100)"
    )
    
    expected_duration = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Expected time to see results (e.g., '1-2 weeks')"
    )
    
    # Safety and precautions
    precautions = models.TextField(
        blank=True,
        help_text="Safety precautions and warnings (e.g., 'Wear gloves', 'Keep away from pets')"
    )
    
    # Additional information
    cost_estimate = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Approximate cost range (e.g., 'Low', 'Medium', 'High' or '$10-$20')"
    )
    
    is_preventive = models.BooleanField(
        default=False,
        help_text="Whether this treatment can be used preventively"
    )
    
    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Timestamp when the treatment was created"
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="Timestamp when the treatment was last updated"
    )
    
    class Meta:
        # Meta options for the Treatment model
        ordering = ['disease', 'treatment_type', 'name']
        verbose_name = 'Treatment'
        verbose_name_plural = 'Treatments'
        indexes = [
            models.Index(fields=['disease', 'treatment_type']),
        ]
    
    def __str__(self):
        # String representation of the treatment
        return f"{self.get_treatment_type_display()} - {self.name} for {self.disease.name}"
    
    @property
    def is_highly_effective(self):
        
        if self.effectiveness_rate:
            return self.effectiveness_rate >= 70
        return False
    
    def get_instruction_steps(self):
       
        # Split by newlines and filter out empty lines
        steps = [step.strip() for step in self.instructions.split('\n') if step.strip()]
        return steps
    
    def get_products_list(self):
       
        if not self.products_needed:
            return []
        # Split by commas or newlines
        products = [p.strip() for p in self.products_needed.replace('\n', ',').split(',') if p.strip()]
        return products
